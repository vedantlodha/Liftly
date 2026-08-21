import { create } from 'zustand';

import { PREFILL_DEMO_DATA } from '@/config';
import { WEEK } from '@/data/seed';
import {
  isOverridden,
  resolveDayIsRest,
  resolveDayRoutineId,
  weekStartKey,
  type DayIndex,
  type SchedulableDay,
} from '@/domain/week';
import { persist } from '@/db/persistence';
import { getRoutineByName } from '@/db/repositories/routines';
import { setDayOverride, setDayPlan } from '@/db/repositories/schedule';

/**
 * The weekly plan, in memory.
 *
 * Deliberately holds the same shape as the `schedule_days` table and defers
 * every override decision to `src/domain/week.ts`, so moving to SQLite is a
 * change of data source rather than of behaviour. Nothing here re-implements
 * the rollover rule.
 *
 * "Id" is currently a routine *name* — seed data has no ids, and the
 * `/routine/[id]` route uses names for the same reason.
 */

export type ScheduleEntry = SchedulableDay & { dayIndex: DayIndex };

export type ResolvedDay = {
  dayIndex: DayIndex;
  /** What this day is right now, override included. `null` means no routine. */
  routineId: string | null;
  /** With no routine: true is a chosen rest day, false is a day never set. */
  isRest: boolean;
  /** True while a this-week-only change applies. */
  overridden: boolean;
};

type ScheduleState = {
  days: ScheduleEntry[];
  /** Replaces the saved plan and clears any override on that day. */
  setPlan: (day: DayIndex, routineId: string | null, isRest: boolean) => void;
  /** Changes a day for the current week only. */
  setOverride: (day: DayIndex, routineId: string | null, isRest: boolean, now?: Date) => void;
};

/**
 * Seven days always exist — the plan is a fixed grid the user edits, not a list
 * they build. Only the *content* is demo data; a real install has every day as
 * rest until something is scheduled.
 */
const initial: ScheduleEntry[] = Array.from({ length: 7 }, (_, i) => ({
  dayIndex: i as DayIndex,
  routineId: PREFILL_DEMO_DATA ? (WEEK[i]?.routine ?? null) : null,
  // The demo plan's empty days are a deliberate five-day split; a real install
  // starts with nothing configured at all, which reads differently.
  isRest: PREFILL_DEMO_DATA && !WEEK[i]?.routine,
  overrideRoutineId: null,
  overrideIsRest: false,
  overrideWeekStart: null,
}));

export const useSchedule = create<ScheduleState>((set) => ({
  days: initial,

  setPlan: (day, routineId, isRest) => {
    persist(async (db) => {
      const routine = routineId ? await getRoutineByName(db, routineId) : null;
      await setDayPlan(db, day, routine?.id ?? null, isRest);
    });
    set((s) => ({
      days: s.days.map((d) =>
        d.dayIndex !== day
          ? d
          : {
              ...d,
              routineId,
              // Rest is a decision; blank is the absence of one, and they are
              // told apart here rather than inferred from a null routine.
              isRest,
              // A permanent change outranks a leftover temporary one, which
              // would otherwise silently keep winning.
              overrideRoutineId: null,
              overrideIsRest: false,
              overrideWeekStart: null,
            },
      ),
    }));
  },

  setOverride: (day, routineId, isRest, now = new Date()) => {
    persist(async (db) => {
      const routine = routineId ? await getRoutineByName(db, routineId) : null;
      await setDayOverride(db, day, routine?.id ?? null, isRest, now);
    });
    set((s) => ({
      days: s.days.map((d) =>
        d.dayIndex !== day
          ? d
          : {
              ...d,
              overrideRoutineId: routineId,
              // Distinguishes "this week, rest" from "this week, nothing".
              overrideIsRest: isRest,
              // The stamp is what makes the change lapse on its own.
              overrideWeekStart: weekStartKey(now),
            },
      ),
    }));
  },
}));

/** Resolves all seven days against `now`. */
export function resolveWeek(days: readonly ScheduleEntry[], now: Date): ResolvedDay[] {
  return days.map((d) => ({
    dayIndex: d.dayIndex,
    routineId: resolveDayRoutineId(d, now),
    isRest: resolveDayIsRest(d, now),
    overridden: isOverridden(d, now),
  }));
}
