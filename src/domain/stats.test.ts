import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { parseLogDate, weekTotals } from './stats.ts';

// Friday 14 August 2026 — the week runs Mon 10 Aug to Sun 16 Aug.
const NOW = new Date(2026, 7, 14, 19, 0, 0);

const entry = (date: string, setCount: string, volume: string) => ({ date, setCount, volume });

describe('parseLogDate', () => {
  test('reads a log date against the current year', () => {
    assert.deepEqual(parseLogDate('Mon 10 Aug', NOW), new Date(2026, 7, 10));
  });

  test('rolls back a year rather than reading December as the future', () => {
    const january = new Date(2026, 0, 5);
    assert.deepEqual(parseLogDate('Wed 31 Dec', january), new Date(2025, 11, 31));
  });

  test('returns null on an unparseable date', () => {
    assert.equal(parseLogDate('sometime', NOW), null);
  });
});

describe('weekTotals', () => {
  test('counts only sessions inside the current week', () => {
    const totals = weekTotals(
      [
        entry('Fri 14 Aug', '16', '8.4t'),
        entry('Mon 10 Aug', '13', '4.7t'),
        // Sunday the 9th belongs to the previous week.
        entry('Sun 9 Aug', '10', '2.6t'),
      ],
      NOW,
    );
    assert.deepEqual(totals, { sessions: 2, sets: 29, tonnes: 13.1 });
  });

  test('includes Sunday, the last day of the week', () => {
    assert.equal(weekTotals([entry('Sun 16 Aug', '5', '1.0t')], NOW).sessions, 1);
  });

  test('reads a raw kilogram volume as tonnes', () => {
    assert.equal(weekTotals([entry('Fri 14 Aug', '5', '1560')], NOW).tonnes, 1.6);
  });

  test('is zero on an empty log', () => {
    assert.deepEqual(weekTotals([], NOW), { sessions: 0, sets: 0, tonnes: 0 });
  });
});
