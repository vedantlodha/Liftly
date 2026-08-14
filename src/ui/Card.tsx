import { View, type ViewProps } from 'react-native';

import { border, color, radius, space } from '@/theme/tokens';

export type CardProps = ViewProps & {
  /**
   * `plain` — white card, the default across Today/History/Summary.
   * `accent` — tinted blue, used by the resume-session card and the off-plan chip.
   * `dashed` — empty state ("Rest day", "No exercises yet").
   * `danger` — destructive confirmation surfaces.
   */
  tone?: 'plain' | 'accent' | 'dashed' | 'danger';
  /** `none` when the card holds full-bleed rows that draw their own padding. */
  padding?: keyof typeof PADDING;
  /** Rows inside a card clip to its corners. */
  clip?: boolean;
};

const PADDING = { none: 0, tight: 14, base: 16, roomy: 20 } as const;

export function Card({ tone = 'plain', padding = 'base', clip, style, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: radius.panel,
          borderWidth: 1,
          padding: PADDING[padding],
          ...TONES[tone],
        },
        clip && { overflow: 'hidden' },
        style,
      ]}
    />
  );
}

const TONES = {
  plain: { backgroundColor: color.surface, borderColor: border.card },
  accent: { backgroundColor: color.accentBg, borderColor: color.accentBorder },
  dashed: { backgroundColor: color.surface, borderColor: border.dashed, borderStyle: 'dashed' },
  danger: { backgroundColor: color.dangerBg, borderColor: color.dangerBorder },
} as const;

/** Full-width hairline between rows inside a `padding="none"` card. */
export function RowDivider() {
  return <View style={{ height: 1, backgroundColor: border.rowSoft }} />;
}

/** Standard row used by list cards. */
export function CardRow({ style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: 16, paddingVertical: 15 },
        style,
      ]}
    />
  );
}
