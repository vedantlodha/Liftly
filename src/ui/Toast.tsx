import { View } from 'react-native';

import { useToast } from '@/stores/useToast';
import { color, font } from '@/theme/tokens';
import { Text } from './Text';

/**
 * Transient message pinned above the tab bar. Mounted once at the root; screens
 * raise messages through `toast()` rather than rendering this themselves.
 */
export function ToastHost() {
  const message = useToast((s) => s.message);
  if (message == null) return null;

  return (
    <View
      // Non-interactive: it must never swallow a tap meant for the UI beneath.
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        // Clears the floating tab bar, as in the design.
        bottom: 104,
        zIndex: 95,
        backgroundColor: color.inverseSurface,
        borderRadius: 13,
        paddingHorizontal: 16,
        paddingVertical: 13,
      }}
    >
      <Text style={{ fontFamily: font.medium, fontSize: 13, color: color.onInverse }}>{message}</Text>
    </View>
  );
}
