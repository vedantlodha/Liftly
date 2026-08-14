import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, View, type View as RNView } from 'react-native';

import { border, color, radius } from '@/theme/tokens';

/**
 * A popover anchored under a trigger.
 *
 * Rendered in a `Modal` rather than absolutely positioned next to the trigger.
 * On Android a child drawn outside its parent's bounds still paints but never
 * receives touches, so an in-place popover looks correct and is completely
 * dead — it cannot be scrolled or tapped. A Modal escapes the hierarchy, and
 * the anchor is measured in window coordinates so the menu still lands in the
 * right place.
 */

export type AnchorRect = { x: number; y: number; width: number; height: number };

/** Measures a trigger so a menu can be placed against it. */
export function useAnchor() {
  const ref = useRef<RNView>(null);
  const [rect, setRect] = useState<AnchorRect | null>(null);

  const measure = useCallback((then?: () => void) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setRect({ x, y, width, height });
      then?.();
    });
  }, []);

  return { ref, rect, measure };
}

export type AnchoredMenuProps = {
  rect: AnchorRect | null;
  onDismiss: () => void;
  children: ReactNode;
  /** Gap between the trigger's bottom edge and the menu. */
  offset?: number;
  /** The design lets the menu overhang its trigger by 8pt on each side. */
  overhang?: number;
  maxHeight?: number;
};

const SCREEN_MARGIN = 12;

export function AnchoredMenu({
  rect,
  onDismiss,
  children,
  offset = 8,
  overhang = 8,
  maxHeight = 274,
}: AnchoredMenuProps) {
  if (!rect) return null;

  const screen = Dimensions.get('window');
  const width = rect.width + overhang * 2;
  // Keep the menu on screen when the trigger sits near an edge.
  const left = Math.max(SCREEN_MARGIN, Math.min(rect.x - overhang, screen.width - width - SCREEN_MARGIN));
  const top = rect.y + rect.height + offset;
  // If there is not room below, cap the height rather than run off the bottom.
  const available = screen.height - top - SCREEN_MARGIN;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable accessibilityLabel="Dismiss" onPress={onDismiss} style={{ position: 'absolute', inset: 0 }} />
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width,
          maxHeight: Math.max(120, Math.min(maxHeight, available)),
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: border.menu,
          borderRadius: radius.menu,
          padding: 6,
          boxShadow: '0px 14px 34px rgba(20,22,26,0.16)',
        }}
      >
        {children}
      </View>
    </Modal>
  );
}
