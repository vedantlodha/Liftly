import { useCallback, useRef, useState } from 'react';

import { reorderShift, reorderTarget } from '@/domain/reorder';

export type ReorderHandlers = {
  /** Non-null only while a row is under the finger. */
  drag: { from: number; to: number } | null;
  onMeasure: (index: number, height: number) => void;
  onDragStart: (index: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  /** How far the row at `index` must move aside right now. */
  shiftFor: (index: number) => number;
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

  const onMeasure = useCallback((index: number, height: number) => {
    heights.current[index] = height;
  }, []);

  const onDragStart = useCallback((index: number) => {
    current.current = { from: index, to: index };
    setDrag(current.current);
  }, []);

  const onDragMove = useCallback((dy: number) => {
    const active = current.current;
    if (!active) return;
    const to = reorderTarget(active.from, dy, heights.current);
    if (to === active.to) return;
    current.current = { from: active.from, to };
    setDrag(current.current);
  }, []);

  const onDragEnd = useCallback(() => {
    const active = current.current;
    current.current = null;
    setDrag(null);
    if (active && active.to !== active.from) {
      onCommit(active.from, active.to);
      // Heights are indexed by position, so they no longer describe the list.
      heights.current = [];
    }
  }, [onCommit]);

  const shiftFor = useCallback(
    (index: number) =>
      drag ? reorderShift(index, drag.from, drag.to, heights.current[drag.from] ?? 0) : 0,
    [drag],
  );

  return { drag, onMeasure, onDragStart, onDragMove, onDragEnd, shiftFor };
}
