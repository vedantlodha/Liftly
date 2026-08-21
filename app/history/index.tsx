import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { exerciseSummary, useHistory } from '@/stores/useHistory';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Card, EmptyState, Screen, Scroll, SubScreenBar, Text } from '@/ui';

export default function HistoryScreen() {
  const sessions = useHistory((s) => s.sessions);

  return (
    <Screen>
      <SubScreenBar label="Log" onBack={() => router.back()} />

      <View style={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 6 }}>
        <Text variant="eyebrow">
          {sessions.length === 0
            ? 'Nothing logged yet'
            : `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} logged`}
        </Text>
        <Text variant="pageTitle" style={{ marginTop: 9 }}>
          History
        </Text>
      </View>

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 34, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 && (
          <EmptyState
            title="Nothing logged yet"
            message="Finish a workout and it will show up here with every set you logged."
          />
        )}

        {sessions.map((session) => (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityLabel={`${session.name}, ${session.date}`}
            onPress={() => router.push(`/history/${session.id}`)}
            style={({ pressed }) => ({
              backgroundColor: color.surface,
              borderWidth: 1,
              // The design tints the border on hover rather than the fill.
              borderColor: pressed ? 'rgba(47,107,255,0.45)' : border.card,
              borderRadius: radius.menu,
              padding: 16,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.16, color: ink.primary }}>
                {session.name}
              </Text>
              <Text style={{ fontFamily: font.mono, fontSize: 11, color: ink.strip }}>{session.date}</Text>
            </View>

            <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.strip, marginTop: 5 }}>
              {exerciseSummary(session)}
            </Text>

            <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
              <MiniStat value={session.duration} label="duration" />
              <MiniStat value={session.setCount} label="sets" />
              <MiniStat value={session.volume} label="volume" />
            </View>
          </Pressable>
        ))}

        {sessions.length === 0 && (
          <Card tone="dashed" padding="roomy" style={{ paddingVertical: 30 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center' }}>
              No sessions yet
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              Finish a workout and it will show up here.
            </Text>
          </Card>
        )}
      </Scroll>
    </Screen>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={{ fontFamily: font.monoMedium, fontSize: 15, color: ink.primary }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 10, color: ink.faint, marginTop: 3 }}>{label}</Text>
    </View>
  );
}
