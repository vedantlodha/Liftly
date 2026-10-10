import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { closesAt, hasExpired, trainingDayKey } from './trainingDay.ts';

/** Local wall-clock, so tests never depend on the machine's timezone. */
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

const TUE = [2026, 8, 11] as const;
const WED = [2026, 8, 12] as const;

describe('trainingDayKey', () => {
  it('files a session under the calendar day it started on', () => {
    assert.equal(trainingDayKey(at(...TUE, 18, 0)), '2026-08-11');
    assert.equal(trainingDayKey(at(...WED, 7, 0)), '2026-08-12');
  });

  it('splits at midnight, not at the 4am close', () => {
    assert.equal(trainingDayKey(at(...TUE, 23, 59)), '2026-08-11');
    assert.equal(trainingDayKey(at(...WED, 0, 1)), '2026-08-12');
  });

  it('files an early-hours session under that day, not the evening before', () => {
    assert.equal(trainingDayKey(at(...WED, 1, 0)), '2026-08-12');
    assert.equal(trainingDayKey(at(...WED, 3, 59)), '2026-08-12');
  });
});

describe('closesAt', () => {
  it('closes an evening session at 4am the next morning', () => {
    assert.deepEqual(closesAt(at(...TUE, 18, 0)), at(...WED, 4, 0));
  });

  it('gives a session started before midnight the same deadline as that morning’s', () => {
    assert.deepEqual(closesAt(at(...TUE, 23, 50)), at(...WED, 4, 0));
    assert.deepEqual(closesAt(at(...TUE, 7, 0)), at(...WED, 4, 0));
  });

  it('gives a session started after midnight the whole of its own day', () => {
    assert.deepEqual(closesAt(at(...WED, 1, 0)), at(2026, 8, 13, 4, 0));
  });

  it('treats 3:59am and 4:01am as the same day', () => {
    assert.deepEqual(closesAt(at(...WED, 3, 59)), at(2026, 8, 13, 4, 0));
    assert.deepEqual(closesAt(at(...WED, 4, 1)), at(2026, 8, 13, 4, 0));
    assert.equal(trainingDayKey(at(...WED, 3, 59)), trainingDayKey(at(...WED, 4, 1)));
  });
});

describe('hasExpired', () => {
  const started = at(...TUE, 18, 0);

  it('holds a session open right up to the close', () => {
    assert.equal(hasExpired(started, at(...TUE, 23, 59)), false);
    assert.equal(hasExpired(started, at(...WED, 0, 30)), false);
    assert.equal(hasExpired(started, at(...WED, 3, 59)), false);
  });

  it('closes it on the stroke of 4am', () => {
    assert.equal(hasExpired(started, at(...WED, 4, 0)), true);
    assert.equal(hasExpired(started, at(...WED, 4, 1)), true);
  });

  it('leaves an after-midnight session live through its own day', () => {
    const early = at(...WED, 1, 0);
    assert.equal(hasExpired(early, at(...WED, 4, 0)), false);
    assert.equal(hasExpired(early, at(...WED, 20, 0)), false);
    assert.equal(hasExpired(early, at(2026, 8, 13, 4, 0)), true);
  });

  it('is not fooled by a long-abandoned session', () => {
    assert.equal(hasExpired(at(2026, 7, 1, 18, 0), at(...WED, 9, 0)), true);
  });

  it('stays on local 4am across a DST transition', () => {
    // US DST ends 2026-11-01; a fixed-hour offset would shift the deadline.
    assert.deepEqual(closesAt(at(2026, 10, 31, 19, 0)), at(2026, 11, 1, 4, 0));
    assert.equal(hasExpired(at(2026, 10, 31, 19, 0), at(2026, 11, 1, 3, 30)), false);
  });
});
