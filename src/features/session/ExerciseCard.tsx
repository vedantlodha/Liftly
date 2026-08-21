import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { SessionItem } from '@/stores/useSession';
import { WEIGHT_UNITS, type WeightUnit } from '@/stores/useUnits';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';
import { SwipeToDelete } from './SwipeToDelete';
import { usePeekOnce } from './usePeekOnce';

export type ExerciseCardProps = {
  item: SessionItem;
  index: number;
  /** Which cell the keypad is editing, so it can show its underline. */
  editing: { set: number; field: 'weight' | 'reps' } | null;
  /** Paused sessions dim their rows and refuse edits. */
  paused: boolean;
  onEditCell: (set: number, field: 'weight' | 'reps') => void;
  onToggleDone: (set: number) => void;
  onAddSet: () => void;
  onRemoveSet: (set: number) => void;
  onSwap: () => void;
  onToggleSkip: () => void;
  onChangeUnit: (unit: WeightUnit) => void;

  /** True while this card is the one under the finger. */
  dragging: boolean;
  /** Pixels this card must move aside for the one being dragged. */
  shift: number;
  onMeasure: (index: number, height: number) => void;
  onDragStart: (index: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
};

export function ExerciseCard({
  item,
  index,
  editing,
  paused,
  onEditCell,
  onToggleDone,
  onAddSet,
  onRemoveSet,
  onSwap,
  onToggleSkip,
  onChangeUnit,
  dragging,
  shift,
  onMeasure,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ExerciseCardProps) {
  // Only the first card hints, and only while there is a set to hint on.
  const peek = usePeekOnce('sets', index === 0 && item.sets.length > 0 && !paused);
  const dy = useSharedValue(0);

  // Mirrors the routine builder: the grip owns the gesture so a drag can never
  // start from a set row, and dy stays on the UI thread for a smooth follow.
  const grip = Gesture.Pan()
    .enabled(!paused)
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
      : { transform: [{ translateY: withTiming(shift, { duration: 180 }) }] },
  );

  return (
    <Animated.View
      onLayout={(e) => onMeasure(index, e.nativeEvent.layout.height)}
      style={[
        {
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: dragging ? color.accentDrag : border.card,
          borderRadius: radius.panel,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 10,
          marginBottom: 10,
          zIndex: dragging ? 5 : 0,
          boxShadow: dragging ? '0px 14px 30px rgba(20,22,26,0.18)' : undefined,
        },
        cardStyle,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <GestureDetector gesture={grip}>
          <DragGrip />
        </GestureDetector>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: font.semibold, fontSize: 16, letterSpacing: -0.24, color: ink.primary }}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.eyebrow, marginTop: 4 }}>
            {`${item.target} · last ${item.last}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ChipButton label="Swap" accessibilityLabel={`Swap ${item.name}`} onPress={onSwap} />
          <ChipButton
            label={item.skipped ? 'Skipped' : 'Skip'}
            accessibilityLabel={`${item.skipped ? 'Reinstate' : 'Skip'} ${item.name}`}
            onPress={onToggleSkip}
            active={item.skipped}
          />
        </View>
      </View>

      <View
        // Skipped exercises stay visible for context but stop being interactive,
        // so a stray tap cannot log a set the user has opted out of.
        pointerEvents={item.skipped ? 'none' : 'auto'}
        style={{ opacity: item.skipped ? 0.34 : 1 }}
      >
        <ColumnHeader unit={item.unit} onChangeUnit={onChangeUnit} name={item.name} />

        {item.sets.map((set, j) => (
          <SwipeToDelete
            compact
            peek={peek && j === 0}
            key={set.id}
            disabled={paused}
            onDelete={() => onRemoveSet(j)}
          >
            <SetRow
              number={j + 1}
              weight={set.weight}
              reps={set.reps}
              done={set.done}
              paused={paused}
              editingField={editing?.set === j ? editing.field : null}
              onEditWeight={() => onEditCell(j, 'weight')}
              onEditReps={() => onEditCell(j, 'reps')}
              onToggleDone={() => onToggleDone(j)}
              exerciseName={item.name}
            />
          </SwipeToDelete>
        ))}

        {item.sets.length === 0 && (
          <View style={{ paddingVertical: 14 }}>
            <Text
              style={{ fontFamily: font.regular, fontSize: 12.5, color: ink.muted, textAlign: 'center' }}
            >
              No sets
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add a set to ${item.name}`}
          onPress={onAddSet}
          style={{ marginTop: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: border.row }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 12, color: ink.muted, textAlign: 'center' }}>
            + Add set
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** Small uppercase mono control — SWAP and SKIP. */
function ChipButton({
  label,
  accessibilityLabel,
  onPress,
  active,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderColor: active ? 'rgba(200,42,26,0.28)' : border.control,
        backgroundColor: active ? color.dangerBg : 'transparent',
      }}
    >
      <Text
        caps
        style={{
          fontFamily: font.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          color: active ? color.dangerInk : ink.secondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Reorder handle. Phase 4b wires the pan gesture; drawn now so layout is final. */
function DragGrip() {
  return (
    <View
      accessible
      accessibilityLabel="Drag to reorder"
      style={{
        width: 26,
        height: 30,
        marginLeft: -4,
        marginTop: -2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 13, height: 1.8, borderRadius: 2, backgroundColor: '#7E8084' }} />
      ))}
    </View>
  );
}

