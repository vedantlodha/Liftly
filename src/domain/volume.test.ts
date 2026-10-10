import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countCompletedSets,
  formatSessionDate,
  formatTonnes,
  lastSetAt,
  sessionVolume,
  summariseSession,
  type SummarisableItem,
} from './volume.ts';

const set = (weight: string, reps: string, done = true) => ({ weight, reps, done });

const bench: SummarisableItem = {
  name: 'Barbell Bench Press',
  sets: [set('80', '8'), set('80', '8'), set('80', '7'), set('75', '8', false)],
};

describe('sessionVolume', () => {
  it('sums weight × reps over completed sets', () => {
    // 80×8 + 80×8 + 80×7 = 1840; the unticked 75×8 must not count.
    assert.equal(sessionVolume([bench]), 1840);
  });

  it('ignores sets that were never ticked', () => {
    const untouched: SummarisableItem = { name: 'Squat', sets: [set('100', '5', false)] };
    assert.equal(sessionVolume([untouched]), 0);
  });

  it('counts bodyweight sets as zero rather than guessing a mass', () => {
    const pullUps: SummarisableItem = { name: 'Pull-Up', sets: [set('—', '8'), set('—', '7')] };
    assert.equal(sessionVolume([pullUps]), 0);
  });

  it('survives a half-typed cell', () => {
    // Mid-entry the keypad can leave "8." in the field; that must not become NaN.
    const partial: SummarisableItem = { name: 'Curl', sets: [set('8.', '10')] };
    assert.equal(Number.isFinite(sessionVolume([partial])), true);
  });

  it('adds up across exercises', () => {
    const curl: SummarisableItem = { name: 'Curl', sets: [set('30', '10')] };
    assert.equal(sessionVolume([bench, curl]), 1840 + 300);
  });

  it('rounds to one decimal', () => {
    const fractional: SummarisableItem = { name: 'Fly', sets: [set('12.5', '13')] };
    assert.equal(sessionVolume([fractional]), 162.5);
  });
});

describe('countCompletedSets', () => {
  it('counts only ticked sets', () => {
    assert.equal(countCompletedSets([bench]), 3);
  });
});

describe('formatSessionDate', () => {
  it('matches the design’s short form', () => {
    assert.equal(formatSessionDate(new Date(2026, 7, 14)), 'Fri 14 Aug');
  });
});

describe('summariseSession', () => {
  const startedAt = new Date(2026, 7, 14, 18, 0, 0).getTime();

  it('excludes paused time from the duration', () => {
    const summary = summariseSession(
      { name: 'Push A', items: [bench], startedAt, pausedMs: 10 * 60_000 },
      startedAt + 50 * 60_000,
      'KG',
    );
    // 50 minutes elapsed, 10 of them paused → 40 minutes of training.
    assert.equal(summary.durationMin, 40);
  });

  it('never reports a zero-minute session', () => {
    const summary = summariseSession(
      { name: 'Quick', items: [bench], startedAt, pausedMs: 0 },
      startedAt + 5_000,
      'KG',
    );
    assert.equal(summary.durationMin, 1);
  });

  it('cannot produce a negative duration if the clock jumps', () => {
    const summary = summariseSession(
      { name: 'Odd', items: [bench], startedAt, pausedMs: 999 * 60_000 },
      startedAt + 60_000,
      'KG',
    );
    assert.equal(summary.durationMin, 1);
  });

  it('reports the last completed set per exercise', () => {
    const summary = summariseSession(
      { name: 'Push A', items: [bench], startedAt, pausedMs: 0 },
      startedAt + 60_000,
      'KG',
    );
    // Third set (80 × 7) is the last one ticked, not the unticked fourth.
    assert.deepEqual(summary.rows, [{ name: 'Barbell Bench Press', value: '3 × 7 @ 80kg' }]);
  });

  it('marks an untouched exercise as skipped', () => {
    const skipped: SummarisableItem = { name: 'Cable Fly', sets: [set('15', '12', false)] };
    const summary = summariseSession(
      { name: 'Push A', items: [skipped], startedAt, pausedMs: 0 },
      startedAt + 60_000,
      'KG',
    );
    assert.deepEqual(summary.rows, [{ name: 'Cable Fly', value: 'skipped' }]);
  });

  it('labels bodyweight sets BW rather than 0kg', () => {
    const pullUps: SummarisableItem = { name: 'Pull-Up', sets: [set('—', '8')] };
    const summary = summariseSession(
      { name: 'Pull A', items: [pullUps], startedAt, pausedMs: 0 },
      startedAt + 60_000,
      'KG',
    );
    assert.deepEqual(summary.rows, [{ name: 'Pull-Up', value: '1 × 8 @ BW' }]);
  });
});

describe('formatTonnes', () => {
  it('renders kilograms as tonnes to one decimal', () => {
    assert.equal(formatTonnes(8400), '8.4');
    assert.equal(formatTonnes(0), '0.0');
  });
});

describe('lastSetAt', () => {
  const tick = (doneAt?: number, done = true) => ({ weight: '80', reps: '8', done, doneAt });

  it('is null when nothing was ticked', () => {
    assert.equal(lastSetAt([{ name: 'Squat', sets: [tick(undefined, false)] }]), null);
  });

  it('takes the latest tick, not the last set in order', () => {
    const items: SummarisableItem[] = [
      { name: 'Bench', sets: [tick(3_000), tick(1_000)] },
      { name: 'Row', sets: [tick(2_000)] },
    ];
    assert.equal(lastSetAt(items), 3_000);
  });

  it('ignores ticks on sets that were later un-ticked', () => {
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [tick(1_000), tick(9_000, false)] }];
    assert.equal(lastSetAt(items), 1_000);
  });
});

describe('summariseSession across midnight', () => {
  const startedAt = new Date(2026, 7, 11, 23, 50).getTime();
  const lastTick = new Date(2026, 7, 12, 0, 10).getTime();
  const items: SummarisableItem[] = [
    { name: 'Bench', sets: [{ weight: '80', reps: '8', done: true, doneAt: lastTick }] },
  ];

  it('files the session under the day it started', () => {
    const summary = summariseSession({ name: 'Push A', items, startedAt, pausedMs: 0 }, lastTick, 'KG');
    assert.equal(summary.when, 'Tue 11 Aug');
  });

  it('measures to the last set, not to when the session was closed', () => {
    const closedAt = new Date(2026, 7, 12, 9, 0).getTime();
    const summary = summariseSession({ name: 'Push A', items, startedAt, pausedMs: 0 }, closedAt, 'KG');
    assert.equal(summary.durationMin, 20);
    assert.equal(summary.when, 'Tue 11 Aug');
  });
});
