import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useHistory } from '@/stores/useHistory';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Card, Chevron, ConfirmDialog, Screen, Scroll, Stat, StatRow, Text } from '@/ui';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useHistory((s) => s.sessions.find((x) => x.id === id));
  const remove = useHistory((s) => s.remove);
  const [confirming, setConfirming] = useState(false);

  // Deleting pops this route, so a brief render with no session is expected.
  if (!session) return <Screen />;

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: border.tile,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            marginLeft: -4,
            borderRadius: radius.md,
            backgroundColor: pressed ? color.fillPressed : color.fillInput,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Chevron direction="left" color={ink.chevron} />
        </Pressable>

        <Text variant="eyebrow" style={{ flex: 1, fontSize: 12, letterSpacing: 1.2 }}>
          Session
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete session"
          onPress={() => setConfirming(true)}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: radius.lg,
            backgroundColor: pressed ? '#FFDCD7' : color.dangerBg,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <TrashIcon />
        </Pressable>
      </View>

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 22, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: font.semibold, fontSize: 30, lineHeight: 31.5, letterSpacing: -0.84, color: ink.primary }}>
          {session.name}
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 13, color: ink.secondary, marginTop: 8 }}>
          {`${session.date} · started ${session.startedAt}`}
        </Text>

        <StatRow style={{ marginTop: 22, marginBottom: 24 }}>
          <Stat size="sm" value={session.duration} label="duration" />
          <Stat size="sm" value={session.setCount} label="sets" />
          <Stat size="sm" value={session.volume} label="volume" />
        </StatRow>

        {session.exercises.length === 0 && (
          <Card tone="dashed" padding="roomy" style={{ paddingVertical: 30, borderRadius: radius.menu }}>
            <Text variant="rowTitle" style={{ textAlign: 'center' }}>
              No sets logged
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              This session was finished before anything was ticked off.
            </Text>
          </Card>
        )}

        <View style={{ gap: 9 }}>
          {session.exercises.map((exercise) => (
            <View
              key={exercise.name}
              style={{
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: border.card,
                borderRadius: radius.menu,
                paddingHorizontal: 16,
                paddingTop: 15,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontFamily: font.semibold, fontSize: 15, letterSpacing: -0.18, color: ink.primary }}>
                  {exercise.name}
                </Text>
                <Text style={{ fontFamily: font.mono, fontSize: 11, color: ink.strip }}>
                  {`${exercise.sets.length} ${exercise.sets.length === 1 ? 'set' : 'sets'}`}
                </Text>
              </View>

              {exercise.sets.map((value, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 9,
                    borderTopWidth: 1,
                    borderTopColor: border.rowSoft,
                  }}
                >
                  <Text style={{ width: 20, fontFamily: font.monoMedium, fontSize: 11, color: ink.index }}>
                    {i + 1}
                  </Text>
                  <Text style={{ fontFamily: font.monoMedium, fontSize: 14, color: ink.primary }}>{value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Scroll>

      {confirming && (
        <ConfirmDialog
          title="Delete this session?"
          message={`${session.name} on ${session.date} will be removed from your log. This cannot be undone.`}
          onDismiss={() => setConfirming(false)}
          actions={[
            {
              label: 'Delete session',
              tone: 'danger',
              onPress: () => {
                setConfirming(false);
                remove(session.id);
                router.back();
                toast(`${session.name} deleted from your log`);
              },
            },
            { label: 'Keep it', tone: 'neutral', onPress: () => setConfirming(false) },
          ]}
        />
      )}
    </Screen>
  );
}

/** Drawn from rects, as the design draws it — no icon dependency. */
function TrashIcon() {
  const bar = { position: 'absolute', height: 1.9, borderRadius: 2, backgroundColor: color.dangerInk } as const;
  return (
    <View style={{ width: 13, height: 14 }}>
      <View style={[bar, { left: 4, right: 4, top: 0 }]} />
      <View style={[bar, { left: 0, right: 0, top: 2 }]} />
      <View
        style={{
          position: 'absolute',
          left: 1.5,
          right: 1.5,
          top: 4,
          bottom: 0,
          borderWidth: 1.9,
          borderTopWidth: 0,
          borderColor: color.dangerInk,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}
