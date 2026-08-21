import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { HistorySession } from '@/data/seed';
import { lastPerformed } from './lastPerformed.ts';

const session = (name: string, exercises: { name: string; sets: string[] }[]): HistorySession => ({
  id: name,
  name,
  date: 'Mon 10 Aug',
  duration: '58m',
  setCount: '10',
  volume: '4.0t',
  startedAt: '18:00',
  exercises,
});

describe('lastPerformed', () => {
  test('finds the exercise in the most recent session that has it', () => {
    const log = [
      session('Push B', [{ name: 'Skull Crusher', sets: ['30 × 10'] }]),
      session('Push A', [{ name: 'Barbell Bench Press', sets: ['80 × 8', '80 × 7'] }]),
    ];
    assert.equal(lastPerformed(log, 'Barbell Bench Press'), '80 × 8');
  });

  test('crosses routines — any workout counts', () => {
    // Logged under Push A, asked for while running a brand-new routine.
    const log = [session('Legs', [{ name: 'Back Squat', sets: ['110 × 5'] }])];
    assert.equal(lastPerformed(log, 'Back Squat'), '110 × 5');
  });

  test('newest wins when several sessions have it', () => {
    const log = [
      session('today', [{ name: 'Pull-Up', sets: ['BW × 9'] }]),
      session('older', [{ name: 'Pull-Up', sets: ['BW × 6'] }]),
    ];
    assert.equal(lastPerformed(log, 'Pull-Up'), 'BW × 9');
  });

  test('skips a session that logged the exercise with no sets', () => {
    const log = [
      session('skipped it', [{ name: 'Cable Fly', sets: [] }]),
      session('did it', [{ name: 'Cable Fly', sets: ['15 × 12'] }]),
    ];
    assert.equal(lastPerformed(log, 'Cable Fly'), '15 × 12');
  });

  test('null when never logged', () => {
    assert.equal(lastPerformed([session('a', [{ name: 'Leg Press', sets: ['100 × 10'] }])], 'Deadlift'), null);
    assert.equal(lastPerformed([], 'Anything'), null);
  });
});
