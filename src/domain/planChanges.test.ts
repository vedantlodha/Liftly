import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyPlanChanges, recordSetCount, weightChanges, type Change } from './planChanges.ts';
import type { Routine, RoutineItem } from '../data/seed.ts';
import type { SummarisableItem } from './volume.ts';

const planItem = (name: string, weight: number, sets = 3): RoutineItem => ({
  name,
  sets,
  reps: '10',
  weight,
  last: 'no history',
});

const routine = (...items: RoutineItem[]): Routine => ({ name: 'Push A', tag: 'Chest', items });

const set = (weight: string, done = true) => ({ weight, reps: '8', done });

describe('recordSetCount', () => {
  it('records going past the plan', () => {
    assert.deepEqual(recordSetCount([], 'Bench', 4, 3), [
      { kind: 'sets', label: 'Bench — extra set (4 total, plan says 3)', name: 'Bench', sets: 4 },
    ]);
  });

  it('says nothing while the count is still on plan', () => {
    assert.deepEqual(recordSetCount([], 'Bench', 3, 3), []);
  });

  it('replaces its own earlier entry rather than stacking them', () => {
    const once = recordSetCount([], 'Bench', 4, 3);
    const twice = recordSetCount(once, 'Bench', 5, 3);
    assert.equal(twice.length, 1);
    assert.equal(twice[0]?.kind === 'sets' && twice[0].sets, 5);
  });

  it('withdraws the deviation when the extra set is taken back off', () => {
    // The bug this guards: removing the extra set used to leave the change
    // behind, so finishing offered to write 4 sets into a plan that was
    // trained at 3.
    const added = recordSetCount([], 'Bench', 4, 3);
    assert.deepEqual(recordSetCount(added, 'Bench', 3, 3), []);
  });

  it('restores the deviation when the removal is undone', () => {
    const removed = recordSetCount(recordSetCount([], 'Bench', 4, 3), 'Bench', 3, 3);
    assert.equal(recordSetCount(removed, 'Bench', 4, 3).length, 1);
  });

  it('leaves other exercises’ deviations alone', () => {
    // Matched by name, not by label prefix: "Bench" must not clear the entry
    // belonging to "Bench Press", whose label also starts with "Bench".
    const other = recordSetCount([], 'Bench Press', 4, 3);
    const both = recordSetCount(other, 'Bench', 5, 3);
    assert.deepEqual(
      both.map((c) => c.name),
      ['Bench Press', 'Bench'],
    );
    // Clearing one must not take the other with it.
    assert.deepEqual(
      recordSetCount(both, 'Bench', 3, 3).map((c) => c.name),
      ['Bench Press'],
    );
  });

  it('keeps other kinds of change', () => {
    const changes: Change[] = [{ kind: 'swap', label: '', name: 'Bench', to: 'Dumbbell Press' }];
    assert.deepEqual(recordSetCount(changes, 'Bench', 3, 3), changes);
  });

  it('lands after a swap so the set count still finds the exercise', () => {
    // Recorded against the new name, the count must apply after the rename.
    const changes: Change[] = [
      { kind: 'sets', label: '', name: 'Bench', sets: 4 },
      { kind: 'swap', label: '', name: 'Bench', to: 'Dumbbell Press' },
    ];
    const next = recordSetCount(changes, 'Dumbbell Press', 5, 3);
    const routine_ = applyPlanChanges(routine(planItem('Bench', 80, 3)), next);
    assert.equal(routine_.items[0]?.name, 'Dumbbell Press');
    assert.equal(routine_.items[0]?.sets, 5);
  });
});

