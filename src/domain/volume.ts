/**
 * Session aggregation — what the summary screen and the week stats report.
 *
 * Pure and unit-tested: these numbers are the record of a workout, and getting
 * them wrong is worse than not showing them.
 */

import { NO_VALUE, unitLabel, type WeightUnit } from '@/stores/useUnits';

/** The shape this module needs, so it does not depend on the store. */
export type SummarisableSet = { weight: string; reps: string; done: boolean };
export type SummarisableItem = { name: string; sets: SummarisableSet[]; unit?: WeightUnit };

export type SessionSummary = {
  name: string;
  /** "Fri 14 Aug" */
  when: string;
  /** Whole minutes, floored at 1 — a logged session is never "0m". */
  durationMin: number;
  setsCompleted: number;
  /**
   * Raw sum of weight × reps.
   *
   * Per the design, a unit labels the number the user typed rather than
   * converting it, so this total is only meaningful when the session's
   * exercises share a unit. A session mixing KG and LB adds them directly and
   * reports the result under `volumeLabel`.
   */
  volume: number;
  /** "kg volume" / "lb volume", from the app's default unit. */
  volumeLabel: string;
  rows: { name: string; value: string }[];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A weight cell that is a real number. Bodyweight sets carry the em dash. */
function numericWeight(weight: string): number {
  if (weight === NO_VALUE) return 0;
  const n = Number(weight);
  return Number.isFinite(n) ? n : 0;
}

function numericReps(reps: string): number {
  const n = parseInt(reps, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Total load moved.
 *
 * Only completed sets count — an untouched planned set is an intention, not
 * work done. Bodyweight sets contribute zero because the app does not know the
 * lifter's mass; counting them as zero is honest, whereas guessing would
 * silently corrupt every trend built on this number.
 *
 * Skipped exercises need no special case: skipping clears their ticks.
 */
export function sessionVolume(items: readonly SummarisableItem[]): number {
  let total = 0;
  for (const item of items) {
    for (const set of item.sets) {
      if (!set.done) continue;
      total += numericWeight(set.weight) * numericReps(set.reps);
    }
  }
  return Math.round(total * 10) / 10;
}

export function countCompletedSets(items: readonly SummarisableItem[]): number {
  return items.reduce((n, item) => n + item.sets.filter((s) => s.done).length, 0);
}

export function formatSessionDate(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Per-exercise line for the summary card. */
function summariseItem(item: SummarisableItem): { name: string; value: string } {
  const done = item.sets.filter((s) => s.done);
  if (done.length === 0) return { name: item.name, value: 'skipped' };
  // The last completed set is the one worth reporting — it is where the lifter
  // finished, not where they warmed up.
  const last = done[done.length - 1]!;
  const weight = last.weight === NO_VALUE ? 'BW' : `${last.weight}${unitLabel(item.unit ?? 'KG')}`;
  return { name: item.name, value: `${done.length} × ${last.reps} @ ${weight}` };
}

export function summariseSession(
  input: {
    name: string;
    items: readonly SummarisableItem[];
    startedAt: number;
    pausedMs: number;
  },
  endedAt: number,
  unit: WeightUnit,
): SessionSummary {
  const activeMs = Math.max(0, endedAt - input.startedAt - input.pausedMs);
  return {
    name: input.name,
    when: formatSessionDate(new Date(endedAt)),
    // Paused time is excluded, so the duration reflects training, not elapsed clock.
    durationMin: Math.max(1, Math.round(activeMs / 60_000)),
    setsCompleted: countCompletedSets(input.items),
    volume: sessionVolume(input.items),
    volumeLabel: `${unitLabel(unit)} volume`,
    rows: input.items.map(summariseItem),
  };
}

/** Tonnes to one decimal, as the week stats show it. */
export function formatTonnes(volume: number): string {
  return (volume / 1000).toFixed(1);
}
