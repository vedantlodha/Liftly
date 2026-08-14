import { Pressable, View } from 'react-native';

import { useSettings } from '@/stores/useSettings';
import { toast } from '@/stores/useToast';
import { unitLabel, WEIGHT_UNITS } from '@/stores/useUnits';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

/**
 * Sets the unit newly added exercises start in.
 *
 * Deliberately not retroactive: existing routine items keep the unit they were
 * created with, so changing this cannot silently relabel a weight the user
 * already recorded.
 */
export function DefaultUnitCard() {
  const defaultUnit = useSettings((s) => s.defaultUnit);
  const setDefaultUnit = useSettings((s) => s.setDefaultUnit);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: border.card,
        borderRadius: radius.menu,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.medium, fontSize: 13.5, letterSpacing: -0.135, color: ink.primary }}>
          Default weight unit
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.eyebrow, marginTop: 3 }}>
          Used for new exercises
        </Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: color.fillInput, borderRadius: radius.lg, padding: 3 }}>
        {WEIGHT_UNITS.map((unit) => {
          const on = defaultUnit === unit;
          return (
            <Pressable
              key={unit}
              accessibilityRole="button"
              accessibilityLabel={`Default weight unit ${unit}`}
              aria-selected={on}
              onPress={() => {
                setDefaultUnit(unit);
                toast(`New exercises will default to ${unitLabel(unit)}`);
              }}
              style={{
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: radius.sm,
                backgroundColor: on ? color.accent : 'transparent',
              }}
            >
              <Text
                caps
                style={{
                  fontFamily: on ? font.semibold : font.medium,
                  fontSize: 12,
                  letterSpacing: 0.72,
                  color: on ? color.onAccent : ink.caret,
                }}
              >
                {unit}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
