import type { ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { border, color, radius, space } from '@/theme/tokens';
import { useKeyboardHeight } from './useKeyboardHeight';

export type SheetProps = {
  children: ReactNode;
  onDismiss: () => void;
  /**
   * Hold a stable height instead of sizing to content.
   *
   * Set this on sheets whose body is a filtering list. Without it, typing in the
   * search box shrinks the list, which shrinks the sheet, which drops it behind
   * the keyboard. With it the sheet keeps its size and the list trims from the
   * bottom instead.
   */
  fill?: boolean;
};

/** Fraction of the screen a sheet may occupy, so it never becomes the whole screen. */
const MAX_FRACTION = 0.8;
/** Breathing room left above a sheet that has grown to its limit. */
const TOP_MARGIN = 56;

/**
 * Bottom sheet with a scrim.
 *
 * Rendered in a `Modal` rather than positioned inside the screen: the tab bar
 * belongs to the Tabs navigator, so a sibling absolute view cannot cover it and
 * the sheet's own actions end up trapped underneath. `onRequestClose` also
 * wires the Android back button to dismissal.
 *
 * Tap-to-dismiss only — the grabber is drawn because the design draws it and it
 * signals "dismissible", but a pan here would compete with the scrollable
 * option lists these sheets contain.
 */
export function Sheet({ children, onDismiss, fill }: SheetProps) {
  const { height: screen } = useWindowDimensions();
  const keyboard = useKeyboardHeight();

  // The sheet lifts itself above the keyboard, and its ceiling drops by the same
  // amount — see useKeyboardHeight for why the window will not do this for us.
  const available = screen - keyboard - TOP_MARGIN;
  const limit = Math.max(240, Math.min(screen * MAX_FRACTION, available));

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onDismiss}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(20,22,26,0.32)' }}
      />
      <View
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: keyboard,
          ...(fill ? { height: limit } : { maxHeight: limit }),
          backgroundColor: color.surface,
          borderTopWidth: 1,
          borderTopColor: border.control,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.gutter - 2,
          paddingTop: 10,
          // The keyboard already provides the bottom gap when it is open.
          paddingBottom: keyboard > 0 ? 12 : 24,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: border.dashedStrong,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        {children}
      </View>
    </Modal>
  );
}
