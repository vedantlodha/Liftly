/**
 * The bridge between the in-memory stores and SQLite.
 *
 * Stores stay the single source of truth for rendering — screens read them
 * synchronously and never await. This module loads the database into them once
 * at boot, and writes changes back afterwards.
 *
 * **No database attached is a supported state.** The web build has no SQLite
 * (see `DatabaseProvider.web.tsx`), so `persist` becomes a no-op there and the
 * app runs entirely in memory. Nothing downstream has to branch on platform.
 */

import type { Db } from './client';

let database: Db | null = null;
/** Serialises writes so two rapid edits cannot interleave mid-transaction. */
let queue: Promise<unknown> = Promise.resolve();

export function attachDatabase(db: Db): void {
  database = db;
}

export function detachDatabase(): void {
  database = null;
}

export function isPersistent(): boolean {
  return database !== null;
}

/**
 * Queues a write.
 *
 * Deliberately fire-and-forget: the store has already updated, so the UI is
 * correct either way, and blocking a tap on a disk write would make logging a
 * set feel sluggish. A failure is logged rather than thrown — losing one write
 * should not take down a workout in progress.
 */
export function persist(work: (db: Db) => Promise<unknown>): void {
  const db = database;
  if (!db) return;
  queue = queue
    .then(() => work(db))
    .catch((error: unknown) => {
      console.error('[liftly] persistence write failed', error);
    });
}

/** Resolves once every queued write has settled. Used by tests and on teardown. */
export async function flushWrites(): Promise<void> {
  await queue;
}
