/**
 * Drizzle schema. See docs/ARCHITECTURE.md §3 and §4.
 *
 * Three conventions are applied to every table, because they are cheap now and
 * expensive to retrofit once sync arrives (§4):
 *
 *  - text UUID primary keys, so rows from two devices never collide
 *  - `createdAt` / `updatedAt`, which last-write-wins needs and which cannot be
 *    reconstructed after the fact
 *  - `deletedAt` tombstones — a hard delete is invisible to a future sync, so
 *    the other device would simply re-add the row
 */

import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { Equipment, LoggingShape } from '@/catalog/taxonomy';

/** Applied to every table. `deletedAt` non-null means the row is tombstoned. */
const lifecycle = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
};

// ─────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────

export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** Verbatim catalog `## Section`, e.g. "Shoulders and Traps". */
    catalogGroup: text('catalog_group').$type<string>().notNull(),
    /** Normalised tag the design renders. */
    equipment: text('equipment').$type<Equipment>().notNull(),
    /** Catalog's free-text equipment, kept so detail can be recovered. */
    equipmentRaw: text('equipment_raw').notNull(),
    /** Which set-row renderer the active workout uses. */
    loggingShape: text('logging_shape').$type<LoggingShape>().notNull(),
    /** True for user-created exercises, which the catalog importer must not touch. */
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    ...lifecycle,
  },
  (t) => [uniqueIndex('exercises_name_unique').on(t.name), index('exercises_group_idx').on(t.catalogGroup)],
);

/**
 * The *form* schema — which inputs to render for an exercise. Generated from
 * the catalog; distinct from how a logged set is stored (see `sessionSets`).
 */
export const exerciseParams = sqliteTable(
  'exercise_params',
  {
    id: text('id').primaryKey(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    /** Catalog parameter name, e.g. `weight_kg`. */
    param: text('param').notNull(),
    /** `int`, `decimal`, `enum`, `text`, `duration`. */
    type: text('type').notNull(),
    required: integer('required', { mode: 'boolean' }).notNull(),
    /** Set when the catalog wrote a `{a|b}` choice list. */
    choices: text('choices', { mode: 'json' }).$type<string[]>(),
    position: integer('position').notNull(),
    ...lifecycle,
  },
  (t) => [uniqueIndex('exercise_params_unique').on(t.exerciseId, t.param)],
);

// ─────────────────────────────────────────────────────────────
// Routines and schedule
// ─────────────────────────────────────────────────────────────

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Muscle-group summary under the routine title, e.g. "Chest · Shoulders · Triceps". */
  tag: text('tag').notNull().default('Custom'),
  ...lifecycle,
});

export const routineItems = sqliteTable(
  'routine_items',
  {
    id: text('id').primaryKey(),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull().default(3),
    /** Free text so ranges survive: "6–8", "12", "500m". */
    targetReps: text('target_reps').notNull().default('10'),
    targetWeightKg: real('target_weight_kg'),
    /** Overrides the user's default rest for this exercise. */
    restSeconds: integer('rest_seconds'),
    ...lifecycle,
  },
  (t) => [index('routine_items_routine_idx').on(t.routineId, t.position)],
);

/**
 * One row per weekday, Mon = 0.
 *
 * `overrideRoutineId` applies only while `overrideWeekStart` equals the current
 * week's Monday — that date stamp is what makes "just this week" actually
 * revert, which the prototype's boolean never did.
 */
export const scheduleDays = sqliteTable(
  'schedule_days',
  {
    id: text('id').primaryKey(),
    dayOfWeek: integer('day_of_week').notNull(),
    /** Null means a rest day in the saved plan. */
    routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    overrideRoutineId: text('override_routine_id').references(() => routines.id, { onDelete: 'set null' }),
    /** Set when the override is a rest day, which `overrideRoutineId: null` cannot express. */
    overrideIsRest: integer('override_is_rest', { mode: 'boolean' }).notNull().default(false),
    /** Monday of the week the override belongs to, as YYYY-MM-DD. */
    overrideWeekStart: text('override_week_start'),
    ...lifecycle,
  },
  (t) => [uniqueIndex('schedule_days_dow_unique').on(t.dayOfWeek)],
);

