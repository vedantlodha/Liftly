/**
 * Seeding logic, with the ID generator injected.
 *
 * Kept free of any Expo import so the verification harness can run this exact
 * code under Node against the exact same migration — see scripts/verify-db.ts.
 * `src/db/seed/index.ts` is the app-facing wrapper that binds `expo-crypto`.
 */

import { eq, sql } from 'drizzle-orm';

import { PREFILL_DEMO_DATA } from '@/config';
import type { Db } from '../client';
import { exerciseParams, exercises, routineItems, routines, scheduleDays } from '../schema';
import { SEED_EXERCISES } from './exercises.generated';
import { STARTER_ROUTINES, STARTER_WEEK } from './starter';
import { HISTORY } from '@/data/seed';
import { sessionExercises, sessionSets, sessions } from '../schema';

export type MakeId = () => string;

/**
 * Upserts the catalog into `exercises` and `exercise_params`.
 *
 * Idempotent and safe to run on every launch — that is how a catalog update
 * reaches an existing install. User-created exercises (`is_custom`) have their
 * own IDs and are never touched, since the catalog does not know about them.
 */
export async function syncCatalog(db: Db, makeId: MakeId): Promise<void> {
  for (const e of SEED_EXERCISES) {
    await db
      .insert(exercises)
      .values({
        id: e.id,
        name: e.name,
        catalogGroup: e.catalogGroup,
        equipment: e.equipment,
        equipmentRaw: e.equipmentRaw,
        loggingShape: e.loggingShape,
        isCustom: false,
      })
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          name: e.name,
          catalogGroup: e.catalogGroup,
          equipment: e.equipment,
          equipmentRaw: e.equipmentRaw,
          loggingShape: e.loggingShape,
          updatedAt: new Date(),
          // A catalog re-sync revives an exercise the user had hidden.
          deletedAt: null,
        },
      });

    // Parameters are small and fully owned by the catalog, so replacing them
    // wholesale is simpler than diffing and cannot leave a stale row behind.
    await db.delete(exerciseParams).where(eq(exerciseParams.exerciseId, e.id));
    if (e.params.length > 0) {
      await db.insert(exerciseParams).values(
        e.params.map((p, i) => ({
          id: makeId(),
          exerciseId: e.id,
          param: p.param,
          type: p.type,
          required: p.required,
          choices: p.choices ?? null,
          position: i,
        })),
      );
    }
  }
}

/**
 * Prepares a fresh database.
 *
 * The seven schedule rows are always created — the weekly plan is a fixed grid
 * the user edits, so it has to exist even when empty. Demo *routines* are
 * created only under `PREFILL_DEMO_DATA`; a real install starts with no
 * routines and every day as rest.
 *
 * Runs only on a genuinely empty database, so it can never overwrite the
 * user's own plan.
 */
export async function seedStarterData(db: Db, makeId: MakeId): Promise<void> {
  const [existingDays] = await db.select({ n: sql<number>`count(*)` }).from(scheduleDays);
  if (Number(existingDays?.n ?? 0) > 0) return;

  if (!PREFILL_DEMO_DATA) {
    await db.insert(scheduleDays).values(
      // isRest stays false: a fresh install has not chosen rest days, it simply
      // has no plan yet, and the two read differently on Today.
      Array.from({ length: 7 }, (_, dayOfWeek) => ({ id: makeId(), dayOfWeek, routineId: null, isRest: false })),
    );
    return;
  }

  const byName = new Map(SEED_EXERCISES.map((e) => [e.name, e.id]));
  const routineIds = new Map<string, string>();

  for (const r of STARTER_ROUTINES) {
    const routineId = makeId();
    routineIds.set(r.name, routineId);
    await db.insert(routines).values({ id: routineId, name: r.name, tag: r.tag });

    await db.insert(routineItems).values(
      r.items.map((item, i) => {
        const exerciseId = byName.get(item.exercise);
        if (!exerciseId) {
          // Loud rather than silent: a renamed catalog entry would otherwise
          // quietly drop an exercise out of a starter routine.
          throw new Error(
            `Starter routine "${r.name}" references "${item.exercise}", which is not in the catalog. ` +
              `Update src/db/seed/starter.ts.`,
          );
        }
        return {
          id: makeId(),
          routineId,
          exerciseId,
          position: i,
          targetSets: item.sets,
          targetReps: item.reps,
          targetWeightKg: item.weightKg || null,
        };
      }),
    );
  }

  await db.insert(scheduleDays).values(
    STARTER_WEEK.map((name, dayOfWeek) => ({
      id: makeId(),
      dayOfWeek,
      routineId: name ? (routineIds.get(name) ?? null) : null,
      // The demo plan is a deliberate split, so its blank days are rest days.
      isRest: !name,
    })),
  );

  await seedDemoHistory(db, makeId, byName);
}

