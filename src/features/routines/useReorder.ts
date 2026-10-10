import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { moveItem, reorderShift, reorderTarget } from '@/domain/reorder';

/** Edge band width in pixels. */
const EDGE_BAND = 90;
/** Pixels per tick at the very edge. Ramps up across the band. */
const MAX_STEP = 14;
const TICK_MS = 16;

/** `ScrollView`'s type omits the measure methods its instances carry. */
function measureTop(node: ScrollView | null, onTop: (y: number) => void): void {
  const measurable = node as unknown as {
    measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
  } | null;
  measurable?.measureInWindow?.((_x, y) => onTop(y));
}

export type ReorderHandlers = {
  /** Non-null only while a row is under the finger. */
  drag: { from: number; to: number } | null;
  onMeasure: (index: number, height: number) => void;
  onDragStart: (index: number) => void;
  /** `absoluteY` is the finger's position on screen, for edge auto-scroll. */
  onDragMove: (dy: number, absoluteY: number) => void;
  onDragEnd: () => void;
  /** How far the row at `index` must move aside right now. */
  shiftFor: (index: number) => number;
  /** Scroll distance since drag start; add to translation to keep the row under the finger. */
  scrollDelta: SharedValue<number>;
  scrollProps: {
    ref: React.RefObject<ScrollView | null>;
    gestureAware: true;
    scrollEnabled: boolean;
    scrollEventThrottle: number;
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onLayout: (e: LayoutChangeEvent) => void;
    onContentSizeChange: (w: number, h: number) => void;
  };
};

/**
 * Drag-to-reorder state for a vertical list.
 *
 * Row heights are collected from layout rather than assumed, because a long
 * exercise name wraps and makes its row taller than its neighbours.
 */
export function useReorder(onCommit: (from: number, to: number) => void): ReorderHandlers {
  const heights = useRef<number[]>([]);
  // Mirrored in a ref so the gesture callbacks can read the live value without
  // re-creating themselves on every move.
  const current = useRef<{ from: number; to: number } | null>(null);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollY = useRef(0);
  const viewport = useRef(0);
  /** Where the list starts on screen — the gesture reports window coordinates. */
  const viewportTop = useRef(0);
  const contentHeight = useRef(0);
  const scrollAtStart = useRef(0);
  const scrollDelta = useSharedValue(0);
  const autoStep = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDy = useRef(0);

  const onMeasure = useCallback((index: number, height: number) => {
    heights.current[index] = height;
  }, []);

  const recomputeTarget = useCallback(() => {
    const active = current.current;
    if (!active) return;
    const effective = lastDy.current + (scrollY.current - scrollAtStart.current);
    const to = reorderTarget(active.from, effective, heights.current);
    if (to === active.to) return;
    current.current = { from: active.from, to };
    setDrag(current.current);
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoStep.current = 0;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (timer.current) return;
    timer.current = setInterval(() => {
      const step = autoStep.current;
      if (step === 0 || !scrollRef.current) return;
      const max = Math.max(0, contentHeight.current - viewport.current);
      const next = Math.min(max, Math.max(0, scrollY.current + step));
      if (next === scrollY.current) return;
      scrollY.current = next;
      scrollRef.current.scrollTo({ y: next, animated: false });
      scrollDelta.value = next - scrollAtStart.current;
      recomputeTarget();
    }, TICK_MS);
  }, [recomputeTarget, scrollDelta]);

  const onDragStart = useCallback(
    (index: number) => {
      scrollAtStart.current = scrollY.current;
      scrollDelta.value = 0;
      lastDy.current = 0;
      current.current = { from: index, to: index };
      setDrag(current.current);
    },
    [scrollDelta],
  );

  const onDragMove = useCallback(
    (dy: number, absoluteY: number) => {
      if (!current.current) return;
      lastDy.current = dy;

      const y = absoluteY - viewportTop.current;
      const topOver = EDGE_BAND - y;
      const bottomOver = y - (viewport.current - EDGE_BAND);

      // Increase speed toward the edge to allow precise placement farther in.
      const ramp = (over: number) => Math.ceil((Math.min(over, EDGE_BAND) / EDGE_BAND) * MAX_STEP);
      if (topOver > 0) autoStep.current = -ramp(topOver);
      else if (bottomOver > 0) autoStep.current = ramp(bottomOver);
      else autoStep.current = 0;

      if (autoStep.current !== 0) startAutoScroll();
      else stopAutoScroll();

      recomputeTarget();
    },
    [recomputeTarget, startAutoScroll, stopAutoScroll],
  );

  const onDragEnd = useCallback(() => {
    stopAutoScroll();
    const active = current.current;
    current.current = null;
    scrollDelta.value = 0;
    setDrag(null);
    if (active && active.to !== active.from) {
      onCommit(active.from, active.to);
      // Preserve measurements in the new order: layout may not fire before the next drag.
      heights.current = moveItem(heights.current, active.from, active.to);
    }
  }, [onCommit, scrollDelta, stopAutoScroll]);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  const shiftFor = useCallback(
    (index: number) =>
      drag ? reorderShift(index, drag.from, drag.to, heights.current[drag.from] ?? 0) : 0,
    [drag],
  );

  return {
    drag,
    onMeasure,
    onDragStart,
    onDragMove,
    onDragEnd,
    shiftFor,
    scrollDelta,
    scrollProps: {
      ref: scrollRef,
      gestureAware: true,
      // Letting the list scroll itself mid-drag would fight the auto-scroll.
      scrollEnabled: drag == null,
      scrollEventThrottle: 16,
      onScroll: (e) => {
        // Auto-scroll already updated scrollY. Lagging native events would rewind it.
        if (current.current) return;
        scrollY.current = e.nativeEvent.contentOffset.y;
      },
      onLayout: (e) => {
        viewport.current = e.nativeEvent.layout.height;
        // Match the gesture's window coordinates, not the parent-relative layout.y.
        measureTop(scrollRef.current, (y) => {
          viewportTop.current = y;
        });
      },
      onContentSizeChange: (_w, h) => {
        contentHeight.current = h;
      },
    },
  };
}
