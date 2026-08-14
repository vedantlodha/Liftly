import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

/**
 * The single SQLite handle for the app.
 *
 * `enableChangeListener` powers Drizzle's `useLiveQuery`, so screens re-render
 * when a write lands rather than needing manual invalidation.
 */
export const sqlite = SQLite.openDatabaseSync('liftly.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

export type Db = typeof db;
