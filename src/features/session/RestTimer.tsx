import { Pressable, View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

export type RestTimerProps = {
  /** Pre-formatted mm:ss. */
  remaining: string;
  nextSet: string;
  onExtend: () => void;
  onSkip: () => void;
};

/** Floating rest countdown, shown from the moment a set is ticked until it runs out. */
export function RestTimer({ remaining, nextSet, onExtend, onSkip }: RestTimerProps) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: border.strong,
        borderRadius: radius.menu,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text
        style={{
          fontFamily: font.monoMedium,
          fontSize: 26,
          letterSpacing: -0.52,
          color: color.accent,
          minWidth: 66,
        }}
      >
        {remaining}
      </Text>
      <Text style={{ flex: 1, fontFamily: font.regular, fontSize: 11.5, color: ink.secondary }}>
        {`Rest · next ${nextSet}`}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add 30 seconds of rest"
        onPress={onExtend}
        style={{
          borderWidth: 1,
          borderColor: border.strong,
          borderRadius: radius.sm,
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        <Text style={{ fontFamily: font.monoMedium, fontSize: 11, color: ink.control }}>+30</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip rest"
        onPress={onSkip}
        style={{
          backgroundColor: color.accent,
          borderRadius: radius.sm,
          paddingHorizontal: 11,
          paddingVertical: 9,
        }}
      >
        <Text caps style={{ fontFamily: font.monoMedium, fontSize: 11, color: color.onAccent }}>
          Skip
        </Text>
      </Pressable>
    </View>
  );
}
