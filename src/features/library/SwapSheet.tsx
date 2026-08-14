import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { color, font, ink } from '@/theme/tokens';
import { Chevron, Scroll, Sheet, Text } from '@/ui';
import { ALL_EXERCISES, exerciseMeta, searchExercises, swapCandidates } from './catalog';
import { SearchField } from './SearchField';

export type SwapSheetProps = {
  /** The exercise being replaced. */
  current: string;
  onDismiss: () => void;
  onSwap: (name: string) => void;
};

/**
 * Replaces one exercise mid-session.
 *
 * With no query this offers same-muscle-group alternatives rather than the
 * whole catalog: a swap usually happens because a rack is busy, and the useful
 * answer is "something else that trains this". Searching widens to everything.
 */
export function SwapSheet({ current, onDismiss, onSwap }: SwapSheetProps) {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const results = useMemo(
    () => (searching ? searchExercises(query).filter((e) => e.name !== current).slice(0, 40) : swapCandidates(current)),
    [query, searching, current],
  );

  const hint = !searching
    ? 'Same movement pattern, kit you have.'
    : results.length
      ? `${results.length} ${results.length === 1 ? 'match' : 'matches'} in all ${ALL_EXERCISES.length} exercises.`
      : 'No exercise matches that.';

  return (
    <Sheet onDismiss={onDismiss}>
      <Text variant="sheetTitle">{`Swap ${current}`}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 12.5, color: ink.muted, marginTop: 6, marginBottom: 14 }}>
        {hint}
      </Text>

      <View style={{ marginBottom: 12 }}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search all exercises" tone="sheet" />
      </View>

      <Scroll keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 7 }}>
        {results.map((exercise) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityLabel={`Swap to ${exercise.name}`}
            onPress={() => onSwap(exercise.name)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 15,
              paddingVertical: 14,
              borderRadius: 13,
              backgroundColor: pressed ? color.fillPressed : color.fill,
            })}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: ink.primary }}>{exercise.name}</Text>
              <Text style={{ fontFamily: font.regular, fontSize: 11, color: ink.strip, marginTop: 3 }}>
                {exerciseMeta(exercise)}
              </Text>
            </View>
            <Chevron direction="right" size={9} thickness={1.75} color={ink.disabled} />
          </Pressable>
        ))}

        {results.length === 0 && (
          <View style={{ paddingTop: 34, paddingBottom: 26, paddingHorizontal: 16 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center' }}>
              No match
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              Try another name or muscle group.
            </Text>
          </View>
        )}
      </Scroll>
    </Sheet>
  );
}
