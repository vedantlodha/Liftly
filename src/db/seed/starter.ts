/**
 * Starter content for a fresh install — the prototype's five routines and its
 * weekly plan, so the app is usable before the user builds anything.
 *
 * Exercises are referenced by their **catalog** name. The prototype used casual
 * names ("Deadlift", "Skullcrusher") where the catalog is formal, so the eight
 * that differ are translated here. `seedStarterData` throws on an unresolved
 * name rather than silently dropping an exercise from a routine.
 */

export type StarterItem = {
  /** Must match an exercise name in the catalog exactly. */
  exercise: string;
  sets: number;
  reps: string;
  weightKg: number;
};

export type StarterRoutine = {
  name: string;
  tag: string;
  items: StarterItem[];
};

export const STARTER_ROUTINES: StarterRoutine[] = [
  {
    name: 'Push A',
    tag: 'Chest · Shoulders · Triceps',
    items: [
      { exercise: 'Barbell Bench Press', sets: 4, reps: '6', weightKg: 80 },
      { exercise: 'Incline Dumbbell Press', sets: 3, reps: '8', weightKg: 30 },
      { exercise: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '8', weightKg: 22 },
      { exercise: 'Cable Fly', sets: 3, reps: '12', weightKg: 15 },
      { exercise: 'Triceps Pushdown', sets: 3, reps: '12', weightKg: 32 },
    ],
  },
  {
    name: 'Pull A',
    tag: 'Back · Biceps',
    items: [
      { exercise: 'Conventional Deadlift', sets: 3, reps: '5', weightKg: 140 },
      { exercise: 'Pull-Up', sets: 4, reps: '6', weightKg: 0 },
      { exercise: 'Seated Cable Row', sets: 3, reps: '10', weightKg: 60 },
      { exercise: 'One-Arm Dumbbell Row', sets: 3, reps: '10', weightKg: 32 },
      { exercise: 'Barbell Curl', sets: 3, reps: '10', weightKg: 30 },
    ],
  },
  {
    name: 'Legs',
    tag: 'Quads · Hams · Calves',
    items: [
      { exercise: 'Back Squat', sets: 4, reps: '5', weightKg: 110 },
      { exercise: 'Romanian Deadlift', sets: 3, reps: '8', weightKg: 90 },
      { exercise: 'Leg Press', sets: 3, reps: '12', weightKg: 180 },
      { exercise: 'Lying Leg Curl', sets: 3, reps: '12', weightKg: 45 },
      { exercise: 'Standing Calf Raise', sets: 4, reps: '15', weightKg: 70 },
    ],
  },
  {
    name: 'Push B',
    tag: 'Shoulder-led press day',
    items: [
      { exercise: 'Standing Barbell Overhead Press', sets: 4, reps: '6', weightKg: 50 },
      { exercise: 'Dumbbell Bench Press', sets: 3, reps: '10', weightKg: 32 },
      { exercise: 'Dumbbell Lateral Raise', sets: 4, reps: '15', weightKg: 10 },
      { exercise: 'Skull Crusher', sets: 3, reps: '10', weightKg: 30 },
    ],
  },
  {
    name: 'Conditioning',
    tag: 'Engine work',
    items: [
      { exercise: 'Rowing Machine', sets: 3, reps: '500m', weightKg: 0 },
      // The prototype used an Assault (fan) bike, which catalog v1.1 has no
      // entry for — see docs/catalog/README.md. Nearest real entry for now.
      { exercise: 'Stationary Bike', sets: 4, reps: '30s', weightKg: 0 },
      { exercise: 'Ab Wheel Rollout', sets: 3, reps: '10', weightKg: 0 },
    ],
  },
];

/** Mon-first. `null` is a rest day. */
export const STARTER_WEEK: (string | null)[] = [
  'Push A',
  'Pull A',
  null,
  'Legs',
  'Push B',
  'Conditioning',
  null,
];
