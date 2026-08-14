/**
 * Verifies the data layer end to end, under Node. Run with `pnpm db:verify`.
 *
 * Applies the real generated migration to an in-memory database and runs the
 * real seeding code through the real Drizzle schema, so a broken migration,
 * schema or seed fails here rather than on a phone.
 *
 * Uses sql.js — pure WASM, so no native build step and no build-script
 * approval. Node's built-in `node:sqlite` was the first choice but it has no
 * raw-row mode, and joined tables sharing a column name (`id`, `position`,
 * `created_at`) silently collapse into one another.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

import { PREFILL_DEMO_DATA } from '../src/config.ts';
import type { Db } from '../src/db/client.ts';
import { getRoutineByName, listRoutines } from '../src/db/repositories/routines.ts';
import { getToday, getWeek, setDayOverride, setDayPlan } from '../src/db/repositories/schedule.ts';
import { upsertRoutine } from '../src/db/repositories/routines.ts';
import { deleteSession, listSessions, saveSession } from '../src/db/repositories/sessions.ts';
import { getSetting, setSetting, SETTING_KEYS } from '../src/db/repositories/settings.ts';
import * as schema from '../src/db/schema.ts';
import { initDatabase } from '../src/db/seed/core.ts';
import { SEED_EXERCISES } from '../src/db/seed/exercises.generated.ts';
import { STARTER_ROUTINES } from '../src/db/seed/starter.ts';

const require = createRequire(import.meta.url);
const SQL = await initSqlJs({ locateFile: (f: string) => require.resolve(`sql.js/dist/${f}`) });
const sqlite = new SQL.Database();
sqlite.run('PRAGMA foreign_keys = ON;');

// ── apply every migration, in journal order ──────────────────
// Reading the journal rather than naming a file means a newly generated
// migration is exercised here automatically instead of silently skipped.
type Journal = { entries: { idx: number; tag: string }[] };
const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')) as Journal;
let applied = 0;
for (const entry of [...journal.entries].sort((a, b) => a.idx - b.idx)) {
  // drizzle-kit separates statements with its own breakpoint marker.
  const statements = readFileSync(`drizzle/${entry.tag}.sql`, 'utf8')
    .split('--> statement-breakpoint')
    .map((x) => x.trim())
    .filter(Boolean);
  for (const stmt of statements) sqlite.run(stmt);
  applied += statements.length;
  console.log(`  ${entry.tag}: ${statements.length} statements`);
}
console.log(`applied ${applied} statements from ${journal.entries.length} migration(s)`);

// sql.js and expo-sqlite are both synchronous Drizzle drivers with the same
// query surface, so the app's Db type applies to the harness too.
const db = drizzle(sqlite, { schema }) as unknown as Db;

// ── run the real seed ────────────────────────────────────────
await initDatabase(db, randomUUID);

// ── assertions ───────────────────────────────────────────────
const failures: string[] = [];
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = String(actual) === String(expected);
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
  if (!ok) failures.push(label);
};

const one = async (q: Promise<{ n: number }[]>) => Number((await q)[0]?.n ?? 0);

console.log('\nseeded rows');
check('exercises', await one(db.select({ n: sql<number>`count(*)` }).from(schema.exercises)), SEED_EXERCISES.length);
check(
  'exercise_params',
  await one(db.select({ n: sql<number>`count(*)` }).from(schema.exerciseParams)),
  SEED_EXERCISES.reduce((a, e) => a + e.params.length, 0),
);
const expectedRoutines = PREFILL_DEMO_DATA ? STARTER_ROUTINES.length : 0;
const expectedItems = PREFILL_DEMO_DATA ? STARTER_ROUTINES.reduce((a, r) => a + r.items.length, 0) : 0;
check('routines', await one(db.select({ n: sql<number>`count(*)` }).from(schema.routines)), expectedRoutines);
check('routine_items', await one(db.select({ n: sql<number>`count(*)` }).from(schema.routineItems)), expectedItems);
check(
  'demo history seeded',
  await one(db.select({ n: sql<number>`count(*)` }).from(schema.sessions)),
  PREFILL_DEMO_DATA ? 4 : 0,
);
check('schedule_days', await one(db.select({ n: sql<number>`count(*)` }).from(schema.scheduleDays)), 7);

// Re-running must be a no-op, not a duplicate — this is what makes a catalog
// update safe to apply on every launch.
console.log('\nidempotency (second initDatabase)');
await initDatabase(db, randomUUID);
check('exercises after re-run', await one(db.select({ n: sql<number>`count(*)` }).from(schema.exercises)), SEED_EXERCISES.length);
check('routines after re-run', await one(db.select({ n: sql<number>`count(*)` }).from(schema.routines)), expectedRoutines);
check(
  'exercise_params after re-run',
  await one(db.select({ n: sql<number>`count(*)` }).from(schema.exerciseParams)),
  SEED_EXERCISES.reduce((a, e) => a + e.params.length, 0),
);

// Everything below reads the demo routines, so it only applies when they exist.
if (!PREFILL_DEMO_DATA) {
  console.log('\nskipping routine + override checks — PREFILL_DEMO_DATA is off');
  console.log('\nok — migration, schema and catalog verified');
  process.exit(failures.length ? 1 : 0);
}

// A real read the Today screen will make: today's routine with its exercises.
console.log('\nquery — Push A with its exercises');
const pushA = await db
  .select({ item: schema.routineItems, exercise: schema.exercises })
  .from(schema.routines)
  .innerJoin(schema.routineItems, eq(schema.routineItems.routineId, schema.routines.id))
  .innerJoin(schema.exercises, eq(schema.exercises.id, schema.routineItems.exerciseId))
  .where(eq(schema.routines.name, 'Push A'))
  .orderBy(schema.routineItems.position);
check('exercise count', pushA.length, 5);
for (const r of pushA) {
  console.log(
    `    ${r.item.position + 1}. ${r.exercise.name} — ${r.item.targetSets} × ${r.item.targetReps}` +
      ` @ ${r.item.targetWeightKg ?? 'BW'}kg  [${r.exercise.loggingShape}, ${r.exercise.equipment}]`,
  );
}

console.log('\nlogging shapes across the catalog');
const shapes = await db
  .select({ shape: schema.exercises.loggingShape, n: sql<number>`count(*)` })
  .from(schema.exercises)
  .groupBy(schema.exercises.loggingShape);
for (const s of [...shapes].sort((a, b) => Number(b.n) - Number(a.n))) {
  console.log(`    ${String(s.n).padStart(4)}  ${s.shape}`);
}

// ── repositories ─────────────────────────────────────────────
console.log('\nrepositories');
const summaries = await listRoutines(db);
check('listRoutines count', summaries.length, 5);
const pushASummary = summaries.find((r) => r.name === 'Push A');
check('Push A exerciseCount', pushASummary?.exerciseCount, 5);
check('Push A setCount', pushASummary?.setCount, 16);

const legs = await getRoutineByName(db, 'Legs');
check('getRoutineByName items', legs?.items.length, 5);
check('items are ordered', legs?.items.map((i) => i.position).join(','), '0,1,2,3,4');
check('item carries its exercise', legs?.items[0]?.exercise.name, 'Back Squat');

// Friday of the week starting Mon 2026-08-10.
const friday = new Date(2026, 7, 14);
const week = await getWeek(db, friday);
check('getWeek days', week.length, 7);
check('Fri resolves to the plan', week[4]?.routineName, 'Push B');
check('Wed is a rest day', week[2]?.routineName, null);
check('nothing overridden yet', week.filter((d) => d.overridden).length, 0);

// ── the override rule, end to end ────────────────────────────
console.log('\nthis-week override');
const legsId = legs!.id;
await setDayOverride(db, 4, legsId, friday);
const overridden = await getToday(db, friday);
check('Fri now resolves to the override', overridden?.routineName, 'Legs');
check('Fri is flagged as overridden', overridden?.overridden, true);
check('saved plan is untouched', (await getWeek(db, friday))[4]?.savedRoutineId, week[4]?.routineId);

// Same row, read one week later. This is the revert the prototype promised in
// copy but never implemented — no job runs, the stamp simply stops matching.
const nextFriday = new Date(2026, 7, 21);
const later = await getToday(db, nextFriday);
check('override lapses next week', later?.routineName, 'Push B');
check('badge clears next week', later?.overridden, false);

// A permanent change must also clear any lingering override.
await setDayOverride(db, 4, legsId, friday);
await setDayPlan(db, 4, legsId);
const afterPlan = await getToday(db, friday);
check('setDayPlan wins over an override', afterPlan?.routineName, 'Legs');
check('setDayPlan clears the override flag', afterPlan?.overridden, false);

// ── persistence round-trip ──────────────────────────────────
console.log('\npersistence');

await setSetting(db, SETTING_KEYS.defaultWeightUnit, 'LB');
check('setting saved', await getSetting(db, SETTING_KEYS.defaultWeightUnit), 'LB');
await setSetting(db, SETTING_KEYS.defaultWeightUnit, 'KG');
check('setting overwritten, not duplicated', await getSetting(db, SETTING_KEYS.defaultWeightUnit), 'KG');

// Create a routine the way the builder does.
await upsertRoutine(db, randomUUID, {
  name: 'Upper A',
  tag: 'Custom',
  items: [
    { exerciseName: 'Barbell Bench Press', sets: 4, reps: '6', weightKg: 85 },
    { exerciseName: 'Pull-Up', sets: 3, reps: '8', weightKg: null },
  ],
});
const created = await getRoutineByName(db, 'Upper A');
check('routine created', created?.items.length, 2);
check('bodyweight item stores null, not 0', created?.items[1]?.targetWeightKg, null);

// Editing replaces items wholesale rather than appending.
await upsertRoutine(
  db,
  randomUUID,
  { name: 'Upper A', tag: 'Custom', items: [{ exerciseName: 'Barbell Bench Press', sets: 5, reps: '5', weightKg: 90 }] },
  'Upper A',
);
const edited = await getRoutineByName(db, 'Upper A');
check('edit replaces items', edited?.items.length, 1);
check('edit keeps the same routine id', edited?.id, created?.id);
check('edited target persisted', edited?.items[0]?.targetSets, 5);

// Save a finished session, then read the log back. Counted relative to the
// demo log, which seedStarterData also writes when prefill is on.
const baselineSessions = (await listSessions(db)).length;
const startedAt = new Date(2026, 7, 14, 18, 0, 0);
await saveSession(db, randomUUID, {
  id: 'session-test-1',
  name: 'Upper A',
  routineId: edited!.id,
  startedAt,
  endedAt: new Date(startedAt.getTime() + 45 * 60_000),
  pausedMs: 5 * 60_000,
  exercises: [
    {
      name: 'Barbell Bench Press',
      targetSnapshot: '5 × 5 @ 90kg',
      sets: [
        { reps: 5, weightKg: 90, durationSec: null, distanceM: null },
        { reps: 5, weightKg: 90, durationSec: null, distanceM: null },
      ],
    },
    {
      name: 'Pull-Up',
      targetSnapshot: '3 × 8',
      sets: [{ reps: 8, weightKg: null, durationSec: null, distanceM: null }],
    },
  ],
});

const log = await listSessions(db);
check('session saved', log.length, baselineSessions + 1);
check('session name', log.find((x) => x.id === 'session-test-1')?.name, 'Upper A');
const saved = log.find((x) => x.id === 'session-test-1');
check('exercises kept in order', saved?.exercises.map((e) => e.name).join(', '), 'Barbell Bench Press, Pull-Up');
check('sets round-tripped', saved?.exercises[0]?.sets.length, 2);
check('weight round-tripped', saved?.exercises[0]?.sets[0]?.weightKg, 90);
check('bodyweight set kept as null', saved?.exercises[1]?.sets[0]?.weightKg, null);
check('paused time preserved', saved?.pausedMs, 5 * 60_000);

// An unknown exercise must not lose the whole workout.
await saveSession(db, randomUUID, {
  id: 'session-test-2',
  name: 'Ad-hoc',
  routineId: null,
  startedAt,
  endedAt: new Date(startedAt.getTime() + 60_000),
  pausedMs: 0,
  exercises: [
    { name: 'Not In The Catalog', targetSnapshot: null, sets: [{ reps: 1, weightKg: 1, durationSec: null, distanceM: null }] },
    { name: 'Plank', targetSnapshot: null, sets: [{ reps: null, weightKg: null, durationSec: 45, distanceM: null }] },
  ],
});
const withUnknown = (await listSessions(db)).find((s) => s.id === 'session-test-2');
check('unknown exercise skipped, session still saved', withUnknown?.exercises.length, 1);
check('surviving exercise is the known one', withUnknown?.exercises[0]?.name, 'Plank');
check('duration set round-tripped', withUnknown?.exercises[0]?.sets[0]?.durationSec, 45);

await deleteSession(db, 'session-test-2');
check('deleted session leaves the log', (await listSessions(db)).length, baselineSessions + 1);

if (failures.length) {
  console.log(`\n✗ ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nok — migration, schema and seed all verified');
