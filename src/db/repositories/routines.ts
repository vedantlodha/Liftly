/**
 * All routine reads and writes. Screens never touch Drizzle directly.
 *
 * Every query filters `deletedAt IS NULL` — rows are tombstoned rather than
 * removed so a future sync can propagate the deletion (docs/ARCHITECTURE.md §4),
 * which means "gone" is a predicate, not an absence.
 */

import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { Db } from '../client';
import { exercises, routineItems, routines, type Exercise } from '../schema';

export type RoutineSummary = {
  id: string;
  name: string;
  tag: string;
  exerciseCount: number;
  setCount: number;
};

export type RoutineItemWithExercise = {
  id: string;
  position: number;
  targetSets: number;
  targetReps: string;
  targetWeightKg: number | null;
  /** Null on rows written before the unit was stored per item. */
  weightUnit: string | null;
  restSeconds: number | null;
  exercise: Exercise;
};

export type RoutineWithItems = {
  id: string;
  name: string;
  tag: string;
  items: RoutineItemWithExercise[];
};

const live = isNull(routines.deletedAt);
const liveItems = isNull(routineItems.deletedAt);

/** Routine list with the counts the Routines screen shows ("5 exercises · 22 sets"). */
export async function listRoutines(db: Db): Promise<RoutineSummary[]> {
  const rows = await db
    .select({
      id: routines.id,
      name: routines.name,
      tag: routines.tag,
      exerciseCount: sql<number>`count(${routineItems.id})`,
      // coalesce so a routine with no exercises reports 0 rather than null
      setCount: sql<number>`coalesce(sum(${routineItems.targetSets}), 0)`,
    })
    .from(routines)
    .leftJoin(routineItems, and(eq(routineItems.routineId, routines.id), liveItems))
    .where(live)
    .groupBy(routines.id)
    .orderBy(asc(routines.createdAt));

  return rows.map((r) => ({
    ...r,
    exerciseCount: Number(r.exerciseCount),
    setCount: Number(r.setCount),
  }));
}

/** A routine with its exercises, ordered. `null` when missing or tombstoned. */
export async function getRoutineWithItems(db: Db, id: string): Promise<RoutineWithItems | null> {
  const [routine] = await db
    .select({ id: routines.id, name: routines.name, tag: routines.tag })
    .from(routines)
    .where(and(eq(routines.id, id), live));
  if (!routine) return null;

  const rows = await db
    .select({ item: routineItems, exercise: exercises })
    .from(routineItems)
    .innerJoin(exercises, eq(exercises.id, routineItems.exerciseId))
    .where(and(eq(routineItems.routineId, id), liveItems))
    .orderBy(asc(routineItems.position));

  return {
    ...routine,
    items: rows.map(({ item, exercise }) => ({
      id: item.id,
      position: item.position,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      targetWeightKg: item.targetWeightKg,
      weightUnit: item.weightUnit,
      restSeconds: item.restSeconds,
      exercise,
    })),
  };
}

/** Same shape as `getRoutineWithItems`, looked up by name. */
export async function getRoutineByName(db: Db, name: string): Promise<RoutineWithItems | null> {
  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.name, name), live));
  return routine ? getRoutineWithItems(db, routine.id) : null;
}

export type RoutineDraft = {
  name: string;
  tag: string;
  items: { exerciseName: string; sets: number; reps: string; weightKg: number | null; unit?: string }[];
};

/**
 * Creates or replaces a routine by name.
 *
 * Items are replaced wholesale rather than diffed: a routine holds a handful of
 * rows, and reconciling positions after reorders and removals is far more code
 * than it saves. Existing rows are tombstoned so a future sync sees the change.
 */
export async function upsertRoutine(
  db: Db,
  makeId: () => string,
  draft: RoutineDraft,
  originalName?: string,
): Promise<string> {
  const key = originalName ?? draft.name;
  const [found] = await db.select({ id: routines.id }).from(routines).where(and(eq(routines.name, key), live));
  const now = new Date();

  const routineId = found?.id ?? makeId();
  if (found) {
    await db.update(routines).set({ name: draft.name, tag: draft.tag, updatedAt: now }).where(eq(routines.id, routineId));
    await db
      .update(routineItems)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(routineItems.routineId, routineId));
  } else {
    await db.insert(routines).values({ id: routineId, name: draft.name, tag: draft.tag });
  }

  if (draft.items.length > 0) {
    const names = draft.items.map((i) => i.exerciseName);
    const known = await db
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(and(inArray(exercises.name, names), isNull(exercises.deletedAt)));
    const idByName = new Map(known.map((e) => [e.name, e.id]));

    const rows = draft.items
      .map((item, position) => {
        const exerciseId = idByName.get(item.exerciseName);
        if (!exerciseId) return null;
        return {
          id: makeId(),
          routineId,
          exerciseId,
          position,
          targetSets: item.sets,
          targetReps: item.reps,
          targetWeightKg: item.weightKg,
          weightUnit: item.unit ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) await db.insert(routineItems).values(rows);
  }

  return routineId;
}

/** Tombstones a routine and its items. Sessions that referenced it keep their history. */
export async function deleteRoutine(db: Db, id: string): Promise<void> {
  const now = new Date();
  await db.update(routines).set({ deletedAt: now, updatedAt: now }).where(eq(routines.id, id));
  await db.update(routineItems).set({ deletedAt: now, updatedAt: now }).where(eq(routineItems.routineId, id));
}