/** "77.5 × 8" / "BW × 8" → the columns a logged set actually stores. */
function parseDemoSet(value: string): { reps: number | null; weightKg: number | null } {
  const [rawWeight, rawReps] = value.split('×').map((part) => part.trim());
  const reps = parseInt(rawReps ?? '', 10);
  return {
    reps: Number.isFinite(reps) ? reps : null,
    weightKg: !rawWeight || rawWeight === 'BW' ? null : (Number(rawWeight) ?? null),
  };
}

/**
 * "58m" / "1h 04m" → whole minutes.
 *
 * A plain parseInt reads "1h 04m" as 1, which is how the demo Legs session came
 * out a one-minute workout.
 */
function parseDemoDuration(value: string): number {
  const hours = /(\d+)\s*h/.exec(value);
  const mins = /(\d+)\s*m/.exec(value);
  const total = (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
  return total > 0 ? total : 55;
}

/** Demo dates are "Mon 10 Aug" — anchored to the current year for ordering. */
function parseDemoDate(date: string, clock: string): Date {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [, day, month] = date.split(' ');
  const [hh, mm] = clock.split(':').map((n) => parseInt(n, 10));
  return new Date(
    new Date().getFullYear(),
    Math.max(0, MONTHS.indexOf(month ?? 'Jan')),
    parseInt(day ?? '1', 10),
    hh ?? 0,
    mm ?? 0,
  );
}

/**
 * Writes the demo log.
 *
 * Without this the History screen hydrates empty on device while Routines
 * hydrates full — the in-memory demo data only ever reached the web build,
 * where nothing overwrites the stores.
 */
async function seedDemoHistory(db: Db, makeId: MakeId, byName: Map<string, string>): Promise<void> {
  for (const entry of HISTORY) {
    const startedAt = parseDemoDate(entry.date, entry.startedAt);
    const minutes = parseDemoDuration(entry.duration);
    await db.insert(sessions).values({
      id: entry.id,
      routineId: null,
      name: entry.name,
      startedAt,
      endedAt: new Date(startedAt.getTime() + minutes * 60_000),
      pausedMs: 0,
      status: 'completed',
    });

    for (const [position, exercise] of entry.exercises.entries()) {
      const exerciseId = byName.get(exercise.name);
      // Demo history predates the catalog rename pass, so a few names miss.
      if (!exerciseId) continue;
      const sessionExerciseId = makeId();
      await db.insert(sessionExercises).values({
        id: sessionExerciseId,
        sessionId: entry.id,
        exerciseId,
        position,
        targetSnapshot: null,
      });
      await db.insert(sessionSets).values(
        exercise.sets.map((value, i) => ({
          id: makeId(),
          sessionExerciseId,
          position: i,
          done: true,
          completedAt: startedAt,
          ...parseDemoSet(value),
        })),
      );
    }
  }
}

/**
 * Runs after migrations, on every launch.
 *
 * Wrapped in explicit BEGIN/COMMIT rather than `db.transaction()`: expo-sqlite
 * is a *synchronous* Drizzle driver, so handing it an async callback would
 * commit before the callback's statements had run. Raw statements behave the
 * same on sync and async drivers, which also lets the Node harness exercise
 * this exact path.
 */
export async function initDatabase(db: Db, makeId: MakeId): Promise<void> {
  await db.run(sql`BEGIN`);
  try {
    await syncCatalog(db, makeId);
    await seedStarterData(db, makeId);
    await db.run(sql`COMMIT`);
  } catch (error) {
    await db.run(sql`ROLLBACK`);
    throw error;
  }
}
