import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useSession } from '@/stores/useSession';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Button, Screen, Scroll, Stat, StatRow, Text } from '@/ui';

/**
 * Post-session summary.
 *
 * Reads the summary the store computed at finish rather than the session
 * itself, which is already gone by this point — the numbers are a record, so
 * nothing here can recompute or drift.
 */
export default function SessionSummaryScreen() {
  const finished = useSession((s) => s.finished);
  const clearFinished = useSession((s) => s.clearFinished);

  // Reaching this route without a finished session (a refresh, a deep link)
  // should return home rather than render an empty shell.
  useEffect(() => {
    if (!finished) router.replace('/');
  }, [finished]);

  if (!finished) return <Screen />;

  const close = () => {
    clearFinished();
    router.replace('/');
  };

  return (
    <Screen>
      <Scroll contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 34, paddingBottom: 40 }}>
        <Text variant="eyebrow" color={color.accent}>
          Session complete
        </Text>
        <Text variant="displayTitle" style={{ marginTop: 12 }}>
          {finished.name}
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 13.5, color: ink.secondary, marginTop: 8 }}>
          {finished.when}
        </Text>

        <StatRow style={{ marginTop: 28, marginBottom: 8 }}>
          <Stat size="lg" value={`${finished.durationMin}m`} label="duration" />
          <Stat size="lg" value={String(finished.setsCompleted)} label="sets" />
          <Stat size="lg" value={String(finished.volume)} label={finished.volumeLabel} />
        </StatRow>

        <View
          style={{
            marginTop: 26,
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: border.card,
            borderRadius: radius.menu,
            overflow: 'hidden',
          }}
        >
          {finished.rows.map((row, i) => (
            <View
              key={`${row.name}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: i === finished.rows.length - 1 ? 0 : 1,
                borderBottomColor: border.rowSoft,
              }}
            >
              <Text variant="body" style={{ flex: 1 }}>
                {row.name}
              </Text>
              <Text style={{ fontFamily: font.mono, fontSize: 12.5, color: ink.secondary }}>{row.value}</Text>
            </View>
          ))}
        </View>
      </Scroll>

      <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
        <Button label="Done" onPress={close} />
      </View>
    </Screen>
  );
}
