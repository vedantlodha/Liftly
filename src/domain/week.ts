/**
 * Week arithmetic and the "just this week" override rule.
 *
 * The prototype carries a boolean `tw` flag and tells the user overrides
 * "revert Monday" — but nothing ever reverts them, because a boolean cannot
 * know which week it belongs to. Here an override stores the Monday it was made
 * in, and simply stops applying once that date is no longer the current week's
 * Monday. No cleanup job, no scheduled task: the revert is a consequence of
 * reading the date, so it cannot drift or fail to run.
 *
 * Everything is local-time. Which day it is at the gym is a local question, and
 * a UTC week boundary would flip the plan at the wrong moment.
 */

/** Mon = 0 … Sun = 6, matching `schedule_days.day_of_week`. */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Mon = 0, unlike `Date.getDay()` where Sun = 0. */
export function dayIndex(date: Date): DayIndex {
  return ((date.getDay() + 6) % 7) as DayIndex;
}

/** Local YYYY-MM-DD. Avoids `toISOString`, which would shift across the date line. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The Monday of `date`'s week, as YYYY-MM-DD. Stamped onto an override. */
export function weekStartKey(date: Date): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayIndex(date));
  return toDateKey(monday);
}

/**
 * Whether an override still applies.
 *
 * An override made last week is simply not this week's Monday, so it lapses on
 * its own the moment the week turns over.
 */
export function isOverrideActive(overrideWeekStart: string | null | undefined, now: Date): boolean {
  return overrideWeekStart != null && overrideWeekStart === weekStartKey(now);
}

/** Just the fields of a schedule row this rule needs. */
export type SchedulableDay = {
  routineId: string | null;
  /** True when the saved plan deliberately makes this a rest day. */
  isRest: boolean;
  overrideRoutineId: string | null;
  overrideIsRest: boolean;
  overrideWeekStart: string | null;
};

/**
 * What a given day resolves to right now — the live override if it belongs to
 * this week, otherwise the saved weekly plan. `null` means a rest day.
 *
 * `overrideIsRest` exists because a null `overrideRoutineId` is ambiguous: it
 * cannot distinguish "this week, rest" from "no override at all".
 */
export function resolveDayRoutineId(day: SchedulableDay, now: Date): string | null {
  if (isOverrideActive(day.overrideWeekStart, now)) {
    return day.overrideIsRest ? null : day.overrideRoutineId;
  }
  return day.routineId;
}

/**
 * Whether a day with no routine is one the user chose to rest on.
 *
 * A day can be empty for two different reasons — "recovery day" or "never got
 * round to it" — and the app says something different for each. Only meaningful
 * when `resolveDayRoutineId` returns null.
 */
export function resolveDayIsRest(day: SchedulableDay, now: Date): boolean {
  if (isOverrideActive(day.overrideWeekStart, now)) return day.overrideIsRest;
  return day.isRest;
}

/** True when the day is showing a this-week-only change — drives the THIS WK badge. */
export function isOverridden(day: SchedulableDay, now: Date): boolean {
  return isOverrideActive(day.overrideWeekStart, now);
}

/** Offsets from `from` covering `back` days before it through the end of that week. */
export function stripOffsets(from: Date, back = 14): number[] {
  const offsets: number[] = [];
  for (let off = -back; off <= 6 - dayIndex(from); off++) offsets.push(off);
  return offsets;
}

/** `date` shifted by whole days, preserving local midnight. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
