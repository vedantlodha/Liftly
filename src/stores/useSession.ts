import { create } from 'zustand';

import { summariseSession, type SessionSummary } from '@/domain/volume';
import { useHistory } from './useHistory';
import { newId } from '@/db/id';
import { persist } from '@/db/persistence';
import { saveSession, type LoggedSet } from '@/db/repositories/sessions';
import { getRoutineByName } from '@/db/repositories/routines';
import type { HistorySession } from '@/data/seed';
import { NO_VALUE, type WeightUnit } from './useUnits';
import { useSettings } from './useSettings';
import { findRoutine } from './useRoutines';

/**
 * The live workout.
 *
 * In-memory for now. Phase 4 proper persists this to MMKV so a session survives
 * the app being killed mid-set — which is why every mutation replaces state
 * rather than mutating in place: the same reducers will serialise unchanged.
 */

export { NO_VALUE };

export type SessionSet = {
  /**
   * Stable across reorders and deletions.
   *
   * Set rows own animation state (the swipe offset), so keying them by array
   * index makes a surviving row inherit a deleted neighbour's half-finished
   * gesture. An id ties the state to the set, not the slot.
   */
  id: string;
  /** Kept as strings — the keypad edits text, and "—" is a valid display state. */
  weight: string;
  reps: string;
  done: boolean;
};

export type SessionItem = {
  name: string;
  /** "4 × 6–8 @ 80kg", shown under the exercise name. */
  target: string;
  last: string;
  /** Plan values, so off-plan deviations can be detected at finish. */
  planSets: number;
  planWeight: number;
  /**
   * Unit this exercise's weights were entered in. Inherited from the routine
   * item; the active workout displays it but does not offer to change it.
   */
  unit: WeightUnit;
  /** Skipped exercises keep their rows but drop out of the progress count. */
  skipped: boolean;
  sets: SessionSet[];
};

export type Change = { kind: 'sets' | 'weight' | 'swap' | 'add'; label: string };

export type Session = {
  name: string;
  /** Null for an ad-hoc session — nothing to reconcile against. */
  routine: string | null;
  startedAt: number;
  items: SessionItem[];
  changes: Change[];
};

/** Which cell the numeric keypad is editing. */
export type PadTarget = { item: number; set: number; field: 'weight' | 'reps'; buffer: string };

type SessionState = {
  session: Session | null;
  pausedAt: number | null;
  /** Total paused milliseconds, subtracted from elapsed. */
  pausedMs: number;
  restEndsAt: number | null;
  restSeconds: number;
  pad: PadTarget | null;
  /** Set by `finish`, read by the summary screen, cleared when it closes. */
  finished: SessionSummary | null;

  start: (routineName?: string) => void;
  discard: () => void;
  finish: () => void;
  clearFinished: () => void;
  pause: () => void;
  resume: () => void;

  toggleDone: (item: number, set: number) => void;
  addSet: (item: number) => void;
  removeSet: (item: number, set: number) => void;

  toggleSkip: (item: number) => void;
  addExercises: (names: string[], unit: WeightUnit) => void;
  swapExercise: (item: number, name: string) => void;

  openPad: (item: number, set: number, field: 'weight' | 'reps') => void;
  closePad: () => void;
  pressKey: (key: string) => void;

  skipRest: () => void;
  extendRest: (seconds?: number) => void;
};

/**
 * Converts one logged set into the columns the database stores.
 *
 * The rep field is a string because the design lets a "rep" be a distance or a
 * hold — "500m", "30s" — so it is routed to the matching column rather than
 * being forced into an integer count.
 */
function toLoggedSet(sv: SessionSet): LoggedSet {
  const weight = Number(sv.weight);
  const amount = parseFloat(sv.reps);
  const value = Number.isFinite(amount) ? amount : null;
  const unit = sv.reps.trim().slice(-1).toLowerCase();
  return {
    reps: unit === 'm' || unit === 's' ? null : value,
    weightKg: sv.weight === NO_VALUE || !Number.isFinite(weight) ? null : weight,
    durationSec: unit === 's' ? value : null,
    distanceM: unit === 'm' ? value : null,
  };
}

/**
 * Converts a finished session into a history record.
 *
 * Only completed sets are kept — history is a log of what happened, not what
 * was planned. Exercises with nothing ticked drop out entirely.
 */
function toHistory(session: Session, summary: SessionSummary, endedAt: number): HistorySession {
  return {
    id: `session-${endedAt}`,
    name: session.name,
    date: summary.when,
    duration: `${summary.durationMin}m`,
    setCount: String(summary.setsCompleted),
    volume: `${(summary.volume / 1000).toFixed(1)}t`,
    startedAt: new Date(session.startedAt).toTimeString().slice(0, 5),
    exercises: session.items
      .filter((it) => it.sets.some((sv) => sv.done))
      .map((it) => ({
        name: it.name,
        sets: it.sets
          .filter((sv) => sv.done)
          .map((sv) => `${sv.weight === NO_VALUE ? 'BW' : sv.weight} × ${sv.reps}`),
      })),
  };
}