/**
 * Single-row-per-key app preferences.
 *
 * A key-value table rather than columns on a settings row: preferences are
 * added far more often than they are queried together, and a new one should not
 * need a migration.
 */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  ...lifecycle,
});

// ─────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────

export const SESSION_STATUS = ['active', 'completed', 'discarded'] as const;
export type SessionStatus = (typeof SESSION_STATUS)[number];

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    /** Null for an ad-hoc session, which by definition has no plan to reconcile against. */
    routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    /** Accumulated paused time, subtracted from elapsed. */
    pausedMs: integer('paused_ms').notNull().default(0),
    status: text('status').$type<SessionStatus>().notNull().default('active'),
    ...lifecycle,
  },
  (t) => [index('sessions_status_idx').on(t.status), index('sessions_started_idx').on(t.startedAt)],
);

export const sessionExercises = sqliteTable(
  'session_exercises',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    /** The plan's target at the moment the session started — edits to the routine must not rewrite history. */
    targetSnapshot: text('target_snapshot'),
    ...lifecycle,
  },
  (t) => [index('session_exercises_session_idx').on(t.sessionId, t.position)],
);

/**
 * The *storage* schema. Seven columns cover every exercise's primary
 * measurements; the sixteen tail parameters live in `extras` (§3).
 *
 * Everything is SI — kg, metres, seconds — converted only at the display
 * boundary. `speed_kph` and `pace_min_per_km` are deliberately absent: both are
 * distance over duration, and storing them invites the three disagreeing.
 */
export const sessionSets = sqliteTable(
  'session_sets',
  {
    id: text('id').primaryKey(),
    sessionExerciseId: text('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),

    reps: integer('reps'),
    weightKg: real('weight_kg'),
    durationSec: integer('duration_sec'),
    distanceM: real('distance_m'),
    rpe: real('rpe'),
    restSec: integer('rest_sec'),
    /** `left` | `right` | `both`, for unilateral work. */
    side: text('side').$type<'left' | 'right' | 'both'>(),

    /** Low-frequency catalog parameters, keyed by their catalog name. */
    extras: text('extras', { mode: 'json' }).$type<Record<string, unknown>>(),
    ...lifecycle,
  },
  (t) => [index('session_sets_exercise_idx').on(t.sessionExerciseId, t.position)],
);

export const CHANGE_KINDS = ['sets', 'weight', 'swap', 'add'] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

/** Off-plan deviations accumulated during a session, replayed if the user updates the routine. */
export const sessionChanges = sqliteTable(
  'session_changes',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<ChangeKind>().notNull(),
    /** Human-readable line shown in the reconcile sheet. */
    label: text('label').notNull(),
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
    ...lifecycle,
  },
  (t) => [index('session_changes_session_idx').on(t.sessionId)],
);

// ─────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────

export const exercisesRelations = relations(exercises, ({ many }) => ({
  params: many(exerciseParams),
}));

export const exerciseParamsRelations = relations(exerciseParams, ({ one }) => ({
  exercise: one(exercises, { fields: [exerciseParams.exerciseId], references: [exercises.id] }),
}));

export const routinesRelations = relations(routines, ({ many }) => ({
  items: many(routineItems),
}));

export const routineItemsRelations = relations(routineItems, ({ one }) => ({
  routine: one(routines, { fields: [routineItems.routineId], references: [routines.id] }),
  exercise: one(exercises, { fields: [routineItems.exerciseId], references: [exercises.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  routine: one(routines, { fields: [sessions.routineId], references: [routines.id] }),
  exercises: many(sessionExercises),
  changes: many(sessionChanges),
}));

export const sessionExercisesRelations = relations(sessionExercises, ({ one, many }) => ({
  session: one(sessions, { fields: [sessionExercises.sessionId], references: [sessions.id] }),
  exercise: one(exercises, { fields: [sessionExercises.exerciseId], references: [exercises.id] }),
  sets: many(sessionSets),
}));

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [sessionSets.sessionExerciseId],
    references: [sessionExercises.id],
  }),
}));

export const sessionChangesRelations = relations(sessionChanges, ({ one }) => ({
  session: one(sessions, { fields: [sessionChanges.sessionId], references: [sessions.id] }),
}));

export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineItem = typeof routineItems.$inferSelect;
export type ScheduleDay = typeof scheduleDays.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionSet = typeof sessionSets.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
