import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { color, font, radius } from '@/theme/tokens';
import { Text } from '@/ui';
import { TrashGlyph } from './TrashGlyph';

/** Past this, releasing deletes. Matches the prototype's 96px for set rows. */
const COMMIT_PX = 96;
/**
 * Where the panel commits to the delete, visually.
 *
 * Deliberately past COMMIT_PX: the panel should promise deletion only once the
 * gesture is unambiguously there, so a hesitant swipe never looks armed.
 */
const ARMED_PX = 110;
/** How far the one-off hint slides — enough to read the panel, not to arm it. */
const PEEK_PX = 34;
/** Horizontal travel before the swipe claims the gesture from the scroll view. */
const CLAIM_PX = 8;

export type SwipeToDeleteProps = {
  children: ReactNode;
  onDelete: () => void;
  /** Uppercase label revealed beneath the row. */
  label?: string;
  disabled?: boolean;
  /** Smaller glyph and type for the tighter set rows. */
  compact?: boolean;
  /** Nudge once on mount, to show the gesture exists. */
  peek?: boolean;
};

/**
 * Swipe a row rightwards to reveal a delete panel; release past the threshold
 * to commit.
 *
 * Rightwards only — the design reserves it, and a bidirectional swipe would
 * fight the horizontal week strip elsewhere in the app. `activeOffsetX` lets a
 * vertical drag scroll the list normally instead of being captured here.
 */
export function SwipeToDelete({
  children,
  onDelete,
  label = 'Delete set',
  disabled,
  compact,
  peek,
}: SwipeToDeleteProps) {
  const dx = useSharedValue(0);
  // Mirrors dx past the arm threshold so the label and colour can react. Kept
  // as a shared value: reading dx from React would mean a re-render per frame.
  const armed = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    // Only claim the gesture once it is clearly horizontal and rightwards.
    .activeOffsetX([-CLAIM_PX, CLAIM_PX])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dx.value = Math.max(0, e.translationX);
      armed.value = dx.value > ARMED_PX ? 1 : 0;
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
      armed.value = 0;
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }] }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dx.value, [0, COMMIT_PX * 0.75], [0, 1], 'clamp'),
    // Deepens once releasing would actually delete.
    backgroundColor: armed.value ? color.dangerBgArmed : color.dangerBg,
  }));

  // A single pulse as the threshold is crossed, so the commit is felt as well
  // as read.
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(armed.value ? 1.14 : 1, { duration: 130 }) }],
  }));

  // The hint: settle, slide out far enough to show the panel, slide back.
  // Matches the prototype's peekNudge keyframes over 1.4s.
  useEffect(() => {
    if (!peek || disabled) return;
    dx.value = withDelay(
      168,
      withSequence(
        withTiming(PEEK_PX, { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(0, { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
      ),
    );
  }, [peek, disabled, dx]);

  const [isArmed, setIsArmed] = useState(false);
  useAnimatedReaction(
    () => armed.value,
    (next, previous) => {
      if (next !== previous) runOnJS(setIsArmed)(next === 1);
    },
  );

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
            flexDirection: 'row',
            alignItems: 'center',
            gap: compact ? 9 : 11,
            paddingLeft: compact ? 14 : 16,
          },
          panelStyle,
        ]}
      >
        <Animated.View style={glyphStyle}>
          <TrashGlyph size={compact ? 13 : 15} />
        </Animated.View>
        <Text
          caps
          style={{
            fontFamily: font.monoMedium,
            fontSize: compact ? 10 : 11,
            letterSpacing: 1.1,
            color: color.dangerInk,
          }}
        >
          {isArmed ? 'Release to delete' : label}
        </Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        {/* Opaque, so the delete panel stays hidden until the row moves off it. */}
        <Animated.View style={[{ backgroundColor: color.surface }, rowStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
