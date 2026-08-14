import type { WeightUnit } from '@/stores/useUnits';

/**
 * Seed data lifted verbatim from the prototype's `state` object.
 *
 * Phase 1 moves this into the SQLite seed; screens read it directly for now so
 * the UI can be built and reviewed before the data layer exists.
 */

export type RoutineItem = {
  name: string;
  sets: number;
  reps: string;
  weight: number;
  last: string;
  /** Set in the routine builder. Falls back to the app's default unit. */
  unit?: WeightUnit;
};

export type Routine = {
  name: string;
  /** Muscle-group summary shown under the routine title. */
  tag: string;
  items: RoutineItem[];
};

export const ROUTINES: Routine[] = [
  {
    name: 'Push A',
    tag: 'Chest · Shoulders · Triceps',
    items: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6', weight: 80, last: '77.5 × 8' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8', weight: 30, last: '30 × 9' },
      { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '8', weight: 22, last: '22 × 8' },
      { name: 'Cable Fly', sets: 3, reps: '12', weight: 15, last: '15 × 13' },
      { name: 'Triceps Pushdown', sets: 3, reps: '12', weight: 32, last: '30 × 12' },
    ],
  },
  {
    name: 'Pull A',
    tag: 'Back · Biceps',
    items: [
      { name: 'Conventional Deadlift', sets: 3, reps: '5', weight: 140, last: '135 × 5' },
      { name: 'Pull-Up', sets: 4, reps: '6', weight: 0, last: 'BW × 8' },
      { name: 'Seated Cable Row', sets: 3, reps: '10', weight: 60, last: '60 × 10' },
      { name: 'One-Arm Dumbbell Row', sets: 3, reps: '10', weight: 32, last: '30 × 10' },
      { name: 'Barbell Curl', sets: 3, reps: '10', weight: 30, last: '30 × 9' },
    ],
  },
  {
    name: 'Legs',
    tag: 'Quads · Hams · Calves',
    items: [
      { name: 'Back Squat', sets: 4, reps: '5', weight: 110, last: '107.5 × 5' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8', weight: 90, last: '90 × 8' },
      { name: 'Leg Press', sets: 3, reps: '12', weight: 180, last: '175 × 12' },
      { name: 'Lying Leg Curl', sets: 3, reps: '12', weight: 45, last: '45 × 11' },
      { name: 'Standing Calf Raise', sets: 4, reps: '15', weight: 70, last: '70 × 15' },
    ],
  },
  {
    name: 'Push B',
    tag: 'Shoulder-led press day',
    items: [
      { name: 'Standing Barbell Overhead Press', sets: 4, reps: '6', weight: 50, last: '50 × 6' },
      { name: 'Dumbbell Bench Press', sets: 3, reps: '10', weight: 32, last: '32 × 10' },
      { name: 'Dumbbell Lateral Raise', sets: 4, reps: '15', weight: 10, last: '10 × 15' },
      { name: 'Skull Crusher', sets: 3, reps: '10', weight: 30, last: '30 × 10' },
    ],
  },
  {
    name: 'Conditioning',
    tag: 'Engine work',
    items: [
      { name: 'Rowing Machine', sets: 3, reps: '500m', weight: 0, last: '2:02 / 500m' },
      { name: 'Stationary Bike', sets: 4, reps: '30s', weight: 0, last: '30s hard' },
      { name: 'Ab Wheel Rollout', sets: 3, reps: '10', weight: 0, last: 'BW × 10' },
    ],
  },
];

export type ScheduleDay = {
  /** Mon-first. */
  day: string;
  routine: string | null;
  /** Override that applies to the current week only. */
  thisWeekOnly: boolean;
  done: boolean;
};

export const WEEK: ScheduleDay[] = [
  { day: 'Mon', routine: 'Push A', thisWeekOnly: false, done: true },
  { day: 'Tue', routine: 'Pull A', thisWeekOnly: false, done: false },
  { day: 'Wed', routine: null, thisWeekOnly: false, done: false },
  { day: 'Thu', routine: 'Legs', thisWeekOnly: false, done: false },
  { day: 'Fri', routine: 'Push B', thisWeekOnly: false, done: false },
  { day: 'Sat', routine: 'Conditioning', thisWeekOnly: true, done: false },
  { day: 'Sun', routine: null, thisWeekOnly: false, done: false },
];

