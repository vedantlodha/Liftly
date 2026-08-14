/**
 * Build-time switches.
 */

/**
 * Whether to prefill demo routines and a demo weekly plan.
 *
 * A real install starts blank: the user builds their own routines, and every
 * day begins as rest. This exists only so screens can be developed and reviewed
 * against realistic content before the exercise picker lands.
 *
 * Flip to `false` to see exactly what a new user sees. It does **not** affect
 * the exercise catalog — those 157 rows are reference data that ships with the
 * app, not user content, and are always seeded.
 *
 * Remove this, and `src/data/seed.ts`, once routines can be created in-app.
 */
export const PREFILL_DEMO_DATA = false;