const HEADER_LABEL = {
  fontFamily: font.monoMedium,
  fontSize: 9,
  letterSpacing: 0.72,
  color: ink.index,
} as const;

/**
 * Column labels, with the weight unit doubling as its own switch.
 *
 * The unit is inherited from the routine, but the plate maths only works if it
 * matches the bar in front of you — and that is not always the one the plan
 * assumed. Changing it here affects this session, not the saved routine.
 */
function ColumnHeader({
  unit,
  name,
  onChangeUnit,
}: {
  unit: WeightUnit;
  name: string;
  onChangeUnit: (unit: WeightUnit) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 2,
        paddingBottom: 7,
        // Lifted so the menu paints over the set rows beneath it.
        zIndex: open ? 30 : 0,
      }}
    >
      <Text caps style={[HEADER_LABEL, { width: 26 }]}>
        Set
      </Text>

      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Weight unit for ${name}, currently ${unit}`}
          aria-expanded={open}
          onPress={() => setOpen((v) => !v)}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Text caps style={HEADER_LABEL}>
            {unit}
          </Text>
          <View
            style={{
              width: 5,
              height: 5,
              borderRightWidth: 1.5,
              borderBottomWidth: 1.5,
              borderColor: ink.index,
              transform: [{ rotate: open ? '225deg' : '45deg' }],
              marginTop: open ? 1 : -3,
            }}
          />
        </Pressable>

        {open && (
          <>
            <Pressable
              accessibilityLabel="Close unit picker"
              onPress={() => setOpen(false)}
              style={{ position: 'absolute', top: -2000, bottom: -2000, left: -2000, right: -2000, zIndex: 29 }}
            />
            <View
              style={{
                position: 'absolute',
                left: -6,
                right: -6,
                top: 18,
                zIndex: 30,
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
                  accessibilityLabel={`${name} in ${u}`}
                  aria-selected={u === unit}
                  onPress={() => {
                    onChangeUnit(u);
                    setOpen(false);
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

      <Text caps style={[HEADER_LABEL, { flex: 1, textAlign: 'center' }]}>
        Reps
      </Text>
      <View style={{ width: 38 }} />
    </View>
  );
}

type SetRowProps = {
  number: number;
  weight: string;
  reps: string;
  done: boolean;
  paused: boolean;
  editingField: 'weight' | 'reps' | null;
  onEditWeight: () => void;
  onEditReps: () => void;
  onToggleDone: () => void;
  exerciseName: string;
};

function SetRow({
  number,
  weight,
  reps,
  done,
  paused,
  editingField,
  onEditWeight,
  onEditReps,
  onToggleDone,
  exerciseName,
}: SetRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
        paddingHorizontal: 2,
        opacity: paused ? 0.4 : 1,
      }}
    >
      <Text style={{ width: 26, fontFamily: font.monoMedium, fontSize: 13, color: ink.eyebrow }}>{number}</Text>

      <ValueCell
        value={weight}
        editing={editingField === 'weight'}
        onPress={onEditWeight}
        label={`${exerciseName} set ${number} weight`}
      />
      <ValueCell
        value={reps}
        editing={editingField === 'reps'}
        onPress={onEditReps}
        label={`${exerciseName} set ${number} reps`}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${exerciseName} set ${number} complete`}
        aria-checked={done}
        onPress={onToggleDone}
        style={{ width: 38, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            ...(done
              ? { backgroundColor: color.accent }
              : { borderWidth: 1.5, borderColor: border.check }),
          }}
        >
          {done && (
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.onAccent }}>✓</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function ValueCell({
  value,
  editing,
  onPress,
  label,
}: {
  value: string;
  editing: boolean;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: color.fillInput,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.monoMedium, fontSize: 16, color: ink.primary }}>{value}</Text>
      {/* Underline marks the cell the keypad is currently driving. */}
      {editing && (
        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 6,
            height: 2,
            borderRadius: 2,
            backgroundColor: color.accent,
          }}
        />
      )}
    </Pressable>
  );
}
