import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { HistorySession, Routine } from '@/data/seed';
import { buildDayView, logKeyFor } from './dayView.ts';

// Friday 14 August 2026.
const NOW = new Date(2026, 7, 14, 19, 0, 0);

const ROUTINE: Routine = {
  name: 'Push B',
  tag: 'Shoulder-led press day',
  items: [
    { name: 'Standing Barbell Overhead Press', sets: 4, reps: '6', weight: 50, last: '50 × 6' },
    { name: 'Skull Crusher', sets: 3, reps: '10', weight: 30, last: '30 × 10' },
  ],
};

const LOGGED: HistorySession = {
  id: 'session-1',
  name: 'Legs',
  date: 'Wed 12 Aug',
  duration: '58m',
  setCount: '17',
  volume: '15.7t',
  startedAt: '18:12',
  exercises: [{ name: 'Back Squat', sets: ['110 × 5', '110 × 5', '100 × 6'] }],
};

const view = (
  offset: number,
  scheduled?: Routine,
  log: HistorySession[] = [LOGGED],
  extra: { isRest?: boolean; hasRoutines?: boolean; nextUp?: string } = {},
) =>
  buildDayView({
    offset,
    now: NOW,
    scheduled,
    log,
    nextUp: extra.nextUp ?? 'Push A on Monday',
    isRest: extra.isRest ?? false,
    hasRoutines: extra.hasRoutines ?? true,
  });

describe('logKeyFor', () => {
  test('matches the format history stores', () => {
    assert.equal(logKeyFor(new Date(2026, 7, 12)), 'Wed 12 Aug');
  });
});

describe('buildDayView', () => {
  test('today is editable and shows the plan', () => {
    const v = view(0, ROUTINE);
    assert.equal(v.kicker, 'Today’s session');
    assert.equal(v.isToday, true);
    assert.equal(v.isLogged, false);
    assert.equal(v.title, 'Push B');
    assert.equal(v.meta, 'Shoulder-led press day · 2 exercises · ~46 min');
    assert.deepEqual(v.rows[0], { name: 'Standing Barbell Overhead Press', detail: '4 × 6' });
  });

  test('a past day with a log reads as history, not a plan', () => {
    const v = view(-2, ROUTINE);
    assert.equal(v.kicker, 'Logged · Wed 12 Aug');
    assert.equal(v.isToday, false);
    assert.equal(v.isLogged, true);
    // History wins over whatever was scheduled for that weekday.
    assert.equal(v.title, 'Legs');
    assert.equal(v.meta, '58m · 17 sets · 15.7t moved');
    assert.deepEqual(v.rows, [{ name: 'Back Squat', detail: '3 sets · 100 × 6' }]);
  });

  test('a past day with no log falls back to what was scheduled', () => {
    const v = view(-3, ROUTINE);
    assert.equal(v.kicker, 'Scheduled · Tue 11 Aug');
    assert.equal(v.isLogged, false);
    assert.equal(v.title, 'Push B');
  });

  test('a future day is upcoming', () => {
    const v = view(2, ROUTINE);
    assert.equal(v.kicker, 'Upcoming · Sun 16 Aug');
    assert.equal(v.isToday, false);
    assert.equal(v.isLogged, false);
  });

  test('today shows its own log once the workout is finished', () => {
    // Finished today, so the card reports what was done rather than offering
    // to start the same session over.
    const todayLog = { ...LOGGED, date: 'Fri 14 Aug', name: 'Push B' };
    const v = view(0, ROUTINE, [todayLog]);
    assert.equal(v.isLogged, true);
    assert.equal(v.title, 'Push B');
    assert.equal(v.meta, '58m · 17 sets · 15.7t moved');
    // Still today, so the kicker does not switch to a date.
    assert.equal(v.kicker, 'Today’s session');
  });

  test('today with no log still offers the plan', () => {
    assert.equal(view(0, ROUTINE, []).isLogged, false);
    assert.equal(view(0, ROUTINE, []).meta, 'Shoulder-led press day · 2 exercises · ~46 min');
  });

  test('a future day is never treated as logged, even on a date collision', () => {
    // Sunday the 16th cannot have a log, so a stray entry is ignored.
    const stray = { ...LOGGED, date: 'Sun 16 Aug' };
    assert.equal(view(2, undefined, [stray]).isLogged, false);
  });

  test('rest-day copy differs by direction', () => {
    assert.equal(view(-4, undefined).restTitle, 'Nothing logged');
    assert.equal(view(-4, undefined).restSub, 'No session recorded on this day.');
  });

  test('a chosen rest day reads differently from a day never set', () => {
    assert.equal(view(0, undefined, [], { isRest: true }).restTitle, 'Rest day');
    assert.equal(view(0, undefined, [], { isRest: true }).restSub, 'Recovery day. Next up is Push A on Monday.');
    assert.equal(view(0, undefined, [], { isRest: false }).restTitle, 'No routine added');
    assert.equal(
      view(0, undefined, [], { isRest: false }).restSub,
      'Nothing scheduled for today. Pick a workout or take the rest.',
    );
  });

  test('with no routines at all, today points at building one', () => {
    assert.equal(
      view(0, undefined, [], { hasRoutines: false }).restSub,
      'No routines yet. Build one and put it on a day to get started.',
    );
  });

  test('a rest day with nothing ahead does not promise a next session', () => {
    assert.equal(
      view(0, undefined, [], { isRest: true, nextUp: 'nothing' }).restSub,
      'Recovery day — nothing else scheduled.',
    );
  });

  test('a future rest day describes itself rather than the plan', () => {
    assert.equal(view(1, undefined, [], { isRest: true }).restSub, 'Recovery, walk, stretch.');
    assert.equal(view(1, undefined, [], { isRest: false }).restSub, 'No routine added to this day yet.');
  });

  test('a rest day has no meta line, which is what switches the card', () => {
    assert.equal(view(0, undefined).meta, null);
    assert.deepEqual(view(0, undefined).rows, []);
  });

  test('the eyebrow names the selected day, not today', () => {
    assert.equal(view(0, ROUTINE).label, 'FRI · 14 AUG');
    assert.equal(view(-5, ROUTINE).label, 'SUN · 9 AUG');
  });

  test('a single logged set is not pluralised', () => {
    const one = { ...LOGGED, exercises: [{ name: 'Back Squat', sets: ['110 × 5'] }] };
    assert.equal(view(-2, ROUTINE, [one]).rows[0]?.detail, '1 set · 110 × 5');
  });
});
