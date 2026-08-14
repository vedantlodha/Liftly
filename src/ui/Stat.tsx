import { View, type ViewProps } from 'react-native';

import { border, color, radius, space } from '@/theme/tokens';
import { Text } from './Text';

/** Per-screen tile metrics, straight from the design. */
const SIZES = {
  /** Schedule and History detail. */
  sm: { fontSize: 22, letterSpacing: -0.44, paddingTop: 14, paddingBottom: 15, labelSize: 11 },
  /** Today — 14px top, 13px bottom, 24px number. */
  md: { fontSize: 24, letterSpacing: -0.48, paddingTop: 14, paddingBottom: 13, labelSize: 11 },
  /** Summary. */
  lg: { fontSize: 25, letterSpacing: -0.5, paddingTop: 16, paddingBottom: 16, labelSize: 10.5 },
} as const;

export type StatProps = {
  value: string;
  label: string;
  size?: keyof typeof SIZES;
};

/** One tile in a stat row — a DM Mono number over a caption. */
export function Stat({ value, label, size = 'md' }: StatProps) {
  const s = SIZES[size];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: border.tile,
        borderRadius: radius.card,
        paddingHorizontal: 14,
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
      }}
    >
      <Text variant="statNumber" style={{ fontSize: s.fontSize, letterSpacing: s.letterSpacing }}>
        {value}
      </Text>
      <Text variant="statLabel" style={{ fontSize: s.labelSize, marginTop: size === 'md' ? 6 : 7 }}>
        {label}
      </Text>
    </View>
  );
}

/** The 2- or 3-up row of stat tiles used on Today, Schedule, History and Summary. */
export function StatRow({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[{ flexDirection: 'row', gap: space.sm }, style]} />;
}
