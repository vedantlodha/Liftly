import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { RoutineItem } from '@/data/seed';
import { formatBuilderWeight, isSteppableReps } from '@/domain/reps';
import { WEIGHT_UNITS, type WeightUnit } from '@/stores/useUnits';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

export type BuilderItemProps = {
  item: RoutineItem;
  index: number;
  /** Falls back to the app default when the item has not chosen one. */
  unit: WeightUnit;
  onChangeSets: (delta: number) => void;
  onChangeReps: (delta: number) => void;
  onChangeWeight: (delta: number) => void;
  onChangeUnit: (unit: WeightUnit) => void;
  onRemove: () => void;

  /** True while this row is the one under the finger. */
  dragging: boolean;
  /** Pixels this row must move aside for the row being dragged. */
  shift: number;
  onMeasure: (index: number, height: number) => void;
  onDragStart: (index: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
};

export function BuilderItem({
  item,
  index,
  unit,
  onChangeSets,
  onChangeReps,
  onChangeWeight,
  onChangeUnit,
  onRemove,
  dragging,
  shift,
  onMeasure,
  onDragStart,
  onDragMove,
  onDragEnd,
}: BuilderItemProps) {
  const [unitOpen, setUnitOpen] = useState(false);
  const dy = useSharedValue(0);

  // The grip owns the gesture, so a drag can never start from the steppers.
  // `dy` stays on the UI thread for a smooth follow; only the slot the row
  // would land in is reported back to React, and only when it changes.
  const grip = Gesture.Pan()
    .onBegin(() => runOnJS(onDragStart)(index))
    .onUpdate((e) => {
      dy.value = e.translationY;
      runOnJS(onDragMove)(e.translationY);
    })
    .onFinalize(() => {
      dy.value = 0;
      runOnJS(onDragEnd)();
    });

  const cardStyle = useAnimatedStyle(() =>
    dragging
      ? { transform: [{ translateY: dy.value }] }
      : // Displaced rows glide; the dragged one tracks the finger exactly.
        { transform: [{ translateY: withTiming(shift, { duration: 180 }) }] },
  );

  return (
    <Animated.View
      onLayout={(e) => onMeasure(index, e.nativeEvent.layout.height)}
      style={[
        {
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: dragging ? color.accentDrag : border.card,
          borderRadius: radius.card,
          paddingHorizontal: 15,
          paddingVertical: 14,
          // Lifted while the unit menu is open, or the stepper rows below paint over it.
          zIndex: dragging ? 5 : unitOpen ? 40 : 0,
          boxShadow: dragging ? '0px 14px 30px rgba(20,22,26,0.18)' : undefined,
        },
        cardStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <GestureDetector gesture={grip}>
          <View
            accessibilityRole="adjustable"
            accessibilityLabel={`Reorder ${item.name}`}
            style={{
              width: 24,
              height: 28,
              marginLeft: -5,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              borderRadius: radius.sm,
            }}
          >
            <GripBar />
            <GripBar />
            <GripBar />
          </View>
        </GestureDetector>
        <Text style={{ flex: 1, fontFamily: font.medium, fontSize: 14.5, letterSpacing: -0.145, color: ink.primary }}>
          {item.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          onPress={onRemove}
          hitSlop={10}
          style={{ paddingHorizontal: 2 }}
        >
          <Text style={{ fontFamily: font.regular, fontSize: 17, color: '#969798' }}>×</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 7, marginTop: 13, paddingLeft: 29 }}>
        <StepperBox label="Sets" name={item.name}>
          <StepButton glyph="−" label={`Fewer sets for ${item.name}`} onPress={() => onChangeSets(-1)} />
          <StepValue>{String(item.sets)}</StepValue>
          <StepButton glyph="+" label={`More sets for ${item.name}`} onPress={() => onChangeSets(1)} />
        </StepperBox>

        <StepperBox label="Reps" name={item.name}>
          <StepButton
            glyph="−"
            label={`Fewer reps for ${item.name}`}
            onPress={() => onChangeReps(-1)}
            // Distance and duration targets are not steppable.
            disabled={!isSteppableReps(item.reps)}
          />
          <StepValue>{item.reps}</StepValue>
          <StepButton
            glyph="+"
            label={`More reps for ${item.name}`}
            onPress={() => onChangeReps(1)}
            disabled={!isSteppableReps(item.reps)}
          />
        </StepperBox>

        {/* The weight column's header doubles as this exercise's unit switch. */}
        <View
          style={{
            flex: 1.15,
            backgroundColor: color.fillHover,
            borderRadius: radius.lg,
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: 9,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Weight unit for ${item.name}, currently ${unit}`}
            aria-expanded={unitOpen}
            onPress={() => setUnitOpen((v) => !v)}
            hitSlop={6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Text caps style={{ fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.9, color: ink.caret }}>
              {unit}
            </Text>
            <View
              style={{
                width: 5,
                height: 5,
                borderRightWidth: 1.5,
                borderBottomWidth: 1.5,
                borderColor: '#787A7E',
                transform: [{ rotate: unitOpen ? '225deg' : '45deg' }],
                marginTop: unitOpen ? 1 : -3,
              }}
            />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
            <StepButton glyph="−" label={`Less weight for ${item.name}`} onPress={() => onChangeWeight(-1)} />
            <StepValue>{formatBuilderWeight(item.weight)}</StepValue>
            <StepButton glyph="+" label={`More weight for ${item.name}`} onPress={() => onChangeWeight(1)} />
          </View>

          {unitOpen && (
            <>
              <Pressable
                accessibilityLabel="Close unit picker"
                onPress={() => setUnitOpen(false)}
                style={{ position: 'absolute', top: -2000, bottom: -2000, left: -2000, right: -2000, zIndex: 39 }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 2,
                  right: 2,
                  top: 26,
                  zIndex: 40,
                  backgroundColor: color.surface,
                  borderWidth: 1,
                  borderColor: border.menu,
                  borderRadius: radius.lg,
                  padding: 4,
                  boxShadow: '0px 12px 26px rgba(20,22,26,0.16)',
                }}
              >
                {WEIGHT_UNITS.map((u) => (
                  <Pressable
                    key={u}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} in ${u}`}
                    aria-selected={u === unit}
                    onPress={() => {
                      onChangeUnit(u);
                      setUnitOpen(false);
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 6,
                      paddingVertical: 8,
                      borderRadius: radius.sm,
                      backgroundColor: pressed ? color.fill : 'transparent',
                    })}
                  >
                    <Text
                      caps
                      style={{
                        fontFamily: font.monoMedium,
                        fontSize: 11,
                        letterSpacing: 0.66,
                        textAlign: 'center',
                        color: u === unit ? color.accent : ink.chevron,
                      }}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

/** One bar of the three-line reorder grip. */
function GripBar() {
  return <View style={{ width: 12, height: 1.8, borderRadius: 2, backgroundColor: ink.grip }} />;
}

function StepperBox({ label, children }: { label: string; name: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.fillHover,
        borderRadius: radius.lg,
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 9,
      }}
    >
      <Text
        caps
        style={{ fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.9, color: '#828488', textAlign: 'center' }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
        {children}
      </View>
    </View>
  );
}

function StepValue({ children }: { children: React.ReactNode }) {
  return (
    <Text
      numberOfLines={1}
      style={{
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        fontFamily: font.monoMedium,
        fontSize: 14,
        color: ink.primary,
      }}
    >
      {children}
    </Text>
  );
}

function StepButton({
  glyph,
  label,
  onPress,
  disabled,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 24,
        height: 26,
        borderRadius: radius.xs,
        backgroundColor: pressed ? color.fillPressed : color.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Text style={{ fontFamily: font.medium, fontSize: 15, color: ink.control }}>{glyph}</Text>
    </Pressable>
  );
}
