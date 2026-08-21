import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { DefaultUnitCard } from '@/features/routines/DefaultUnitCard';
import { SwipeToDelete } from '@/features/session/SwipeToDelete';
import { usePeekOnce } from '@/features/session/usePeekOnce';
import { routineStats, useRoutines } from '@/stores/useRoutines';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { EmptyState, ListGlyph, Screen, ScreenHeader, Scroll, Text } from '@/ui';

export default function RoutinesScreen() {
  const routines = useRoutines((s) => s.routines);
  const remove = useRoutines((s) => s.remove);
  const restore = useRoutines((s) => s.restore);
  // Nothing to demonstrate the gesture on when the list is empty.
  const peek = usePeekOnce('routines', routines.length > 0);

  return (
    <Screen>
      <ScreenHeader
        eyebrow={
          routines.length
            ? `${routines.length} saved ${routines.length === 1 ? 'routine' : 'routines'}`
            : 'No saved routines yet'
        }
        title="Routines"
      />

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 168 }}
        showsVerticalScrollIndicator={false}
      >
        <DefaultUnitCard />

        {routines.length === 0 && (
          <EmptyState
            icon={<ListGlyph />}
            title="No routines yet"
            message="Build your first one with the + button, then put it on a day in Schedule."
          />
        )}

        <View
          style={{
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: border.card,
            borderRadius: radius.menu,
            overflow: 'hidden',
            // Collapsed entirely when empty, so its border does not sit under
            // the empty-state card as a stray line.
            display: routines.length ? 'flex' : 'none',
          }}
        >
          {routines.map((routine, i) => (
            <SwipeToDelete
              key={routine.name}
              peek={peek && i === 0}
              label="Delete routine"
              onDelete={() => {
                remove(routine.name);
                // A swipe is quick and easy to trigger by accident, so the
                // toast is the only thing standing between that and a lost plan.
                toast(`${routine.name} deleted`, () => restore(routine, i));
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${routine.name}`}
                onPress={() => router.push(`/routine/${encodeURIComponent(routine.name)}`)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: i === routines.length - 1 ? 0 : 1,
                  borderBottomColor: border.rowSoft,
                  backgroundColor: pressed ? color.fillHover : color.surface,
                })}
              >
                <Text
                  style={{ fontFamily: font.semibold, fontSize: 15.5, letterSpacing: -0.19, color: ink.primary }}
                >
                  {routine.name}
                </Text>
                <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.eyebrow, marginTop: 4 }}>
                  {routineStats(routine)}
                </Text>
              </Pressable>
            </SwipeToDelete>
          ))}

          {routines.length === 0 && (
            <View style={{ paddingVertical: 30, paddingHorizontal: 20 }}>
              <Text variant="rowTitle" style={{ textAlign: 'center' }}>
                No routines yet
              </Text>
              <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
                Build one and it will show up on the days you schedule it.
              </Text>
            </View>
          )}
        </View>
      </Scroll>

      <NewRoutineButton onPress={() => router.push('/routine/new')} />
    </Screen>
  );
}

/** Floating action button. Sits above the tab bar, as in the design. */
function NewRoutineButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New routine"
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        right: 20,
        bottom: 88,
        zIndex: 35,
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: color.accent,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 10px 26px rgba(47,107,255,0.36)',
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {/* Drawn rather than a glyph, so the bar weight matches the design. */}
      <View style={{ position: 'absolute', width: 22, height: 2.6, borderRadius: 2, backgroundColor: color.onAccent }} />
      <View style={{ position: 'absolute', width: 2.6, height: 22, borderRadius: 2, backgroundColor: color.onAccent }} />
    </Pressable>
  );
}
