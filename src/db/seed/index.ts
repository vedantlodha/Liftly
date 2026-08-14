import type { Db } from '../client';
import { newId } from '../id';
import * as core from './core';

/** App-facing seeding, bound to the Expo UUID generator. */
export const syncCatalog = (db: Db) => core.syncCatalog(db, newId);
export const seedStarterData = (db: Db) => core.seedStarterData(db, newId);
export const initDatabase = (db: Db) => core.initDatabase(db, newId);
