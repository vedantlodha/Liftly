import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { moveItem, reorderShift, reorderTarget, ROW_GAP } from './reorder.ts';

// Four rows, 100pt each — one slot is 108pt with the gap.
const EVEN = [100, 100, 100, 100];
const SLOT = 100 + ROW_GAP;

describe('reorderTarget', () => {
  test('stays put when barely moved', () => {
    assert.equal(reorderTarget(1, 0, EVEN), 1);
    assert.equal(reorderTarget(1, 20, EVEN), 1);
    assert.equal(reorderTarget(1, -20, EVEN), 1);
  });

  test('claims the next slot past its midpoint', () => {
    assert.equal(reorderTarget(1, SLOT / 2, EVEN), 2);
    assert.equal(reorderTarget(1, -SLOT / 2, EVEN), 0);
  });

  test('crosses two slots', () => {
    assert.equal(reorderTarget(0, SLOT * 1.5, EVEN), 2);
    assert.equal(reorderTarget(3, -SLOT * 1.5, EVEN), 1);
  });

  test('cannot be dragged past either end', () => {
    assert.equal(reorderTarget(3, SLOT * 10, EVEN), 3);
    assert.equal(reorderTarget(0, -SLOT * 10, EVEN), 0);
  });

  test("uses each row's own height when they differ", () => {
    // A tall second row has to be crossed further before it gives way.
    const uneven = [100, 200, 100];
    assert.equal(reorderTarget(0, 80, uneven), 0);
    assert.equal(reorderTarget(0, 110, uneven), 1);
  });
});

describe('reorderShift', () => {
  test('rows between the source and a lower target move up', () => {
    assert.equal(reorderShift(1, 0, 2, 100), -SLOT);
    assert.equal(reorderShift(2, 0, 2, 100), -SLOT);
    assert.equal(reorderShift(3, 0, 2, 100), 0);
  });

  test('rows between the source and a higher target move down', () => {
    assert.equal(reorderShift(1, 3, 1, 100), SLOT);
    assert.equal(reorderShift(2, 3, 1, 100), SLOT);
    assert.equal(reorderShift(0, 3, 1, 100), 0);
  });

  test('the dragged row is never shifted — it follows the finger', () => {
    assert.equal(reorderShift(0, 0, 2, 100), 0);
  });

  test('nothing moves when the target is the source', () => {
    assert.equal(reorderShift(1, 1, 1, 100), 0);
  });
});

describe('moveItem', () => {
  test('moves down', () => {
    assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  });

  test('moves up', () => {
    assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c']);
  });

  test('is a no-op onto itself', () => {
    assert.deepEqual(moveItem(['a', 'b', 'c'], 1, 1), ['a', 'b', 'c']);
  });

  test('leaves the input untouched', () => {
    const items = ['a', 'b', 'c'];
    moveItem(items, 0, 2);
    assert.deepEqual(items, ['a', 'b', 'c']);
  });
});
