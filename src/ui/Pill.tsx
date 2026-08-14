import { Pressable, View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from './Text';

export type PillProps = {
  label: string;
  /**
   * `filter` — the library's muscle-group chips (Archivo, selectable).
   * `badge` — the uppercase DM Mono markers (THIS WK, TODAY, CHEST).
   */
  variant?: 'filter' | 'badge';
  selected?: boolean;
  /** Badges tint accent-blue when true, neutral grey when false. */
  accent?: boolean;
  onPress?: () => void;
};

export function Pill({ label, variant = 'filter', selected, accent, onPress }: PillProps) {
  const isBadge = variant === 'badge';
  const tinted = isBadge ? !!accent : !!selected;

  const body = (
    <View
      style={{
        borderRadius: radius.pill,
        paddingHorizontal: isBadge ? 8 : 13,
        paddingVertical: isBadge ? 4 : 7,
        borderWidth: 1,
        backgroundColor: !isBadge && tinted ? color.accent : isBadge ? 'transparent' : color.surface,
        borderColor: tinted ? color.accentBorder : border.card,
      }}
    >
      <Text
        caps={isBadge}
        color={!isBadge && tinted ? color.onAccent : tinted ? color.accent : isBadge ? ink.secondary : ink.action}
        style={
          isBadge
            ? { fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.72 }
            : { fontFamily: font.medium, fontSize: 12 }
        }
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  );
}
