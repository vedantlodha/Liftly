import { Pressable, View } from 'react-native';

import type { Routine } from '@/data/seed';
import type { DayView } from '@/domain/dayView';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Button, CARET, Chevron, Text, useAnchor } from '@/ui';
import { RoutineSwitcher } from './RoutineSwitcher';

export type SessionCardProps = {
  day: DayView;
  routines: Routine[];
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  onCloseSwitcher: () => void;
  onPickRoutine: (name: string | null) => void;
  onEdit: () => void;
  onStart: () => void;
};

/**
 * The day card on Today.
 *
 * Shows the plan for today, the log for a past day, or the plan ahead for a
 * future one. Only today is interactive: the design hides Edit, the routine
 * switcher and Start on every other day, because there is nothing to change
 * about a day you are not on.
 */
export function SessionCard({
  day,
  routines,
  switcherOpen,
  onToggleSwitcher,
  onCloseSwitcher,
  onPickRoutine,
  onEdit,
  onStart,
}: SessionCardProps) {
  const anchor = useAnchor();

  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: border.card,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 18,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text variant="eyebrowTight" color={color.accent}>
          {day.kicker}
        </Text>
        {day.isToday && (
          <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
            <Text style={{ fontFamily: font.medium, fontSize: 11, color: ink.secondary }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {day.isToday ? (
        // The ref sits on the full-width wrapper, not the trigger: the design's
        // menu spans the card, and the routine name is only as wide as its text.
        <View ref={anchor.ref}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change routine, currently ${day.title}`}
            // Measured before opening so the menu lands under the trigger.
            onPress={() => (switcherOpen ? onToggleSwitcher() : anchor.measure(onToggleSwitcher))}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 9,
              marginLeft: -8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: radius.md,
              backgroundColor: pressed ? color.fill : 'transparent',
            })}
          >
            <Text variant="routineTitle">{day.title}</Text>
            <Chevron direction={switcherOpen ? 'up' : 'down'} size={CARET.md} color={ink.caret} />
          </Pressable>

          {switcherOpen && (
            <RoutineSwitcher
              routines={routines}
              current={day.title}
              anchor={anchor.rect}
              onDismiss={onCloseSwitcher}
              onPick={(name) => {
                onPickRoutine(name);
                onCloseSwitcher();
              }}
            />
          )}
        </View>
      ) : (
        <Text variant="routineTitle">{day.title}</Text>
      )}

      <Text style={{ fontFamily: font.regular, fontSize: 13, lineHeight: 18.2, color: ink.body, marginTop: 6 }}>
        {day.meta}
      </Text>

      <View style={{ marginTop: 18, marginBottom: 4, borderTopWidth: 1, borderTopColor: border.tile }}>
        {day.rows.map((row) => (
          <View
            key={row.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 11,
              borderBottomWidth: 1,
              borderBottomColor: border.row,
            }}
          >
            <Text variant="body">{row.name}</Text>
            <Text variant="monoSm">{row.detail}</Text>
          </View>
        ))}
      </View>

      {day.isToday && <Button label="Start workout" onPress={onStart} style={{ marginTop: 18 }} />}
    </View>
  );
}
