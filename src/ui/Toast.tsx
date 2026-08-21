import { Pressable, View } from 'react-native';

import { useToast } from '@/stores/useToast';
import { color, font } from '@/theme/tokens';
import { Text } from './Text';

/**
 * Transient message pinned above the tab bar. Mounted once at the root; screens
 * raise messages through `toast()` rather than rendering this themselves.
 */
export function ToastHost() {
  const message = useToast((s) => s.message);
  const undo = useToast((s) => s.undo);
  const runUndo = useToast((s) => s.runUndo);
  if (message == null) return null;

  return (
    <View
      // Only the undo button is interactive; the bar itself must never swallow a
      // tap meant for the UI beneath.
      pointerEvents={undo ? 'box-none' : 'none'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
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
      <Text style={{ flex: 1, minWidth: 0, fontFamily: font.medium, fontSize: 13, color: color.onInverse }}>
        {message}
      </Text>
      {undo != null && (
        <Pressable accessibilityRole="button" accessibilityLabel="Undo" onPress={runUndo} hitSlop={12}>
          {({ pressed }) => (
            <Text
              caps
              style={{
                fontFamily: font.monoMedium,
                fontSize: 12,
                letterSpacing: 1.2,
                color: pressed ? color.undoPressed : color.undo,
              }}
            >
              Undo
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
