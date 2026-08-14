import { weekStartKey } from './week';

/** The three numbers under "This week so far" on Today. */
export type WeekTotals = {
  sessions: number;
  sets: number;
  /** Volume in tonnes, already rounded for display. */
  tonnes: number;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Parses a log date — "Mon 10 Aug" — against the year it most likely belongs to.
 *
 * History carries no year, so a January "31 Dec" entry has to resolve to the
 * previous year rather than eleven months in the future.
 */
export function parseLogDate(date: string, now: Date): Date | null {
  const match = /(\d{1,2})\s+([A-Za-z]{3})/.exec(date);
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTHS.indexOf((match[2] ?? '').toLowerCase());
  if (month < 0) return null;
  const sameYear = new Date(now.getFullYear(), month, day);
  // More than a month ahead means the entry belongs to the year that just ended.
  const aheadByDays = (sameYear.getTime() - now.getTime()) / 86_400_000;
  return aheadByDays > 31 ? new Date(now.getFullYear() - 1, month, day) : sameYear;
}

/** "4.7t" / "1560" → a number of tonnes; anything unparseable counts as zero. */
function tonnesOf(volume: string): number {
  const value = parseFloat(volume);
  if (!Number.isFinite(value)) return 0;
  return volume.trim().toLowerCase().endsWith('t') ? value : value / 1000;
}

/**
 * Totals the sessions logged in the week containing `now`.
 *
 * Weeks start on Monday, matching the schedule grid, so a Sunday session still
 * counts toward the week it finished.
 */
export function weekTotals(
  log: readonly { date: string; setCount: string; volume: string }[],
  now: Date,
): WeekTotals {
  const thisWeek = weekStartKey(now);
  let sessions = 0;
  let sets = 0;
  let tonnes = 0;

  for (const entry of log) {
    const when = parseLogDate(entry.date, now);
    if (!when || weekStartKey(when) !== thisWeek) continue;
    sessions += 1;
    sets += Number.parseInt(entry.setCount, 10) || 0;
    tonnes += tonnesOf(entry.volume);
  }

  return { sessions, sets, tonnes: Math.round(tonnes * 10) / 10 };
}
