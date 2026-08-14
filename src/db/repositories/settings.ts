/**
 * Key-value preferences.
 *
 * Values are stored as text and parsed at the edge, so adding a preference
 * never needs a migration.
 */

import { and, eq, isNull } from 'drizzle-orm';

import type { Db } from '../client';
import { appSettings } from '../schema';

export const SETTING_KEYS = {
  defaultWeightUnit: 'default_weight_unit',
  restSeconds: 'rest_seconds',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(db: Db, key: SettingKey): Promise<string | null> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(and(eq(appSettings.key, key), isNull(appSettings.deletedAt)));
  return row?.value ?? null;
}

export async function setSetting(db: Db, key: SettingKey, value: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date(), deletedAt: null },
    });
}

/** Every preference in one read, for hydrating stores at boot. */
export async function getAllSettings(db: Db): Promise<Record<string, string>> {
  const rows = await db
    .select({ key: appSettings.key, value: appSettings.value })
    .from(appSettings)
    .where(isNull(appSettings.deletedAt));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
