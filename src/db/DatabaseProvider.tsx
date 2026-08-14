import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { color, space } from '@/theme/tokens';
import { Text } from '@/ui';
import { db } from './client';
import migrations from '../../drizzle/migrations';
import { hydrateStores } from './hydrate';
import { attachDatabase } from './persistence';
import { initDatabase } from './seed';

/**
 * Runs migrations, then syncs the catalog and seeds starter content, before
 * rendering the app. Nothing downstream has to guard against a missing table.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success || seeded) return;
    let cancelled = false;
    // Order matters: migrate, seed, load into the stores, and only then let
    // writes through — otherwise hydration would race its own persistence.
    initDatabase(db)
      .then(() => hydrateStores(db))
      .then(() => {
        if (cancelled) return;
        attachDatabase(db);
        setSeeded(true);
      })
      .catch((e: unknown) => !cancelled && setSeedError(e instanceof Error ? e : new Error(String(e))));
    return () => {
      cancelled = true;
    };
  }, [success, seeded]);

  const error = migrationError ?? seedError;
  if (error) return <DbError error={error} />;
  if (!success || !seeded) return <DbLoading />;
  return <>{children}</>;
}

function DbLoading() {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={color.accent} />
    </View>
  );
}

function DbError({ error }: { error: Error }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.gutter,
        gap: space.md,
      }}
    >
      <Text variant="cardTitle">Could not open your training log</Text>
      <Text variant="bodySm" style={{ textAlign: 'center' }}>
        {error.message}
      </Text>
    </View>
  );
}
