import { Pressable, View } from 'react-native';

import { color, font, ink, radius } from '@/theme/tokens';
import { Text } from './Text';

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** `primary` is the blue CTA, `danger` the destructive one, `quiet` a bare label. */
  tone?: 'primary' | 'neutral' | 'danger' | 'quiet';
};

export type ConfirmDialogProps = {
  title: string;
  message: string;
  actions: DialogAction[];
  /** Tapping the scrim. Omit to force an explicit choice. */
  onDismiss?: () => void;
};

const HEIGHT = { primary: 52, neutral: 48, danger: 50, quiet: 46 } as const;

/**
 * Centred modal for decisions that can destroy work.
 *
 * Deliberately a dialog rather than a sheet: finishing a session, leaving one,
 * and discarding routine edits can all lose what the user just did, so the
 * choice should interrupt rather than sit at the edge of the screen.
 */
export function ConfirmDialog({ title, message, actions, onDismiss }: ConfirmDialogProps) {
  return (
    <>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onDismiss}
        // Non-dismissible dialogs still need the scrim to swallow taps.
        disabled={!onDismiss}
        style={{ position: 'absolute', inset: 0, zIndex: 96, backgroundColor: 'rgba(20,22,26,0.38)' }}
      />
      <View
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          left: 26,
          right: 26,
          top: '50%',
          transform: [{ translateY: -110 }],
          zIndex: 97,
          backgroundColor: color.surface,
          borderRadius: radius.dialog,
          paddingHorizontal: 22,
          paddingTop: 24,
          paddingBottom: 20,
          boxShadow: '0px 24px 60px rgba(20,22,26,0.28)',
        }}
      >
        <Text style={{ fontFamily: font.semibold, fontSize: 21, lineHeight: 24, letterSpacing: -0.46, color: ink.primary }}>
          {title}
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: ink.secondary, marginTop: 8 }}>
          {message}
        </Text>

        {actions.map((action, i) => {
          const tone = action.tone ?? 'neutral';
          return (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => ({
                height: HEIGHT[tone],
                borderRadius: radius.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: i === 0 ? 20 : 9,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                ...TONES[tone],
              })}
            >
              <Text style={{ fontFamily: TONE_FONT[tone], fontSize: tone === 'primary' ? 15 : 14.5, color: TONE_INK[tone] }}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const TONES = {
  primary: { backgroundColor: color.accent },
  neutral: { backgroundColor: color.fill },
  danger: { backgroundColor: color.dangerBg, borderWidth: 1, borderColor: color.dangerBorder },
  quiet: { backgroundColor: 'transparent' },
} as const;

const TONE_INK = {
  primary: color.onAccent,
  neutral: ink.control,
  danger: color.dangerInk,
  quiet: ink.secondary,
} as const;

const TONE_FONT = {
  primary: font.semibold,
  neutral: font.medium,
  danger: font.semibold,
  quiet: font.medium,
} as const;
