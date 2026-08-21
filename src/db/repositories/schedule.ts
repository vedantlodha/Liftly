/**
 * The weekly plan, and the "just this week" override.
 *
 * The override rule itself lives in `src/domain/week.ts` as a pure function, so
 * it is unit-tested independently of SQLite. This module only stores and reads.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';

import { resolveDayIsRest, resolveDayRoutineId, isOverridden, weekStartKey, type DayIndex } from '@/domain/week';
import type { Db } from '../client';
import { routines, scheduleDays } from '../schema';

export type ResolvedDay = {
  dayIndex: DayIndex;
  /** What this day actually resolves to right now — override if live, else the plan. */
  routineId: string | null;
  routineName: string | null;
  /** True while a this-week-only change is in effect. Drives the THIS WK badge. */
  overridden: boolean;
  /** The saved weekly plan, ignoring any override. */
  savedRoutineId: string | null;
  /** With no routine: true is a chosen rest day, false is a day never set. */
  isRest: boolean;
};

/** All seven days, Mon first, with overrides resolved against `now`. */
export async function getWeek(db: Db, now = new Date()): Promise<ResolvedDay[]> {
  const rows = await db
    .select({ day: scheduleDays })
    .from(scheduleDays)
    .where(isNull(scheduleDays.deletedAt))
    .orderBy(asc(scheduleDays.dayOfWeek));

  const names = new Map(
    (await db.select({ id: routines.id, name: routines.name }).from(routines).where(isNull(routines.deletedAt))).map(
      (r) => [r.id, r.name],
    ),
  );

  return rows.map(({ day }) => {
    const routineId = resolveDayRoutineId(day, now);
    return {
      dayIndex: day.dayOfWeek as DayIndex,
      routineId,
      routineName: routineId ? (names.get(routineId) ?? null) : null,
      overridden: isOverridden(day, now),
      savedRoutineId: day.routineId,
      isRest: resolveDayIsRest(day, now),
    };
  });
}

/** The single day that is today. */
export async function getToday(db: Db, now = new Date()): Promise<ResolvedDay | null> {
  const week = await getWeek(db, now);
  const index = (now.getDay() + 6) % 7;
  return week.find((d) => d.dayIndex === index) ?? null;
}

/**
 * Changes the saved weekly plan and clears any override on that day — the user
 * has just stated what the day should always be, so a leftover temporary change
 * would silently outrank it.
 */
export async function setDayPlan(
  db: Db,
  dayIndex: DayIndex,
  routineId: string | null,
  /** True for a chosen rest day, false for a day cleared back to blank. */
  isRest: boolean,
): Promise<void> {
  await db
    .update(scheduleDays)
    .set({
      routineId,
      isRest,
      overrideRoutineId: null,
      overrideIsRest: false,
      overrideWeekStart: null,
      updatedAt: new Date(),
    })
    .where(eq(scheduleDays.dayOfWeek, dayIndex));
}

/**
 * Changes a day for the current week only.
 *
 * Stamps the week's Monday, which is what makes the change lapse on its own —
 * there is no job to run and nothing to clean up.
 */
export async function setDayOverride(
  db: Db,
  dayIndex: DayIndex,
  routineId: string | null,
  /** True for a chosen rest day, false for a day cleared back to blank. */
  isRest: boolean,
  now = new Date(),
): Promise<void> {
  await db
    .update(scheduleDays)
    .set({
      overrideRoutineId: routineId,
      // Distinguishes "this week, rest" from "this week, nothing at all".
      overrideIsRest: isRest,
      overrideWeekStart: weekStartKey(now),
      updatedAt: new Date(),
    })
    .where(eq(scheduleDays.dayOfWeek, dayIndex));
}

/** Drops a this-week change, reverting to the saved plan immediately. */
export async function clearDayOverride(db: Db, dayIndex: DayIndex): Promise<void> {
  await db
    .update(scheduleDays)
    .set({ overrideRoutineId: null, overrideIsRest: false, overrideWeekStart: null, updatedAt: new Date() })
    .where(and(eq(scheduleDays.dayOfWeek, dayIndex), isNull(scheduleDays.deletedAt)));
}
