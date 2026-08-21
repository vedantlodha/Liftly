import type { HistorySession, Routine } from '@/data/seed';

/**
 * What the Today card shows for the day selected in the week strip.
 *
 * The strip no longer navigates away — tapping a day re-points this card at it,
 * so one screen covers "what did I do on Tuesday", "what am I doing now" and
 * "what is coming on Sunday".
 */

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DSHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MSHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type DayRow = { name: string; detail: string };

export type DayView = {
  /** The selected date itself. */
  date: Date;
  /** "FRI · 14 AUG", the page eyebrow. */
  label: string;
  /** Page title, and the card's heading. */
  title: string;
  /** "TODAY'S SESSION" / "LOGGED · Fri 14 Aug" / "UPCOMING · Sun 16 Aug". */
  kicker: string;
  /** Only today is editable, swappable and startable. */
  isToday: boolean;
  /** A completed session is read-only history, not a plan. */
  isLogged: boolean;
  /** Null when the day is a rest day, which switches the card to its empty state. */
  meta: string | null;
  rows: DayRow[];
  restTitle: string;
  restSub: string;
};

/** The key `HistorySession.date` uses — "Fri 14 Aug". */
export function logKeyFor(date: Date): string {
  return `${DSHORT[date.getDay()]} ${date.getDate()} ${MSHORT[date.getMonth()]}`;
}

/** "3 sets · 32 × 10" — a logged exercise, summarised by its last set. */
function loggedRow(exercise: { name: string; sets: string[] }): DayRow {
  const n = exercise.sets.length;
  return {
    name: exercise.name,
    detail: `${n} ${n === 1 ? 'set' : 'sets'} · ${exercise.sets[n - 1] ?? ''}`,
  };
}

export function buildDayView(input: {
  /** Days from today; 0 is today. */
  offset: number;
  now: Date;
  /** The routine scheduled for that weekday, already resolved by the caller. */
  scheduled: Routine | undefined;
  log: readonly HistorySession[];
  /** True when the day was deliberately marked as rest, not merely left unset. */
  isRest: boolean;
  /** "Push A on Monday", for the rest-day card. Only used for today. */
  nextUp: string;
  /** Whether any routine exists at all — changes what today's empty card says. */
  hasRoutines: boolean;
}): DayView {
  const { offset, now, scheduled, log, nextUp, isRest, hasRoutines } = input;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const weekday = (date.getDay() + 6) % 7;
  const isToday = offset === 0;

  // Today counts: once a workout is finished the card should show what was
  // done, not offer to start it again. Only the future can never have a log.
  const logged = offset <= 0 ? log.find((s) => s.date === logKeyFor(date)) : undefined;
  // History wins over the plan — what happened beats what was scheduled.
  const routine = logged ? undefined : scheduled;

  const dated = `${DSHORT[date.getDay()]} ${date.getDate()} ${MSHORT[date.getMonth()]}`;
  const kicker = isToday
    ? 'Today’s session'
    : logged
      ? `Logged · ${dated}`
      : `${offset < 0 ? 'Scheduled' : 'Upcoming'} · ${dated}`;

  const rows = logged
    ? logged.exercises.map(loggedRow)
    : (routine?.items.map((i) => ({ name: i.name, detail: `${i.sets} × ${i.reps}` })) ?? []);

  const meta = logged
    ? `${logged.duration} · ${logged.setCount} sets · ${logged.volume} moved`
    : routine
      ? `${routine.tag} · ${routine.items.length} exercises · ~${30 + routine.items.length * 8} min`
      : null;

  return {
    date,
    label: `${DAYS[weekday]} · ${date.getDate()} ${MONTHS[date.getMonth()]}`,
    title: logged?.name ?? routine?.name ?? 'Rest day',
    kicker,
    isToday,
    isLogged: logged != null,
    meta,
    rows,
    // A day can be empty because it is a rest day or because nothing was ever
    // put on it, and those deserve different words.
    restTitle: offset < 0 ? 'Nothing logged' : isRest ? 'Rest day' : 'No routine added',
    restSub: isToday
      ? isRest
        ? nextUp === 'nothing'
          ? 'Recovery day — nothing else scheduled.'
          : `Recovery day. Next up is ${nextUp}.`
        : hasRoutines
          ? 'Nothing scheduled for today. Pick a workout or take the rest.'
          : 'No routines yet. Build one and put it on a day to get started.'
      : offset < 0
        ? 'No session recorded on this day.'
        : isRest
          ? 'Recovery, walk, stretch.'
          : 'No routine added to this day yet.',
  };
}
