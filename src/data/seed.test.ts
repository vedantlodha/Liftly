import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SEED_EXERCISES } from '@/db/seed/exercises.generated.ts';
import { HISTORY, ROUTINES } from './seed.ts';

/**
 * Every exercise the demo data names must exist in the catalog.
 *
 * This is not cosmetic. `saveSession` and `seedDemoHistory` resolve exercises
 * by name and skip the ones they cannot find, so a name that drifts out of the
 * catalog does not fail loudly — the workout saves with its sets silently
 * dropped, and History shows "No sets logged". That is exactly the bug this
 * guards against.
 */
const catalog = new Set(SEED_EXERCISES.map((e) => e.name));

test('demo routines only reference catalog exercises', () => {
  const unknown = ROUTINES.flatMap((r) => r.items.map((i) => i.name)).filter((n) => !catalog.has(n));
  assert.deepEqual([...new Set(unknown)], []);
});

test('demo history only references catalog exercises', () => {
  const unknown = HISTORY.flatMap((s) => s.exercises.map((e) => e.name)).filter((n) => !catalog.has(n));
  assert.deepEqual([...new Set(unknown)], []);
});
