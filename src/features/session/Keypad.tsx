import { Pressable, View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;

export type KeypadProps = {
  /** "Weight (kg) · set 2" — tells the user which cell they are driving. */
  label: string;
  onKey: (key: string) => void;
  onDone: () => void;
};

/**
 * In-app numeric keypad.
 *
 * The design deliberately avoids the OS keyboard: it is slower to raise, it
 * covers more of the screen, and its decimal key varies by locale. This keeps
 * the set list visible while logging.
 */
export function Keypad({ label, onKey, onDone }: KeypadProps) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 75,
        backgroundColor: color.surface,
        borderTopWidth: 1,
        borderTopColor: border.control,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 6,
          paddingBottom: 10,
        }}
      >
        <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.secondary }}>{label}</Text>
        <Pressable accessibilityRole="button" onPress={onDone} hitSlop={8} style={{ paddingHorizontal: 6 }}>
          <Text style={{ fontFamily: font.semibold, fontSize: 13, color: color.accent }}>Done</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Delete' : key}
            onPress={() => onKey(key)}
            style={({ pressed }) => ({
              // Three columns with two 8pt gaps between them.
              width: '31.5%',
              flexGrow: 1,
              height: 46,
              borderRadius: radius.lg,
              backgroundColor: pressed ? color.fillPressed : color.fillInput,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text style={{ fontFamily: font.monoMedium, fontSize: 19, color: ink.primary }}>{key}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
