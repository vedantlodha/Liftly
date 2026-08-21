/** The parts of a logged set this rule cares about. */
export type FillableSet = {
  weight: string;
  reps: string;
  done: boolean;
  /** True once the user has typed into this set. */
  touched?: boolean;
};

/**
 * Copies a completed set's numbers into the sets after it.
 *
 * Most exercises are straight across — the same weight for every set — so
 * typing it once and having the rest follow is the difference between logging
 * a workout and fighting the app between sets.
 *
 * Only *later* sets are filled, and only ones that are neither done nor
 * already edited: a set the user has touched is a deliberate value, and an
 * earlier set is history. Everything stays editable afterwards.
 */
export function fillDown<T extends FillableSet>(sets: readonly T[], from: number): T[] {
  const source = sets[from];
  if (!source) return [...sets];

  return sets.map((set, i) => {
    if (i <= from || set.done || set.touched) return set;
    return { ...set, weight: source.weight, reps: source.reps };
  });
}
