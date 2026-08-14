import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { color, font, radius } from '@/theme/tokens';
import { Text } from '@/ui';

/** Past this, releasing deletes. Matches the prototype's 96px for set rows. */
const COMMIT_PX = 96;
/** Horizontal travel before the swipe claims the gesture from the scroll view. */
const CLAIM_PX = 8;

export type SwipeToDeleteProps = {
  children: ReactNode;
  onDelete: () => void;
  /** Uppercase label revealed beneath the row. */
  label?: string;
  disabled?: boolean;
};

/**
 * Swipe a row rightwards to reveal a delete panel; release past the threshold
 * to commit.
 *
 * Rightwards only — the design reserves it, and a bidirectional swipe would
 * fight the horizontal week strip elsewhere in the app. `activeOffsetX` lets a
 * vertical drag scroll the list normally instead of being captured here.
 */
export function SwipeToDelete({ children, onDelete, label = 'Delete set', disabled }: SwipeToDeleteProps) {
  const dx = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Only claim the gesture once it is clearly horizontal and rightwards.
    .activeOffsetX([-CLAIM_PX, CLAIM_PX])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dx.value = Math.max(0, e.translationX);
    })
    .onEnd(() => {
      if (dx.value > COMMIT_PX) {
        // Finish the travel before removing, so the row does not vanish mid-slide.
        dx.value = withTiming(500, { duration: 160 }, (done) => {
          if (done) runOnJS(onDelete)();
        });
      } else {
        dx.value = withTiming(0, { duration: 180 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dx.value, [0, COMMIT_PX * 0.75], [0, 1], 'clamp'),
  }));

  return (
    <View style={{ position: 'relative', overflow: 'hidden', borderRadius: radius.md }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 2,
            right: 2,
            borderRadius: radius.md,
            backgroundColor: color.dangerBg,
            justifyContent: 'center',
            paddingLeft: 16,
          },
          panelStyle,
        ]}
      >
        <Text
          caps
          style={{ fontFamily: font.monoMedium, fontSize: 11, letterSpacing: 1.1, color: color.dangerInk }}
        >
          {label}
        </Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        {/* Opaque, so the delete panel stays hidden until the row moves off it. */}
        <Animated.View style={[{ backgroundColor: color.surface }, rowStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
