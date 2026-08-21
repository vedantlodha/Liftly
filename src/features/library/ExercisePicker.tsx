import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Scroll, Sheet, Text } from '@/ui';
import { ALL_EXERCISES, exerciseMeta, searchExercises, type CatalogExercise } from './catalog';
import { FilterChips } from './FilterChips';
import type { CatalogGroup } from '@/catalog/taxonomy';
import { SearchField } from './SearchField';

export type ExercisePickerProps = {
  onDismiss: () => void;
  onConfirm: (names: string[]) => void;
  /** Already in the routine or session; shown ticked and not re-addable. */
  alreadyAdded?: readonly string[];
};

/**
 * Multi-select exercise picker.
 *
 * Shared by the routine builder and the active workout — both are "add some
 * exercises to this list", and splitting them would mean two lists to keep in
 * step with the catalog.
 */
export function ExercisePicker({ onDismiss, onConfirm, alreadyAdded = [] }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogGroup | 'All'>('All');
  const [picked, setPicked] = useState<string[]>([]);

  // Not capped: a cap silently hides whole muscle groups behind a search box,
  // and the sheet scrolls fine with the full catalog.
  const results = useMemo(() => searchExercises(query, filter), [query, filter]);
  const existing = useMemo(() => new Set(alreadyAdded), [alreadyAdded]);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  return (
    <Sheet onDismiss={onDismiss} fill>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Text variant="sheetTitle">Add exercises</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={picked.length ? `Add ${picked.length}` : 'Done'}
          onPress={() => onConfirm(picked)}
          hitSlop={8}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.accent }}>
            {picked.length ? `Add ${picked.length}` : 'Done'}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 14, marginBottom: 10 }}>
        <SearchField value={query} onChangeText={setQuery} tone="sheet" />
      </View>

      <FilterChips value={filter} onChange={setFilter} tone="sheet" />

      <Text style={{ fontFamily: font.mono, fontSize: 11, color: ink.index, paddingBottom: 8 }}>
        {`${results.length} of ${ALL_EXERCISES.length} exercises`}
      </Text>

      {/* flex:1 so filtering trims rows off the bottom instead of resizing the sheet. */}
      <Scroll style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {results.map((exercise) => (
          <PickerRow
            key={exercise.id}
            exercise={exercise}
            selected={picked.includes(exercise.name)}
            disabled={existing.has(exercise.name)}
            onPress={() => toggle(exercise.name)}
          />
        ))}

        {results.length === 0 && (
          <View style={{ paddingTop: 34, paddingBottom: 26, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.medium, fontSize: 15, color: ink.subtle, textAlign: 'center' }}>
              No match
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 13, color: ink.eyebrow, textAlign: 'center', marginTop: 6 }}
            >
              Try another name or muscle group.
            </Text>
          </View>
        )}
      </Scroll>
    </Sheet>
  );
}

function PickerRow({
  exercise,
  selected,
  disabled,
  onPress,
}: {
  exercise: CatalogExercise;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={selected || disabled}
      accessibilityLabel={exercise.name}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 4,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: border.row,
        // Already-added exercises stay visible so the list does not reshuffle,
        // but dimmed so they read as unavailable.
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.regular, fontSize: 14.5, color: ink.primary }}>{exercise.name}</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: ink.strip, marginTop: 3 }}>
          {disabled ? 'Already added' : exerciseMeta(exercise)}
        </Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          ...(selected || disabled
            ? { backgroundColor: color.accent }
            : { borderWidth: 1.5, borderColor: border.check }),
        }}
      >
        {(selected || disabled) && (
          <Text style={{ fontFamily: font.semibold, fontSize: 12, color: color.onAccent }}>✓</Text>
        )}
      </View>
    </Pressable>
  );
}
