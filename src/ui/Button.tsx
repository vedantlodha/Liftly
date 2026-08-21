import { Pressable, type PressableProps, type TextStyle, type ViewStyle } from 'react-native';

import { border, color, ink, radius } from '@/theme/tokens';
import { Text } from './Text';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  /**
   * `primary` — the blue CTA (Start workout, Save, Finish and save).
   * `secondary` — neutral fill (Keep going, Just today).
   * `outline` — white with a hairline border (Freestyle workout).
   * `danger` — destructive (Discard workout, Exit and discard).
   * `dashed` — the "+ Add exercise" affordance.
   */
  tone?: keyof typeof TONES;
  /** Primary CTAs are 52pt; secondary actions and inline buttons are 48–50. */
  size?: 'sm' | 'md' | 'lg';
  /** Overrides the label type. The design sets several buttons to 500/14 rather than 600/15. */
  labelStyle?: TextStyle;
  style?: ViewStyle;
};

const HEIGHT = { sm: 48, md: 50, lg: 52 } as const;

const TONES = {
  primary: { bg: color.accent, fg: color.onAccent, borderColor: 'transparent' },
  secondary: { bg: color.fill, fg: ink.primary, borderColor: 'transparent' },
  outline: { bg: color.surface, fg: ink.strong, borderColor: border.card },
  danger: { bg: color.dangerBg, fg: color.dangerInk, borderColor: color.dangerBorder },
  dashed: { bg: 'transparent', fg: ink.action, borderColor: border.dashedStrong },
} as const;

export function Button({ label, tone = 'primary', size = 'lg', labelStyle, style, ...rest }: ButtonProps) {
  const t = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        {
          height: HEIGHT[size],
          borderRadius: radius.card,
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor: t.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          // The prototype scales primary CTAs to 0.985 on press.
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: rest.disabled ? 0.45 : 1,
        },
        tone === 'dashed' && { borderStyle: 'dashed' },
        style,
      ]}
    >
      <Text variant="button" color={t.fg} style={labelStyle}>
        {label}
      </Text>
    </Pressable>
  );
}
