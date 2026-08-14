import { Pressable, View } from 'react-native';

import { color, font, ink, radius } from '@/theme/tokens';
import { Text } from './Text';

export type StepperProps = {
  /** Uppercase caption above the control — SETS, REPS, KG. */
  label: string;
  /** Pre-formatted for display; the builder shows rep ranges like "6–8" and "BW". */
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  /** The KG column is slightly wider than SETS and REPS in the design. */
  flex?: number;
};

/** The −/value/+ control used by the routine builder. */
export function Stepper({ label, value, onDecrement, onIncrement, flex = 1 }: StepperProps) {
  return (
    <View
      style={{
        flex,
        backgroundColor: color.fillHover,
        borderRadius: radius.lg,
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 9,
      }}
    >
      <Text
        caps
        color={ink.faint}
        style={{ fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.9, textAlign: 'center' }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 5,
        }}
      >
        <StepButton glyph="−" label={`Decrease ${label}`} onPress={onDecrement} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, minWidth: 0, textAlign: 'center', fontFamily: font.monoMedium, fontSize: 14, color: ink.primary }}
        >
          {value}
        </Text>
        <StepButton glyph="+" label={`Increase ${label}`} onPress={onIncrement} />
      </View>
    </View>
  );
}

function StepButton({ glyph, label, onPress }: { glyph: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 24,
        height: 26,
        borderRadius: radius.xs,
        backgroundColor: pressed ? color.fillPressed : color.surface,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text style={{ fontFamily: font.medium, fontSize: 15, color: ink.control }}>{glyph}</Text>
    </Pressable>
  );
}
