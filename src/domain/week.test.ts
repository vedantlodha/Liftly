import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addDays,
  dayIndex,
  isOverrideActive,
  isOverridden,
  resolveDayRoutineId,
  stripOffsets,
  toDateKey,
  weekStartKey,
  type SchedulableDay,
} from './week.ts';

/** Local-midnight date, so tests never depend on the machine's timezone. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe('dayIndex', () => {
  it('is Monday-first, unlike Date.getDay()', () => {
    // 2026-08-10 is a Monday.
    assert.equal(dayIndex(at(2026, 8, 10)), 0);
    assert.equal(dayIndex(at(2026, 8, 14)), 4); // Friday
    assert.equal(dayIndex(at(2026, 8, 16)), 6); // Sunday
  });
});

describe('weekStartKey', () => {
  it('returns the Monday of the containing week', () => {
    for (const day of [10, 11, 12, 13, 14, 15, 16]) {
      assert.equal(weekStartKey(at(2026, 8, day)), '2026-08-10');
    }
  });

  it('treats Sunday as the end of its week, not the start', () => {
    assert.equal(weekStartKey(at(2026, 8, 16)), '2026-08-10');
    assert.equal(weekStartKey(at(2026, 8, 17)), '2026-08-17');
  });

  it('crosses month and year boundaries', () => {
    assert.equal(weekStartKey(at(2026, 9, 2)), '2026-08-31');
    assert.equal(weekStartKey(at(2027, 1, 1)), '2026-12-28');
  });
});

describe('toDateKey', () => {
  it('zero-pads and uses local components', () => {
    assert.equal(toDateKey(at(2026, 1, 5)), '2026-01-05');
  });

  it('does not shift the date near midnight', () => {
    // toISOString() would roll this into the next day in any timezone west of UTC.
    assert.equal(toDateKey(new Date(2026, 7, 14, 23, 30)), '2026-08-14');
  });
});

describe('isOverrideActive', () => {
  const friday = at(2026, 8, 14);

  it('holds for an override stamped with this week’s Monday', () => {
    assert.equal(isOverrideActive('2026-08-10', friday), true);
  });

  it('lapses for last week’s override — the revert the prototype never did', () => {
    assert.equal(isOverrideActive('2026-08-03', friday), false);
  });

  it('is inactive when unset', () => {
    assert.equal(isOverrideActive(null, friday), false);
    assert.equal(isOverrideActive(undefined, friday), false);
  });
});

describe('resolveDayRoutineId', () => {
  const plan = (over: Partial<SchedulableDay> = {}): SchedulableDay => ({
    routineId: 'saved-legs',
    overrideRoutineId: null,
    overrideIsRest: false,
    overrideWeekStart: null,
    ...over,
  });

  const thisWeek = at(2026, 8, 14); // Fri, week of Mon 2026-08-10

  it('uses the saved plan when there is no override', () => {
    assert.equal(resolveDayRoutineId(plan(), thisWeek), 'saved-legs');
  });

  it('uses a live override', () => {
    const day = plan({ overrideRoutineId: 'temp-push', overrideWeekStart: '2026-08-10' });
    assert.equal(resolveDayRoutineId(day, thisWeek), 'temp-push');
  });

  it('falls back to the saved plan once the week turns over', () => {
    const day = plan({ overrideRoutineId: 'temp-push', overrideWeekStart: '2026-08-10' });
    // Same override, read one week later.
    assert.equal(resolveDayRoutineId(day, at(2026, 8, 21)), 'saved-legs');
  });

  it('distinguishes "this week, rest" from "no override"', () => {
    // A null overrideRoutineId alone is ambiguous, which is why overrideIsRest exists.
    const restThisWeek = plan({ overrideIsRest: true, overrideWeekStart: '2026-08-10' });
    assert.equal(resolveDayRoutineId(restThisWeek, thisWeek), null);

    const noOverride = plan({ overrideIsRest: false, overrideWeekStart: null });
    assert.equal(resolveDayRoutineId(noOverride, thisWeek), 'saved-legs');
  });

  it('lets a stale rest override lapse too', () => {
    const day = plan({ overrideIsRest: true, overrideWeekStart: '2026-08-03' });
    assert.equal(resolveDayRoutineId(day, thisWeek), 'saved-legs');
  });

  it('reports the override state for the THIS WK badge', () => {
    const live = plan({ overrideRoutineId: 'temp-push', overrideWeekStart: '2026-08-10' });
    assert.equal(isOverridden(live, thisWeek), true);
    assert.equal(isOverridden(live, at(2026, 8, 21)), false);
  });
});

describe('stripOffsets', () => {
  it('runs from -14 through the end of the current week', () => {
    const offsets = stripOffsets(at(2026, 8, 14)); // Friday, dayIndex 4
    assert.equal(offsets[0], -14);
    assert.equal(offsets.at(-1), 2); // Sat, Sun remain
    assert.equal(offsets.length, 17);
  });

  it('ends on the day itself when it is Sunday', () => {
    assert.equal(stripOffsets(at(2026, 8, 16)).at(-1), 0);
  });
});

describe('addDays', () => {
  it('crosses a month boundary', () => {
    assert.equal(toDateKey(addDays(at(2026, 8, 31), 1)), '2026-09-01');
    assert.equal(toDateKey(addDays(at(2026, 9, 1), -1)), '2026-08-31');
  });

  it('stays on local midnight across a DST transition', () => {
    // US DST ends 2026-11-01; adding a day must not land at 23:00 the day before.
    assert.equal(toDateKey(addDays(at(2026, 10, 31), 2)), '2026-11-02');
  });
});
