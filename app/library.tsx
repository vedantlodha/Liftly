import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import type { CatalogGroup } from '@/catalog/taxonomy';
import {
  ALL_EXERCISES,
  FILTER_GROUPS,
  groupExercises,
  searchExercises,
  type CatalogExercise,
} from '@/features/library/catalog';
import { FilterChips } from '@/features/library/FilterChips';
import { SearchField } from '@/features/library/SearchField';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Chevron, Screen, Scroll, SubScreenBar, Text } from '@/ui';

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogGroup | 'All'>('All');

  const matches = useMemo(() => searchExercises(query, filter), [query, filter]);
  const groups = useMemo(() => groupExercises(matches), [matches]);

  return (
    <Screen>
      <SubScreenBar label="Library" onBack={() => router.back()} />

      <View style={{ paddingHorizontal: space.gutter, paddingTop: 20 }}>
        <Text variant="pageTitle">Exercises</Text>
        <View style={{ marginTop: 16 }}>
          <SearchField value={query} onChangeText={setQuery} />
        </View>

        <FilterChips value={filter} onChange={setFilter} />
      </View>

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 6, paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontFamily: font.mono, fontSize: 11, color: ink.index, marginBottom: 10 }}>
          {`${matches.length} of ${ALL_EXERCISES.length} exercises`}
        </Text>

        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 18 }}>
            <Text variant="eyebrowTight" color={color.accent} style={{ paddingHorizontal: 2, paddingBottom: 9 }}>
              {group.title}
            </Text>
            <View
              style={{
                backgroundColor: color.surface,
                borderWidth: 1,
                borderColor: border.card,
                borderRadius: radius.card,
                overflow: 'hidden',
              }}
            >
              {group.items.map((exercise, i) => (
                <ExerciseRow key={exercise.id} exercise={exercise} last={i === group.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        {matches.length === 0 && (
          <View style={{ paddingVertical: 50, paddingHorizontal: 20 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center' }}>
              No match
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              Try another name, or add a custom exercise.
            </Text>
          </View>
        )}
      </Scroll>
    </Screen>
  );
}

function ExerciseRow({ exercise, last }: { exercise: CatalogExercise; last: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 15,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: border.row,
        backgroundColor: pressed ? color.fillHover : color.surface,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.regular, fontSize: 14.5, color: ink.primary }}>{exercise.name}</Text>
        {/* The raw catalog string, not the normalised tag — "Barbell, bench"
            tells you what to find in the gym; "Barbell" alone does not. */}
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: ink.strip, marginTop: 3 }}>
          {exercise.equipmentRaw}
        </Text>
      </View>
      <Chevron direction="right" size={9} thickness={1.75} color={ink.disabled} />
    </Pressable>
  );
}
