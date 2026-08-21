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
  onCreateRoutine: () => void;
  onEdit: () => void;
  onStart: () => void;
  /** A workout is already open, so Start would actually resume it. */
  sessionOpen: boolean;
};

/**
 * The day card on Today.
 *
 * Shows the plan for today, the log for a day already trained, or the plan
 * ahead for a future one. Only an unfinished today is interactive: Edit, the
 * routine switcher and Start all disappear once there is nothing left to
 * decide — either because the day is not today, or because it is already done.
 */
export function SessionCard({
  day,
  routines,
  switcherOpen,
  onToggleSwitcher,
  onCloseSwitcher,
  onPickRoutine,
  onCreateRoutine,
  onEdit,
  onStart,
  sessionOpen,
}: SessionCardProps) {
  const anchor = useAnchor();
  const actionable = day.isToday && !day.isLogged;

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
        {actionable && (
          <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
            <Text style={{ fontFamily: font.medium, fontSize: 11, color: ink.secondary }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {actionable ? (
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
              onCreate={() => {
                onCloseSwitcher();
                onCreateRoutine();
              }}
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

      {actionable && (
        <Button
          // Tapping this with a workout already open resumes it rather than
          // starting a second one, so it should not claim otherwise.
          label={sessionOpen ? 'Resume workout' : 'Start workout'}
          onPress={onStart}
          style={{ marginTop: 18 }}
        />
      )}
    </View>
  );
}
