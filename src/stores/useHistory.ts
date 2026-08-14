import { create } from 'zustand';

import { PREFILL_DEMO_DATA } from '@/config';
import { persist } from '@/db/persistence';
import { deleteSession } from '@/db/repositories/sessions';
import { HISTORY, type HistorySession } from '@/data/seed';

/**
 * Logged sessions, newest first.
 *
 * Finishing a workout prepends to this; deleting removes it outright rather
 * than tombstoning, because the SQLite layer owns tombstones and this store is
 * the pre-database stand-in.
 */
type HistoryState = {
  sessions: HistorySession[];
  add: (session: HistorySession) => void;
  remove: (id: string) => void;
};

export const useHistory = create<HistoryState>((set) => ({
  sessions: PREFILL_DEMO_DATA ? HISTORY : [],
  add: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  remove: (id) => {
    set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
    persist((db) => deleteSession(db, id));
  },
}));

/** "5 exercises" / "No sets logged" — the line under a history card's title. */
export function exerciseSummary(session: HistorySession): string {
  if (session.exercises.length === 0) return 'No sets logged';
  return `${session.exercises.length} ${session.exercises.length === 1 ? 'exercise' : 'exercises'}`;
}
