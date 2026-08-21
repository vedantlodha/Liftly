import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { fillDown, type FillableSet } from './sets.ts';

const set = (over: Partial<FillableSet> = {}): FillableSet => ({
  weight: '—',
  reps: '10',
  done: false,
  ...over,
});

describe('fillDown', () => {
  test('copies the completed set into the ones after it', () => {
    const sets = [set({ weight: '60', reps: '8', done: true }), set(), set()];
    const next = fillDown(sets, 0);
    assert.deepEqual(
      next.map((s) => `${s.weight}×${s.reps}`),
      ['60×8', '60×8', '60×8'],
    );
  });

  test('leaves earlier sets alone — they already happened', () => {
    const sets = [set({ weight: '50', reps: '5' }), set({ weight: '60', reps: '8', done: true }), set()];
    const next = fillDown(sets, 1);
    assert.equal(next[0]?.weight, '50');
    assert.equal(next[2]?.weight, '60');
  });

  test('never overwrites a set the user has typed into', () => {
    const sets = [
      set({ weight: '60', reps: '8', done: true }),
      set({ weight: '70', reps: '5', touched: true }),
      set(),
    ];
    const next = fillDown(sets, 0);
    assert.equal(next[1]?.weight, '70', 'a deliberate value survives');
    assert.equal(next[2]?.weight, '60', 'an untouched one is filled');
  });

  test('never overwrites a set already logged', () => {
    const sets = [set({ weight: '60', reps: '8', done: true }), set({ weight: '40', reps: '12', done: true }), set()];
    assert.equal(fillDown(sets, 0)[1]?.weight, '40');
  });

  test('the completed set itself is untouched', () => {
    const sets = [set({ weight: '60', reps: '8', done: true }), set()];
    assert.equal(fillDown(sets, 0)[0], sets[0]);
  });

  test('an out-of-range index changes nothing', () => {
    const sets = [set(), set()];
    assert.deepEqual(fillDown(sets, 9), sets);
  });

  test('does not mutate the input', () => {
    const sets = [set({ weight: '60', done: true }), set()];
    fillDown(sets, 0);
    assert.equal(sets[1]?.weight, '—');
  });
});
