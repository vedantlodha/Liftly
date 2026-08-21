import { useRef } from 'react';

/**
 * True the first time a surface asks, false ever after.
 *
 * Backs the one-off hint that nudges a row sideways to reveal swipe-to-delete.
 * A gesture with no affordance is undiscoverable, but a hint that replays every
 * visit is an irritation — so it fires once per surface per app run.
 *
 * Deliberately module state rather than storage: it should return on a fresh
 * launch, when the user may well have forgotten.
 */
const shown = new Set<string>();

export function usePeekOnce(key: string, enabled = true): boolean {
  // Captured on first render so re-renders do not re-trigger the animation.
  const claimed = useRef<boolean | null>(null);
  if (claimed.current === null) {
    claimed.current = enabled && !shown.has(key);
    if (claimed.current) shown.add(key);
  }
  return claimed.current;
}

/** Test hook — lets a surface hint again. */
export function resetPeek(key?: string): void {
  if (key) shown.delete(key);
  else shown.clear();
}