describe('weightChanges', () => {
  const plan = [planItem('Bench', 80)];

  it('reports an exercise lifted heavier on every set', () => {
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('85'), set('85')] }];
    assert.deepEqual(weightChanges(items, plan, 'KG'), [
      { kind: 'weight', label: 'Bench — 80 → 85 kg on every set', name: 'Bench', weight: 85 },
    ]);
  });

  it('takes the lightest completed set, not the heaviest', () => {
    // One heavy single is not a new working weight.
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('82.5'), set('100')] }];
    const [change] = weightChanges(items, plan, 'KG');
    assert.equal(change?.kind === 'weight' && change.weight, 82.5);
  });

  it('says nothing when a single set fell back to the plan weight', () => {
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('85'), set('80')] }];
    assert.deepEqual(weightChanges(items, plan, 'KG'), []);
  });

  it('never reports going lighter', () => {
    // A deload must not quietly rewrite the plan downward.
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('60'), set('60')] }];
    assert.deepEqual(weightChanges(items, plan, 'KG'), []);
  });

  it('ignores sets that were never ticked', () => {
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('85'), set('40', false)] }];
    assert.equal(weightChanges(items, plan, 'KG').length, 1);
  });

  it('ignores bodyweight sets and bodyweight plan items', () => {
    const bw: SummarisableItem[] = [{ name: 'Bench', sets: [set('—'), set('85')] }];
    // The em dash is not a number, so 85 is the only completed weight.
    assert.equal(weightChanges(bw, plan, 'KG').length, 1);
    // A plan item with no weight has nothing to beat.
    assert.deepEqual(weightChanges([{ name: 'Dip', sets: [set('20')] }], [planItem('Dip', 0)], 'KG'), []);
  });

  it('labels with the exercise’s own unit, not the app default', () => {
    const items: SummarisableItem[] = [{ name: 'Bench', sets: [set('85')], unit: 'LB' }];
    assert.match(weightChanges(items, plan, 'KG')[0]?.label ?? '', /85 lb on every set/);
  });

  it('skips an exercise the routine does not have', () => {
    const items: SummarisableItem[] = [{ name: 'Curl', sets: [set('30')] }];
    assert.deepEqual(weightChanges(items, plan, 'KG'), []);
  });
});

describe('applyPlanChanges', () => {
  it('writes a new set count', () => {
    const next = applyPlanChanges(routine(planItem('Bench', 80, 3)), [
      { kind: 'sets', label: '', name: 'Bench', sets: 4 },
    ]);
    assert.equal(next.items[0]?.sets, 4);
  });

  it('writes a new weight', () => {
    const next = applyPlanChanges(routine(planItem('Bench', 80)), [
      { kind: 'weight', label: '', name: 'Bench', weight: 85 },
    ]);
    assert.equal(next.items[0]?.weight, 85);
  });

  it('renames a swapped exercise in place', () => {
    const next = applyPlanChanges(routine(planItem('Bench', 80), planItem('Fly', 15)), [
      { kind: 'swap', label: '', name: 'Bench', to: 'Dumbbell Press' },
    ]);
    assert.deepEqual(
      next.items.map((i) => i.name),
      ['Dumbbell Press', 'Fly'],
    );
    // Everything else about the row survives the rename.
    assert.equal(next.items[0]?.weight, 80);
  });

  it('appends an added exercise with the prototype’s defaults', () => {
    const next = applyPlanChanges(routine(planItem('Bench', 80)), [
      { kind: 'add', label: '', name: 'Cable Fly' },
    ]);
    assert.deepEqual(next.items[1], {
      name: 'Cable Fly',
      sets: 3,
      reps: '10',
      weight: 20,
      last: 'no history',
    });
  });

  it('does not duplicate an exercise the routine already has', () => {
    const next = applyPlanChanges(routine(planItem('Bench', 80)), [
      { kind: 'add', label: '', name: 'Bench' },
    ]);
    assert.equal(next.items.length, 1);
  });

  it('applies a swap before a later change to the new name', () => {
    // Chronological order is what makes name-keying work: the set count was
    // recorded against the exercise that replaced the original.
    const changes: Change[] = [
      { kind: 'swap', label: '', name: 'Bench', to: 'Dumbbell Press' },
      { kind: 'sets', label: '', name: 'Dumbbell Press', sets: 5 },
    ];
    const next = applyPlanChanges(routine(planItem('Bench', 80, 3)), changes);
    assert.equal(next.items[0]?.name, 'Dumbbell Press');
    assert.equal(next.items[0]?.sets, 5);
  });

  it('skips a change naming an exercise that is no longer there', () => {
    // The routine may have been edited mid-session; losing one deviation beats
    // refusing to save the rest.
    const next = applyPlanChanges(routine(planItem('Bench', 80)), [
      { kind: 'weight', label: '', name: 'Gone', weight: 99 },
      { kind: 'weight', label: '', name: 'Bench', weight: 85 },
    ]);
    assert.equal(next.items[0]?.weight, 85);
  });

  it('leaves the original routine untouched', () => {
    const before = routine(planItem('Bench', 80));
    applyPlanChanges(before, [{ kind: 'weight', label: '', name: 'Bench', weight: 85 }]);
    assert.equal(before.items[0]?.weight, 80);
  });
});
