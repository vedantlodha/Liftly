/**
 * Rep-target arithmetic for the routine builder's stepper.
 *
 * Rep targets are absolute counts, not ranges — a plan says "8", not "6–8".
 *
 * The value is still typed as text because the catalog's exercises are not all
 * rep-counted: "500m" and "30s" are a distance and a duration. The stepper
 * nudges plain counts and leaves everything else untouched rather than
 * mangling it into a number.
 */

/** Below 1 is not a set; above 60 is not a rep target anyone types. */
const MIN_REPS = 1;
const MAX_REPS = 60;

const COUNT = /^\s*\d+\s*$/;

const clamp = (n: number) => Math.max(MIN_REPS, Math.min(MAX_REPS, n));

/**
 * Shifts a rep count by `delta`, clamped to 1–60.
 *
 * "500m" parses as 500 under `parseInt`, so the whole string must be numeric
 * before it is treated as a count — otherwise the stepper would eat the unit
 * and turn a distance into a rep target.
 */
export function shiftReps(value: string, delta: number): string {
  if (!COUNT.test(value)) return value;
  return String(clamp(parseInt(value, 10) + delta));
}

/** Whether the stepper should be able to change this target at all. */
export function isSteppableReps(value: string): boolean {
  return COUNT.test(value);
}

/** Weights move in 2.5 increments — the smallest plate pair on most bars. */
export const WEIGHT_STEP = 2.5;

/** Nudges a weight, never below zero, rounded to one decimal. */
export function shiftWeight(weight: number, delta: number): number {
  return Math.max(0, Math.round((weight + delta * WEIGHT_STEP) * 10) / 10);
}

/** Zero reads as bodyweight rather than "0". */
export function formatBuilderWeight(weight: number): string {
  return weight > 0 ? String(weight) : 'BW';
}

export const MIN_SETS = 1;
export const MAX_SETS = 10;

export function shiftSets(sets: number, delta: number): number {
  return Math.max(MIN_SETS, Math.min(MAX_SETS, sets + delta));
}
