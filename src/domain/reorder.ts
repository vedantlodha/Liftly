/**
 * Geometry for drag-to-reorder in the routine builder.
 *
 * Kept pure so the maths is testable without a gesture: the hook feeds it a
 * drag distance and the measured row heights, and gets back the slot the row
 * would drop into.
 */

/** Vertical gap between builder rows, matching the list's `gap: 8`. */
export const ROW_GAP = 8;

/**
 * Which index a row dragged by `dy` should land on.
 *
 * A row claims the next slot once it has travelled past that neighbour's
 * midpoint, so the swap happens under the finger rather than after it.
 */
export function reorderTarget(from: number, dy: number, heights: readonly number[]): number {
  const span = (i: number) => (heights[i] ?? 0) + ROW_GAP;
  let target = from;
  let travelled = 0;

  if (dy > 0) {
    for (let i = from + 1; i < heights.length; i++) {
      travelled += span(i);
      if (dy >= travelled - span(i) / 2) target = i;
      else break;
    }
  } else if (dy < 0) {
    for (let i = from - 1; i >= 0; i--) {
      travelled += span(i);
      if (-dy >= travelled - span(i) / 2) target = i;
      else break;
    }
  }

  return target;
}

/**
 * How far a row that is *not* being dragged has to move out of the way.
 *
 * Every displaced row shifts by the dragged row's own height, because that is
 * the gap it leaves behind and the space it needs at its destination.
 */
export function reorderShift(index: number, from: number, to: number, draggedHeight: number): number {
  if (from === to || index === from) return 0;
  const step = draggedHeight + ROW_GAP;
  if (from < to && index > from && index <= to) return -step;
  if (from > to && index >= to && index < from) return step;
  return 0;
}

/** Moves one item, returning a new array. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...items];
  next.splice(to, 0, moved);
  return next;
}