/** Dates of logged sessions, formatted as the strip formats them ("Mon 10 Aug"). */
export const LOGGED_DATES = ['Mon 10 Aug', 'Sat 8 Aug', 'Fri 7 Aug', 'Wed 5 Aug'];

export function findRoutine(name: string | null): Routine | undefined {
  return name == null ? undefined : ROUTINES.find((r) => r.name === name);
}

/** Mon = 0, matching the schedule array. */
export function todayIndex(now = new Date()): number {
  return (now.getDay() + 6) % 7;
}

// ── Logged sessions ──────────────────────────────────────────

export type HistoryExercise = {
  name: string;
  /** Pre-formatted per set, e.g. "77.5 × 8" or "BW × 8". */
  sets: string[];
};

export type HistorySession = {
  /** Stable route key. Real sessions will carry a UUID. */
  id: string;
  name: string;
  /** "Mon 10 Aug" */
  date: string;
  duration: string;
  setCount: string;
  volume: string;
  /** Clock time the session began, e.g. "18:12". */
  startedAt: string;
  exercises: HistoryExercise[];
};

export const HISTORY: HistorySession[] = [
  {
    id: 'push-a-10-aug',
    name: 'Push A',
    date: 'Mon 10 Aug',
    duration: '58m',
    setCount: '16',
    volume: '8.4t',
    startedAt: '18:12',
    exercises: [
      { name: 'Barbell Bench Press', sets: ['77.5 × 8', '77.5 × 8', '77.5 × 7', '75 × 8'] },
      { name: 'Incline Dumbbell Press', sets: ['30 × 9', '30 × 8', '30 × 8'] },
      { name: 'Seated Dumbbell Shoulder Press', sets: ['22 × 8', '22 × 8', '20 × 10'] },
      { name: 'Cable Fly', sets: ['15 × 13', '15 × 12', '15 × 12'] },
      { name: 'Triceps Pushdown', sets: ['30 × 12', '30 × 12', '30 × 11'] },
    ],
  },
  {
    id: 'legs-8-aug',
    name: 'Legs',
    date: 'Sat 8 Aug',
    duration: '1h 04m',
    setCount: '18',
    volume: '12.5t',
    startedAt: '09:40',
    exercises: [
      { name: 'Back Squat', sets: ['107.5 × 5', '107.5 × 5', '107.5 × 5', '100 × 6'] },
      { name: 'Romanian Deadlift', sets: ['90 × 8', '90 × 8', '90 × 8'] },
      { name: 'Leg Press', sets: ['175 × 12', '175 × 12', '175 × 10'] },
      { name: 'Lying Leg Curl', sets: ['45 × 11', '45 × 11', '45 × 10'] },
      { name: 'Standing Calf Raise', sets: ['70 × 15', '70 × 15', '70 × 14', '70 × 12'] },
    ],
  },
  {
    id: 'push-b-7-aug',
    name: 'Push B',
    date: 'Fri 7 Aug',
    duration: '52m',
    setCount: '14',
    volume: '7.1t',
    startedAt: '18:05',
    exercises: [
      { name: 'Standing Barbell Overhead Press', sets: ['50 × 6', '50 × 6', '50 × 5', '45 × 8'] },
      { name: 'Dumbbell Bench Press', sets: ['32 × 10', '32 × 9', '32 × 9'] },
      { name: 'Dumbbell Lateral Raise', sets: ['10 × 15', '10 × 15', '10 × 14', '10 × 12'] },
      { name: 'Skull Crusher', sets: ['30 × 10', '30 × 10', '30 × 9'] },
    ],
  },
  {
    id: 'pull-a-5-aug',
    name: 'Pull A',
    date: 'Wed 5 Aug',
    duration: '58m',
    setCount: '16',
    volume: '9.9t',
    startedAt: '18:20',
    exercises: [
      { name: 'Conventional Deadlift', sets: ['135 × 5', '135 × 5', '135 × 5'] },
      { name: 'Pull-Up', sets: ['BW × 8', 'BW × 8', 'BW × 7', 'BW × 6'] },
      { name: 'Seated Cable Row', sets: ['60 × 10', '60 × 10', '60 × 10'] },
      { name: 'One-Arm Dumbbell Row', sets: ['30 × 10', '30 × 10', '30 × 9'] },
      { name: 'Barbell Curl', sets: ['30 × 9', '30 × 9', '30 × 8'] },
    ],
  },
];
