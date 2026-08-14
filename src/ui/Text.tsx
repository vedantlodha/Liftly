import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { text, type TextVariant } from '@/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** Overrides the variant's colour. */
  color?: string;
  /** Uppercases. Implied by any eyebrow variant, since the design sets them all uppercase. */
  caps?: boolean;
};

/**
 * Every string in the app renders through here so type styles stay in tokens.ts
 * rather than scattering across screens.
 */
export function Text({ variant = 'body', color, caps, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        text[variant],
        (caps ?? variant.startsWith('eyebrow')) && { textTransform: 'uppercase' },
        color != null && { color },
        style,
      ]}
    />
  );
}
