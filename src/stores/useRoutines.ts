import { create } from 'zustand';

import { PREFILL_DEMO_DATA } from '@/config';
import { newId } from '@/db/id';
import { persist } from '@/db/persistence';
import { deleteRoutine, getRoutineByName, upsertRoutine } from '@/db/repositories/routines';
import { ROUTINES, type Routine, type RoutineItem } from '@/data/seed';

/**
 * Saved routines, in memory.
 *
 * Routines are still keyed by name — seed data has no ids, and the
 * `/routine/[id]` route uses the name for the same reason. `save` upserts on
 * name, matching the prototype: editing a routine and keeping its name updates
 * it, while renaming creates a new one.
 */
type RoutinesState = {
  routines: Routine[];
  save: (routine: Routine, originalName?: string) => void;
  remove: (name: string) => void;
  /** Puts a deleted routine back at its old position, for undo. */
  restore: (routine: Routine, index: number) => void;
};

export const useRoutines = create<RoutinesState>((set) => ({
  // A real install has none until the user builds one.
  routines: PREFILL_DEMO_DATA ? ROUTINES : [],

  save: (routine, originalName) => {
    set((s) => {
      const key = originalName ?? routine.name;
      const at = s.routines.findIndex((r) => r.name === key);
      if (at < 0) return { routines: [...s.routines, routine] };
      return { routines: s.routines.map((r, i) => (i === at ? routine : r)) };
    });
    persist((db) =>
      upsertRoutine(
        db,
        newId,
        {
          name: routine.name,
          tag: routine.tag,
          items: routine.items.map((i) => ({
            exerciseName: i.name,
            sets: i.sets,
            reps: i.reps,
            weightKg: i.weight || null,
            unit: i.unit,
          })),
        },
        originalName,
      ),
    );
  },

  remove: (name) => {
    set((s) => ({ routines: s.routines.filter((r) => r.name !== name) }));
    persist(async (db) => {
      const found = await getRoutineByName(db, name);
      if (found) await deleteRoutine(db, found.id);
    });
  },

  restore: (routine, index) => {
    set((s) => {
      const routines = [...s.routines];
      // Clamped: the list may have changed while the undo toast was up.
      routines.splice(Math.min(index, routines.length), 0, routine);
      return { routines };
    });
    // Re-saved rather than un-tombstoned: deleteRoutine stamps deletedAt, and
    // upsert writes a live row back under the same name.
    persist((db) =>
      upsertRoutine(db, newId, {
        name: routine.name,
        tag: routine.tag,
        items: routine.items.map((i) => ({
          exerciseName: i.name,
          sets: i.sets,
          reps: i.reps,
          weightKg: i.weight || null,
          unit: i.unit,
        })),
      }),
    );
  },
}));

/**
 * Looks a routine up in a list the caller is already subscribed to.
 *
 * Screens must resolve routines through the store rather than `@/data/seed`:
 * the seed is frozen demo content, while the store is what hydration fills
 * from SQLite and what the builder edits. Reading the seed directly means a
 * saved edit never shows up on Today.
 */
export function findRoutineIn(routines: readonly Routine[], name: string | null | undefined): Routine | undefined {
  return name == null ? undefined : routines.find((r) => r.name === name);
}

/** Non-reactive lookup, for stores and event handlers outside React. */
export function findRoutine(name: string | null | undefined): Routine | undefined {
  return findRoutineIn(useRoutines.getState().routines, name);
}

/** "5 exercises · 22 sets", as the list row shows it. */
export function routineStats(routine: Routine): string {
  const exercises = `${routine.items.length} ${routine.items.length === 1 ? 'exercise' : 'exercises'}`;
  const sets = routine.items.reduce((n, i) => n + i.sets, 0);
  return `${exercises} · ${sets} sets`;
}

/** A blank routine for the builder's "new" route. */
export function emptyRoutine(): Routine {
  return { name: '', tag: 'Custom', items: [] };
}

export type { Routine, RoutineItem };