/** Monotonic counter for set ids — unique within a session, which is all that is needed. */
let seq = 0;

function buildSession(routineName?: string): Session {
  const routine = routineName ? findRoutine(routineName) : undefined;
  // Only used where a routine item has not chosen one of its own.
  const defaultUnit = useSettings.getState().defaultUnit;
  if (!routine) {
    return { name: 'Ad-hoc session', routine: null, startedAt: Date.now(), items: [], changes: [] };
  }
  return {
    name: routine.name,
    routine: routine.name,
    startedAt: Date.now(),
    items: routine.items.map((it) => ({
      name: it.name,
      target: `${it.sets} × ${it.reps}${it.weight ? ` @ ${it.weight}kg` : ''}`,
      last: it.last,
      planSets: it.sets,
      planWeight: it.weight,
      unit: it.unit ?? defaultUnit,
      skipped: false,
      sets: Array.from({ length: it.sets }, (_, i) => ({
        id: `${it.name}-${i}-${seq++}`,
        weight: it.weight ? String(it.weight) : NO_VALUE,
        // A range like "6–8" opens at its lower bound.
        reps: String(parseInt(it.reps, 10) || 10),
        done: false,
      })),
    })),
    changes: [],
  };
}

/** Replaces one set, leaving every other object identity intact. */
function mapSet(
  session: Session,
  item: number,
  set: number,
  fn: (s: SessionSet) => SessionSet,
): Session {
  return {
    ...session,
    items: session.items.map((it, i) =>
      i !== item ? it : { ...it, sets: it.sets.map((s, j) => (j !== set ? s : fn(s))) },
    ),
  };
}

