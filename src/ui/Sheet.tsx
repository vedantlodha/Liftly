import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { border, color, radius, space } from '@/theme/tokens';

export type SheetProps = {
  children: ReactNode;
  onDismiss: () => void;
};

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
export function Sheet({ children, onDismiss }: SheetProps) {
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
          bottom: 0,
          // Capped so the sheet never becomes the whole screen; content scrolls.
          maxHeight: '80%',
          backgroundColor: color.surface,
          borderTopWidth: 1,
          borderTopColor: border.control,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingHorizontal: space.gutter - 2,
          paddingTop: 10,
          paddingBottom: 24,
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
