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

const view = (offset: number, scheduled?: Routine, log: HistorySession[] = [LOGGED]) =>
  buildDayView({ offset, now: NOW, scheduled, log, nextUp: 'Push A on Monday' });

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

  test('a future day is never treated as logged, even on a date collision', () => {
    // Sunday the 16th cannot have a log, so a stray entry is ignored.
    const stray = { ...LOGGED, date: 'Sun 16 Aug' };
    assert.equal(view(2, undefined, [stray]).isLogged, false);
  });

  test('rest-day copy differs by direction', () => {
    assert.equal(view(0, undefined).restSub, 'Nothing scheduled. Next up is Push A on Monday.');
    assert.equal(view(-4, undefined).restTitle, 'Nothing logged');
    assert.equal(view(-4, undefined).restSub, 'No session recorded on this day.');
    assert.equal(view(1, undefined).restTitle, 'Rest day');
    assert.equal(view(1, undefined).restSub, 'No workout scheduled for this day.');
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