export const useSession = create<SessionState>((set, get) => ({
  session: null,
  pausedAt: null,
  pausedMs: 0,
  restEndsAt: null,
  restSeconds: 90,
  pad: null,
  finished: null,

  start: (routineName) =>
    set({
      session: buildSession(routineName),
      pausedAt: null,
      pausedMs: 0,
      restEndsAt: null,
      pad: null,
    }),

  discard: () => set({ session: null, pausedAt: null, pausedMs: 0, restEndsAt: null, pad: null }),

  /**
   * Ends the session and hands its summary to the summary screen.
   *
   * Paused time is banked first, so a session finished while paused reports the
   * training time rather than the wall clock.
   */
  finish: () => {
    const { session, pausedAt, pausedMs } = get();
    if (!session) return;
    const endedAt = Date.now();
    const banked = pausedMs + (pausedAt != null ? endedAt - pausedAt : 0);
    const summary = summariseSession(
      { name: session.name, items: session.items, startedAt: session.startedAt, pausedMs: banked },
      endedAt,
      useSettings.getState().defaultUnit,
    );
    const logged = toHistory(session, summary, endedAt);

    // The store is updated first so History is correct even on web, where there
    // is no database; the write below is what makes it survive a relaunch.
    useHistory.getState().add(logged);
    persist((db) =>
      saveSession(db, newId, {
        // Same id as the history record, so deleting from either side agrees.
        id: logged.id,
        name: session.name,
        routineId: null,
        startedAt: new Date(session.startedAt),
        endedAt: new Date(endedAt),
        pausedMs: banked,
        exercises: session.items
          .filter((it) => it.sets.some((sv) => sv.done))
          .map((it) => ({
            name: it.name,
            targetSnapshot: it.target || null,
            sets: it.sets.filter((sv) => sv.done).map(toLoggedSet),
          })),
      }),
    );

    set({
      finished: summary,
      session: null,
      pausedAt: null,
      pausedMs: 0,
      restEndsAt: null,
      pad: null,
    });
  },

  clearFinished: () => set({ finished: null }),

  // Pausing banks the remaining rest rather than letting it tick away while the
  // user is not training.
  pause: () => set({ pausedAt: Date.now(), pad: null, restEndsAt: null }),

  resume: () => {
    const { pausedAt, pausedMs } = get();
    if (pausedAt == null) return;
    set({ pausedMs: pausedMs + (Date.now() - pausedAt), pausedAt: null });
  },

  toggleDone: (item, setIndex) => {
    const { session, restSeconds } = get();
    if (!session) return;
    const current = session.items[item]?.sets[setIndex];
    if (!current) return;
    const willBeDone = !current.done;
    set({
      session: mapSet(session, item, setIndex, (s) => ({ ...s, done: willBeDone })),
      // Completing a set starts rest; un-ticking it cancels rest.
      restEndsAt: willBeDone ? Date.now() + restSeconds * 1000 : null,
      pad: null,
    });
  },

  addSet: (item) => {
    const { session } = get();
    if (!session) return;
    const target = session.items[item];
    if (!target) return;
    const previous = target.sets.at(-1);
    const sets = [
      ...target.sets,
      { id: `add-${seq++}`, weight: previous?.weight ?? NO_VALUE, reps: previous?.reps ?? '10', done: false },
    ];
    // Going past the plan's set count is an off-plan change worth surfacing.
    const changes =
      sets.length > target.planSets
        ? [
            ...session.changes.filter((c) => !(c.kind === 'sets' && c.label.startsWith(target.name))),
            {
              kind: 'sets' as const,
              label: `${target.name} — extra set (${sets.length} total, plan says ${target.planSets})`,
            },
          ]
        : session.changes;
    set({
      session: { ...session, items: session.items.map((it, i) => (i === item ? { ...it, sets } : it)), changes },
    });
  },

  removeSet: (item, setIndex) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        items: session.items.map((it, i) =>
          i !== item ? it : { ...it, sets: it.sets.filter((_, j) => j !== setIndex) },
        ),
      },
      pad: null,
    });
  },

  /**
   * Skips or reinstates an exercise.
   *
   * Skipping clears its ticks: a set marked done inside a skipped exercise
   * would otherwise still count toward the session's completed total.
   */
  toggleSkip: (item) => {
    const { session } = get();
    if (!session) return;
    const target = session.items[item];
    if (!target) return;
    const skipped = !target.skipped;
    set({
      session: {
        ...session,
        items: session.items.map((it, i) =>
          i !== item
            ? it
            : { ...it, skipped, sets: skipped ? it.sets.map((sv) => ({ ...sv, done: false })) : it.sets },
        ),
      },
      pad: null,
    });
  },

  /**
   * Appends exercises to a live session.
   *
   * Anything added mid-workout is off-plan by definition, so each one is
   * recorded as a change for the end-of-session reconcile.
   */
  addExercises: (names, unit) => {
    const { session } = get();
    if (!session || names.length === 0) return;
    const items = names.map((name) => ({
      name,
      target: '3 × 10',
      last: 'no history',
      planSets: 3,
      planWeight: 0,
      unit,
      skipped: false,
      sets: [0, 1, 2].map(() => ({ id: `add-${seq++}`, weight: NO_VALUE, reps: '10', done: false })),
    }));
    set({
      session: {
        ...session,
        items: [...session.items, ...items],
        changes: [
          ...session.changes,
          ...names.map((name) => ({ kind: 'add' as const, label: `${name} — added, not in the routine` })),
        ],
      },
    });
  },

  swapExercise: (item, name) => {
    const { session } = get();
    if (!session) return;
    const from = session.items[item]?.name;
    if (!from || from === name) return;
    set({
      session: {
        ...session,
        items: session.items.map((it, i) =>
          i === item ? { ...it, name, last: 'no history' } : it,
        ),
        changes: [...session.changes, { kind: 'swap' as const, label: `${from} → ${name}` }],
      },
      pad: null,
    });
  },

  openPad: (item, setIndex, field) => set({ pad: { item, set: setIndex, field, buffer: '' } }),
  closePad: () => set({ pad: null }),

  pressKey: (key) => {
    const { pad, session } = get();
    if (!pad || !session) return;
    // Six characters is plenty for "137.5" and stops runaway input.
    const buffer = key === '⌫' ? pad.buffer.slice(0, -1) : (pad.buffer + key).slice(0, 6);
    // Stored verbatim: the unit labels the number rather than transforming it.
    const stored = buffer === '' ? NO_VALUE : buffer;
    set({
      pad: { ...pad, buffer },
      session: mapSet(session, pad.item, pad.set, (s) => ({ ...s, [pad.field]: stored })),
    });
  },

  skipRest: () => set({ restEndsAt: null }),
  extendRest: (seconds = 30) => set({ restEndsAt: (get().restEndsAt ?? Date.now()) + seconds * 1000 }),
}));

/** Completed and total sets across the session. */
export function sessionProgress(session: Session | null): { done: number; total: number } {
  if (!session) return { done: 0, total: 0 };
  // A skipped exercise is not outstanding work, so it leaves the denominator.
  return session.items
    .filter((it) => !it.skipped)
    .reduce(
      (acc, it) => ({
        done: acc.done + it.sets.filter((s) => s.done).length,
        total: acc.total + it.sets.length,
      }),
      { done: 0, total: 0 },
    );
}

/** The next unticked set, for the rest timer's "next …" label. */
export function nextSetLabel(session: Session | null): string {
  if (!session) return '';
  for (const it of session.items) {
    if (it.skipped) continue;
    const index = it.sets.findIndex((s) => !s.done);
    if (index >= 0) return `${it.name} set ${index + 1}`;
  }
  return 'nothing left';
}

/** mm:ss, matching the prototype's `fmt`. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
