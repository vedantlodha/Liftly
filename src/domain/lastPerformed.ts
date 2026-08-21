import type { HistorySession } from '@/data/seed';

/**
 * What you last did on an exercise, across every workout.
 *
 * Deliberately not scoped to the routine you are currently running. A bench
 * press is a bench press whether it came up in Push A, Push B or a freestyle
 * session — the useful number is the last one you actually lifted, not the last
 * one you lifted *under this routine's name*. Scoping it to the routine meant a
 * newly built routine showed "no history" for exercises you had trained for
 * months.
 *
 * Returns the session's first set for that exercise, which is conventionally
 * the top set, or null when the exercise has never been logged.
 */
export function lastPerformed(
  log: readonly HistorySession[],
  exercise: string,
): string | null {
  // `log` is newest-first: hydration orders by start time descending and
  // finishing a workout prepends.
  for (const session of log) {
    const match = session.exercises.find((e) => e.name === exercise);
    const top = match?.sets[0];
    if (top) return top;
  }
  return null;
}
