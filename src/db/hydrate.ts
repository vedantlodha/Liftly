/**
 * Loads the database into the stores at boot.
 *
 * Runs once, after migrations and seeding. Everything read here is shaped into
 * the store's own types rather than the row types, so screens never learn what
 * the schema looks like.
 */

import type { WeightUnit } from '@/stores/useUnits';
import { useHistory } from '@/stores/useHistory';
import { useRoutines } from '@/stores/useRoutines';
import { useSchedule } from '@/stores/useSchedule';
import { useSettings } from '@/stores/useSettings';
import type { DayIndex } from '@/domain/week';
import type { HistorySession, Routine } from '@/data/seed';
import type { Db } from './client';
import { listSessions } from './repositories/sessions';
import { getRoutineWithItems, listRoutines } from './repositories/routines';
import { getWeek } from './repositories/schedule';
import { getAllSettings, SETTING_KEYS } from './repositories/settings';

/** kg is the fallback when nothing has been stored yet. */
function toUnit(value: string | undefined): WeightUnit {
  return value === 'LB' ? 'LB' : 'KG';
}

function formatSetValue(set: {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
}): string {
  if (set.durationSec != null) return `${set.durationSec}s`;
  if (set.distanceM != null) return `${set.distanceM}m`;
  const weight = set.weightKg == null || set.weightKg === 0 ? 'BW' : String(set.weightKg);
  return `${weight} × ${set.reps ?? 0}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function hydrateStores(db: Db): Promise<void> {
  const settings = await getAllSettings(db);
  useSettings.setState({ defaultUnit: toUnit(settings[SETTING_KEYS.defaultWeightUnit]) });

  // Routines carry their items, so the builder and session can open without a
  // second round trip.
  const summaries = await listRoutines(db);
  const routines: Routine[] = [];
  for (const summary of summaries) {
    const full = await getRoutineWithItems(db, summary.id);
    if (!full) continue;
    routines.push({
      name: full.name,
      tag: full.tag,
      items: full.items.map((item) => ({
        name: item.exercise.name,
        sets: item.targetSets,
        reps: item.targetReps,
        weight: item.targetWeightKg ?? 0,
        last: 'no history',
      })),
    });
  }
  useRoutines.setState({ routines });

  // The schedule store keys days by routine *name*, matching the rest of the
  // app until ids reach the UI.
  const nameById = new Map(summaries.map((r) => [r.id, r.name]));
  const week = await getWeek(db, new Date());
  useSchedule.setState({
    days: week.map((day) => ({
      dayIndex: day.dayIndex as DayIndex,
      routineId: day.savedRoutineId ? (nameById.get(day.savedRoutineId) ?? null) : null,
      overrideRoutineId: day.overridden && day.routineId ? (nameById.get(day.routineId) ?? null) : null,
      overrideIsRest: day.overridden && day.routineId === null,
      overrideWeekStart: day.overridden ? weekStartOfToday() : null,
    })),
  });

  const logged = await listSessions(db);
  const sessions: HistorySession[] = logged.map((s) => {
    const started = s.startedAt;
    const activeMs = Math.max(0, (s.endedAt?.getTime() ?? started.getTime()) - started.getTime() - s.pausedMs);
    const setCount = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    const volume = s.exercises.reduce(
      (total, e) => total + e.sets.reduce((n, set) => n + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
      0,
    );
    return {
      id: s.id,
      name: s.name,
      date: `${DAYS[started.getDay()]} ${started.getDate()} ${MONTHS[started.getMonth()]}`,
      duration: `${Math.max(1, Math.round(activeMs / 60_000))}m`,
      setCount: String(setCount),
      volume: `${(volume / 1000).toFixed(1)}t`,
      startedAt: started.toTimeString().slice(0, 5),
      exercises: s.exercises.map((e) => ({ name: e.name, sets: e.sets.map(formatSetValue) })),
    };
  });
  useHistory.setState({ sessions });
}

/** Local Monday, matching `domain/week`'s stamp format. */
function weekStartOfToday(): string {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${m}-${d}`;
}
