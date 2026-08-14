/**
 * Read-side access to the exercise catalog.
 *
 * Reads the generated seed directly rather than SQLite, because no screen is
 * database-backed yet. The shape matches what the repositories will return, so
 * swapping the source later does not change any caller.
 */

import { GROUP_LABEL, type CatalogGroup } from '@/catalog/taxonomy';
import { SEED_EXERCISES, type SeedExercise } from '@/db/seed/exercises.generated';

export type CatalogExercise = SeedExercise;

export const ALL_EXERCISES: CatalogExercise[] = SEED_EXERCISES;

/** Chip options for the library filter, "All" first. */
export const FILTER_GROUPS: { value: CatalogGroup | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  ...(Object.keys(GROUP_LABEL) as CatalogGroup[]).map((g) => ({ value: g, label: GROUP_LABEL[g] })),
];

/** "Chest · Barbell" — the line under an exercise name. */
export function exerciseMeta(exercise: CatalogExercise): string {
  return `${GROUP_LABEL[exercise.catalogGroup as CatalogGroup] ?? exercise.catalogGroup} · ${exercise.equipment}`;
}

/**
 * Filters by free text and group.
 *
 * Matches name, equipment and group so "barbell" and "chest" both work as
 * searches — users think in all three.
 */
export function searchExercises(
  query: string,
  group: CatalogGroup | 'All' = 'All',
  source: readonly CatalogExercise[] = ALL_EXERCISES,
): CatalogExercise[] {
  const q = query.trim().toLowerCase();
  return source.filter((e) => {
    if (group !== 'All' && e.catalogGroup !== group) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q) ||
      e.catalogGroup.toLowerCase().includes(q)
    );
  });
}

export type ExerciseGroup = { title: string; items: CatalogExercise[] };

/** Buckets results by catalog group, in the catalog's own order, skipping empties. */
export function groupExercises(list: readonly CatalogExercise[]): ExerciseGroup[] {
  const groups: ExerciseGroup[] = [];
  for (const g of Object.keys(GROUP_LABEL) as CatalogGroup[]) {
    const items = list.filter((e) => e.catalogGroup === g);
    if (items.length > 0) groups.push({ title: `${GROUP_LABEL[g]} · ${items.length}`, items });
  }
  return groups;
}

/**
 * Alternatives for a swap: same muscle group, excluding the exercise itself.
 *
 * Capped because a swap is a quick decision mid-set, not a browse — the full
 * catalog is a search away.
 */
export function swapCandidates(name: string, limit = 7): CatalogExercise[] {
  const current = ALL_EXERCISES.find((e) => e.name === name);
  if (!current) return [];
  return ALL_EXERCISES.filter((e) => e.catalogGroup === current.catalogGroup && e.name !== name).slice(0, limit);
}
