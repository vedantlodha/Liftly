/**
 * A workout belongs to its local start date and expires at 4am the following
 * calendar day. This allows evening workouts to continue past midnight.
 * A workout started at 1am Wednesday belongs to Wednesday and expires Thursday.
 */

import { addDays, toDateKey } from './week';

export const CLOSE_HOUR = 4;

/** Local midnight of the day a workout started — the day it is filed under. */
export function trainingDayOf(startedAt: number | Date): Date {
  const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate());
}

/** The local YYYY-MM-DD a workout is filed under. */
export function trainingDayKey(startedAt: number | Date): string {
  return toDateKey(trainingDayOf(startedAt));
}

/** Use local calendar components so the deadline stays at 4am across DST. */
export function closesAt(startedAt: number | Date): Date {
  const next = addDays(trainingDayOf(startedAt), 1);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate(), CLOSE_HOUR);
}

export function hasExpired(startedAt: number | Date, now: number | Date): boolean {
  const at = now instanceof Date ? now.getTime() : now;
  return at >= closesAt(startedAt).getTime();
}
