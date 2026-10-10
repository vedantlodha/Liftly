/**
 * Reconciling a workout that went off plan with the routine behind it.
 *
 * People do not train exactly what was written down: an extra set because it
 * felt light, a heavier bar than planned, a machine that was taken so something
 * else got swapped in. The session records those as they happen, and at the end
 * the user is asked the only question that matters — was that just today, or is
 * that the plan now?
 *
 * Answering "update the routine" replays the changes onto it, so next week
 * starts from what was actually done rather than from a plan that has quietly
 * been wrong for a month.
 */

import type { Routine, RoutineItem } from '@/data/seed';
import type { WeightUnit } from '@/stores/useUnits';
import type { SummarisableItem } from './volume';

/**
 * One off-plan deviation, with enough detail to replay it onto the routine.
 *
 * `name` identifies the routine item rather than an index, because a session's
 * exercises can be dragged into a different order while the routine's stay put.
 * Keying by position would then write the change onto the wrong exercise.
 */
export type Change =
  | { kind: 'sets'; label: string; name: string; sets: number }
  | { kind: 'weight'; label: string; name: string; weight: number }
  | { kind: 'swap'; label: string; name: string; to: string }
  | { kind: 'add'; label: string; name: string };

/** What the prototype gives a newly added exercise when it joins a routine. */
const ADDED_DEFAULTS = { sets: 3, reps: '10', weight: 20, last: 'no history' } as const;

/** A weight cell holding a real number. Bodyweight sets carry the em dash. */
function numeric(weight: string): number | null {
  const n = parseFloat(weight);
  return Number.isFinite(n) ? n : null;
}

/**
 * Records, updates or clears the "extra set" deviation for one exercise.
 *
 * Rewritten from the current set count every time rather than appended to,
 * because sets come and go: a mis-tap, a set abandoned halfway, an undo. A
 * deviation left behind by a set that no longer exists would offer to write a
 * set count into the plan that was never actually performed.
 *
 * Existing entries are matched by `name` rather than by reading the label,
 * which is display text that happens to begin with the exercise name — one
 * exercise's name can be a prefix of another's.
 */
export function recordSetCount(
  changes: readonly Change[],
  name: string,
  sets: number,
  planSets: number,
): Change[] {
  const rest = changes.filter((c) => !(c.kind === 'sets' && c.name === name));
  // Back at or under the plan is not a deviation, so the entry goes away.
  if (sets <= planSets) return rest;
  // Appended, not spliced back in place: a swap recorded in the meantime
  // renamed this exercise, and `applyPlanChanges` relies on the set count
  // landing after that rename to find it.
  return [
    ...rest,
    {
      kind: 'sets',
      label: `${name} — extra set (${sets} total, plan says ${planSets})`,
      name,
      sets,
    },
  ];
}

/**
 * Exercises lifted heavier than the plan says, across every set that counted.
 *
 * Derived at the end rather than tracked as it happens, because a single heavy
 * set is not a new working weight — only the *lightest* completed set clearing
 * the plan means the whole exercise moved up.
 *
 * Going lighter is deliberately not reported. A deload, an off day or a set
 * taken cautiously should not quietly rewrite the plan downward; the plan is a
 * target to climb back to, not a mirror of the last session.
 */
export function weightChanges(
  items: readonly SummarisableItem[],
  plan: readonly RoutineItem[],
  defaultUnit: WeightUnit,
): Change[] {
  const changes: Change[] = [];
  for (const item of items) {
    const planned = plan.find((p) => p.name === item.name);
    // A plan item with no weight is bodyweight or unset — nothing to beat.
    if (!planned || !planned.weight) continue;

    const logged = item.sets
      .filter((s) => s.done)
      .map((s) => numeric(s.weight))
      .filter((n): n is number => n != null);
    if (logged.length === 0) continue;

    const lightest = Math.min(...logged);
    if (lightest <= planned.weight) continue;

    const unit = (item.unit ?? defaultUnit).toLowerCase();
    changes.push({
      kind: 'weight',
      label: `${item.name} — ${planned.weight} → ${lightest} ${unit} on every set`,
      name: item.name,
      weight: lightest,
    });
  }
  return changes;
}

/**
 * Replays changes onto a routine, in the order they happened.
 *
 * Order matters: a swap renames the routine item, so a set count recorded
 * against the new name afterwards still finds it. Applying out of order would
 * drop that change on the floor.
 *
 * A change naming an exercise the routine no longer has is skipped rather than
 * treated as an error — the routine may have been edited mid-session, and
 * losing one deviation is better than refusing to save the rest.
 */
export function applyPlanChanges(routine: Routine, changes: readonly Change[]): Routine {
  const items = routine.items.map((it) => ({ ...it }));

  for (const change of changes) {
    if (change.kind === 'add') {
      // Re-adding something already there would duplicate the row.
      if (items.some((it) => it.name === change.name)) continue;
      items.push({ name: change.name, ...ADDED_DEFAULTS });
      continue;
    }

    const target = items.find((it) => it.name === change.name);
    if (!target) continue;
    if (change.kind === 'sets') target.sets = change.sets;
    else if (change.kind === 'weight') target.weight = change.weight;
    else target.name = change.to;
  }

  return { ...routine, items };
}
