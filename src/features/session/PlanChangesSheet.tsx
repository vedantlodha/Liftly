import { Pressable, View } from 'react-native';

import type { Change } from '@/domain/planChanges';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Scroll, Sheet, Text } from '@/ui';

export type PlanChangesSheetProps = {
  /** The routine the session was built from. Freestyle sessions never get here. */
  routineName: string;
  changes: readonly Change[];
  /** Log the workout and leave the routine alone. */
  onJustToday: () => void;
  /** Log the workout and write the changes into the routine. */
  onUpdateRoutine: () => void;
  onDismiss: () => void;
};

/**
 * The question at the end of a workout that went off plan.
 *
 * Deliberately the last thing between finishing and the summary: deviations are
 * recorded silently as they happen, because being asked "is this the plan now?"
 * mid-set is an interruption, and the honest answer is usually not known until
 * the session is over.
 *
 * Both answers save the workout. The only thing at stake is next week.
 */
export function PlanChangesSheet({
  routineName,
  changes,
  onJustToday,
  onUpdateRoutine,
  onDismiss,
}: PlanChangesSheetProps) {
  return (
    <Sheet onDismiss={onDismiss}>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 22,
          lineHeight: 25.3,
          letterSpacing: -0.55,
          color: ink.primary,
        }}
      >
        You trained off plan
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 13,
          lineHeight: 19.5,
          color: ink.secondary,
          marginTop: 8,
          marginBottom: 18,
        }}
      >
        {`Keep these for today only, or write them into ${routineName} for every week?`}
      </Text>

      <Scroll
        style={{ backgroundColor: color.fill, borderRadius: radius.card, marginBottom: 20 }}
        // Ten exercises' worth of deviations would otherwise push the buttons
        // off the bottom of the sheet.
        contentContainerStyle={{ flexGrow: 0 }}
      >
        {changes.map((change, i) => (
          <View
            key={`${change.kind}-${change.name}-${i}`}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 11,
              paddingHorizontal: 15,
              paddingVertical: 13,
              // The design draws a rule under every row, last one included.
              borderBottomWidth: 1,
              borderBottomColor: border.rowFill,
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: radius.pill,
                backgroundColor: color.accent,
                marginTop: 6,
                flexGrow: 0,
                flexShrink: 0,
              }}
            />
            <Text
              style={{
                flex: 1,
                fontFamily: font.regular,
                fontSize: 13.5,
                lineHeight: 18.9,
                color: ink.primary,
              }}
            >
              {change.label}
            </Text>
          </View>
        ))}
      </Scroll>

      {/* Keeping the plan as it is comes first: it changes nothing beyond today. */}
      <Pressable
        accessibilityRole="button"
        onPress={onJustToday}
        style={{
          height: 50,
          borderRadius: radius.card,
          backgroundColor: color.fill,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 9,
        }}
      >
        <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: ink.primary }}>
          Just today
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onUpdateRoutine}
        style={{
          height: 52,
          borderRadius: radius.card,
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: font.semibold, fontSize: 15, color: color.surface }}>
          {`Update ${routineName}`}
        </Text>
      </Pressable>
    </Sheet>
  );
}
