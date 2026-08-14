/**
 * Finished sessions — the training log.
 *
 * Writes are append-only apart from deletion: a completed session is a record
 * of what happened, not a document to edit.
 */

import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';

import type { Db } from '../client';
import { exercises, sessionExercises, sessionSets, sessions } from '../schema';

export type LoggedSet = {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
};

export type LoggedExercise = {
  name: string;
  sets: LoggedSet[];
};

export type LoggedSession = {
  id: string;
  name: string;
  routineId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  pausedMs: number;
  exercises: LoggedExercise[];
};

export type NewSession = {
  id: string;
  name: string;
  routineId: string | null;
  startedAt: Date;
  endedAt: Date;
  pausedMs: number;
  exercises: {
    /** Resolved to an exercise row by name; unknown names are skipped. */
    name: string;
    targetSnapshot: string | null;
    sets: (LoggedSet & { restSec?: number | null })[];
  }[];
};

/**
 * Writes a completed session and everything logged in it.
 *
 * Wrapped in a transaction with raw statements rather than `db.transaction()`:
 * expo-sqlite is a synchronous Drizzle driver, so an async callback would
 * commit before its statements ran.
 */
export async function saveSession(db: Db, makeId: () => string, session: NewSession): Promise<void> {
  // Exercise names resolve to catalog ids up front, in one read.
  const names = session.exercises.map((e) => e.name);
  const known =
    names.length > 0
      ? await db
          .select({ id: exercises.id, name: exercises.name })
          .from(exercises)
          .where(and(inArray(exercises.name, names), isNull(exercises.deletedAt)))
      : [];
  const idByName = new Map(known.map((e) => [e.name, e.id]));

  await db.insert(sessions).values({
    id: session.id,
    routineId: session.routineId,
    name: session.name,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    pausedMs: session.pausedMs,
    status: 'completed',
  });

  for (const [position, exercise] of session.exercises.entries()) {
    const exerciseId = idByName.get(exercise.name);
    // A custom or renamed exercise has no catalog row yet. Skipping keeps the
    // session saveable; the alternative is losing the whole workout.
    if (!exerciseId) continue;

    const sessionExerciseId = makeId();
    await db.insert(sessionExercises).values({
      id: sessionExerciseId,
      sessionId: session.id,
      exerciseId,
      position,
      targetSnapshot: exercise.targetSnapshot,
    });

    if (exercise.sets.length === 0) continue;
    await db.insert(sessionSets).values(
      exercise.sets.map((set, i) => ({
        id: makeId(),
        sessionExerciseId,
        position: i,
        done: true,
        completedAt: session.endedAt,
        reps: set.reps,
        weightKg: set.weightKg,
        durationSec: set.durationSec,
        distanceM: set.distanceM,
        restSec: set.restSec ?? null,
      })),
    );
  }
}

/** Completed sessions, newest first, with their logged sets. */
export async function listSessions(db: Db, limit = 100): Promise<LoggedSession[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.status, 'completed'), isNull(sessions.deletedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const detail = await db
    .select({ se: sessionExercises, set: sessionSets, exercise: exercises })
    .from(sessionExercises)
    .innerJoin(exercises, eq(exercises.id, sessionExercises.exerciseId))
    .leftJoin(sessionSets, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .where(and(inArray(sessionExercises.sessionId, ids), isNull(sessionExercises.deletedAt)))
    .orderBy(asc(sessionExercises.position), asc(sessionSets.position));

  // Grouped in memory: one query beats N per session, and a workout's set count
  // is small enough that the shaping cost is irrelevant.
  const bySession = new Map<string, Map<string, LoggedExercise>>();
  for (const row of detail) {
    const forSession = bySession.get(row.se.sessionId) ?? new Map<string, LoggedExercise>();
    const entry = forSession.get(row.se.id) ?? { name: row.exercise.name, sets: [] };
    if (row.set) {
      entry.sets.push({
        reps: row.set.reps,
        weightKg: row.set.weightKg,
        durationSec: row.set.durationSec,
        distanceM: row.set.distanceM,
      });
    }
    forSession.set(row.se.id, entry);
    bySession.set(row.se.sessionId, forSession);
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    routineId: r.routineId,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    pausedMs: r.pausedMs,
    exercises: [...(bySession.get(r.id)?.values() ?? [])],
  }));
}

/** Tombstones a session. Its exercises and sets go with it via the same stamp. */
export async function deleteSession(db: Db, id: string): Promise<void> {
  const now = new Date();
  await db.update(sessions).set({ deletedAt: now, updatedAt: now }).where(eq(sessions.id, id));
  await db
    .update(sessionExercises)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(sessionExercises.sessionId, id));
}
