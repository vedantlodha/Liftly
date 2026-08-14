import { Pressable, View } from 'react-native';

import type { SessionItem } from '@/stores/useSession';
import type { WeightUnit } from '@/stores/useUnits';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';
import { SwipeToDelete } from './SwipeToDelete';

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
}: ExerciseCardProps) {
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderWidth: 1,
        borderColor: border.card,
        borderRadius: radius.panel,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <DragGrip />
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
        <ColumnHeader unit={item.unit} />

        {item.sets.map((set, j) => (
          <SwipeToDelete
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
    </View>
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
 * Column labels. The weight unit is shown, not chosen — it belongs to the
 * routine item and is picked in the builder.
 */
function ColumnHeader({ unit }: { unit: WeightUnit }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2, paddingBottom: 7 }}>
      <Text caps style={[HEADER_LABEL, { width: 26 }]}>
        Set
      </Text>
      <Text caps style={[HEADER_LABEL, { flex: 1, textAlign: 'center' }]}>
        {unit}
      </Text>
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
