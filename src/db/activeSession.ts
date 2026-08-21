/**
 * Keeps the in-progress workout alive across an app restart.
 *
 * The live session is React state, so anything that ends the process — a swipe
 * away, Android reclaiming memory during a long rest, a crash — used to take
 * the whole workout with it. That is the worst possible moment to lose data:
 * mid-session, with sets logged and no way to get them back.
 *
 * Stored as JSON in `app_settings` rather than reaching for MMKV, because the
 * database is already open and already survives a restart.
 */

import { AppState } from 'react-native';

import type { Db } from './client';
import { persist } from './persistence';
import { getSetting, setSetting, SETTING_KEYS } from './repositories/settings';
import { useSession, type Session } from '@/stores/useSession';

type Snapshot = {
  session: Session;
  pausedAt: number | null;
  pausedMs: number;
  restEndsAt: number | null;
  /** When this snapshot was taken — see `restore` for why it matters. */
  savedAt: number;
};

function snapshot(): Snapshot | null {
  const { session, pausedAt, pausedMs, restEndsAt } = useSession.getState();
  if (!session) return null;
  return { session, pausedAt, pausedMs, restEndsAt, savedAt: Date.now() };
}

/**
 * Mirrors the live session into the database whenever it changes.
 *
 * A subscription rather than a call in every reducer: there are a dozen ways to
 * mutate a session and one of them would eventually be missed.
 */
export function watchActiveSession(): () => void {
  const save = () => {
    const current = snapshot();
    persist((db) =>
      setSetting(db, SETTING_KEYS.activeSession, current ? JSON.stringify(current) : ''),
    );
  };

  console.log('[liftly] active-session mirror armed');
  const unsubscribe = useSession.subscribe((state, previous) => {
    const changed =
      state.session !== previous.session ||
      state.pausedAt !== previous.pausedAt ||
      state.pausedMs !== previous.pausedMs ||
      state.restEndsAt !== previous.restEndsAt;
    if (changed) save();
  });

  // Second line of defence. Backgrounding is precisely when Android decides to
  // reclaim the process — often minutes later, mid-rest, with the phone in a
  // pocket — so the snapshot is flushed on the way out rather than trusting the
  // last state change to have already been queued.
  const appState = AppState.addEventListener('change', (next) => {
    if (next !== 'active') save();
  });

  return () => {
    console.log('[liftly] active-session mirror torn down');
    unsubscribe();
    appState.remove();
  };
}

/**
 * Puts a saved workout back, if there is one.
 *
 * A session that was running when the app died is restored **paused**, timed to
 * the last snapshot. The alternative is counting the hours the app spent closed
 * as training time, which would make the duration a lie.
 */
export async function restoreActiveSession(db: Db): Promise<void> {
  const raw = await getSetting(db, SETTING_KEYS.activeSession);
  if (!raw) return;

  let saved: Snapshot;
  try {
    saved = JSON.parse(raw) as Snapshot;
  } catch {
    // A half-written or outdated snapshot is not worth crashing the launch over.
    return;
  }
  if (!saved?.session?.items) return;

  const done = saved.session.items.reduce((n, it) => n + it.sets.filter((sv) => sv.done).length, 0);
  console.log(`[liftly] recovered workout "${saved.session.name}" with ${done} sets logged`);

  useSession.setState({
    session: saved.session,
    pausedMs: saved.pausedMs ?? 0,
    pausedAt: saved.pausedAt ?? saved.savedAt ?? Date.now(),
    // A rest timer that expired while the app was closed has nothing to count.
    restEndsAt: saved.restEndsAt != null && saved.restEndsAt > Date.now() ? saved.restEndsAt : null,
    pad: null,
  });
}
