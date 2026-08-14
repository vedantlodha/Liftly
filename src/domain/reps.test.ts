import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatBuilderWeight,
  isSteppableReps,
  shiftReps,
  shiftSets,
  shiftWeight,
} from './reps.ts';

describe('shiftReps', () => {
  it('nudges a plain count', () => {
    assert.equal(shiftReps('10', 1), '11');
    assert.equal(shiftReps('10', -1), '9');
  });

  it('clamps at 1 and 60', () => {
    assert.equal(shiftReps('1', -1), '1');
    assert.equal(shiftReps('60', 1), '60');
    assert.equal(shiftReps('58', 5), '60');
  });

  it('leaves a range untouched — targets are absolute counts now', () => {
    // Legacy data could still hold one; it must not be silently reinterpreted.
    assert.equal(shiftReps('6–8', 1), '6–8');
  });

  it('leaves a distance or duration target alone', () => {
    // "500m" parses as 500 — the stepper must not swallow the unit.
    assert.equal(shiftReps('500m', 1), '500m');
    assert.equal(shiftReps('30s', -1), '30s');
    assert.equal(shiftReps('AMRAP', 1), 'AMRAP');
  });
});

describe('isSteppableReps', () => {
  it('recognises plain counts only', () => {
    assert.equal(isSteppableReps('12'), true);
    assert.equal(isSteppableReps('6–8'), false);
    assert.equal(isSteppableReps('500m'), false);
    assert.equal(isSteppableReps('30s'), false);
  });
});

describe('shiftWeight', () => {
  it('moves in 2.5 steps', () => {
    assert.equal(shiftWeight(80, 1), 82.5);
    assert.equal(shiftWeight(80, -1), 77.5);
  });

  it('never goes negative', () => {
    assert.equal(shiftWeight(0, -1), 0);
    assert.equal(shiftWeight(2.5, -1), 0);
  });

  it('does not accumulate float error', () => {
    let w = 0;
    for (let i = 0; i < 10; i++) w = shiftWeight(w, 1);
    assert.equal(w, 25);
  });
});

describe('formatBuilderWeight', () => {
  it('shows bodyweight rather than zero', () => {
    assert.equal(formatBuilderWeight(0), 'BW');
    assert.equal(formatBuilderWeight(60), '60');
    assert.equal(formatBuilderWeight(62.5), '62.5');
  });
});

describe('shiftSets', () => {
  it('clamps between 1 and 10', () => {
    assert.equal(shiftSets(3, 1), 4);
    assert.equal(shiftSets(1, -1), 1);
    assert.equal(shiftSets(10, 1), 10);
  });
});
