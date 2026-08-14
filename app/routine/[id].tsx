import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import type { Routine } from '@/data/seed';
import { moveItem } from '@/domain/reorder';
import { shiftReps, shiftSets, shiftWeight } from '@/domain/reps';
import { ExercisePicker } from '@/features/library/ExercisePicker';
import { BuilderItem } from '@/features/routines/BuilderItem';
import { useReorder } from '@/features/routines/useReorder';
import { emptyRoutine, useRoutines } from '@/stores/useRoutines';
import { useSettings } from '@/stores/useSettings';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Button, Card, Screen, Scroll, Text } from '@/ui';

export default function RoutineBuilderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const routines = useRoutines((s) => s.routines);
  const save = useRoutines((s) => s.save);
  const defaultUnit = useSettings((s) => s.defaultUnit);

  const originalName = id === 'new' ? undefined : decodeURIComponent(id ?? '');
  const existing = originalName ? routines.find((r) => r.name === originalName) : undefined;

  // Edited locally and committed on Save, so Cancel genuinely discards.
  const [picking, setPicking] = useState(false);
  const reorder = useReorder((from, to) =>
    setDraft((dr) => ({ ...dr, items: moveItem(dr.items, from, to) })),
  );
  const [draft, setDraft] = useState<Routine>(() =>
    existing ? { ...existing, items: existing.items.map((i) => ({ ...i })) } : emptyRoutine(),
  );

  const editItem = (index: number, fn: (item: Routine['items'][number]) => Routine['items'][number]) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, i) => (i === index ? fn(it) : it)) }));

  const totalSets = draft.items.reduce((n, i) => n + i.sets, 0);

  const commit = () => {
    const name = draft.name.trim() || 'Untitled routine';
    save({ ...draft, name }, originalName);
    router.back();
    toast(existing ? `${name} updated` : `${name} saved to your routines`);
  };

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.gutter,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: border.tile,
        }}
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontFamily: font.medium, fontSize: 14, color: '#505154' }}>Cancel</Text>
        </Pressable>
        <Text variant="eyebrow" style={{ fontSize: 12, letterSpacing: 1.2 }}>
          Routine
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save routine" onPress={commit} hitSlop={8}>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.accent }}>Save</Text>
        </Pressable>
      </View>

      <Scroll
        contentContainerStyle={{ padding: space.gutter, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderBottomWidth: 1.5,
            borderBottomColor: border.control,
            paddingBottom: 10,
          }}
        >
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
            placeholder="Name this routine"
            placeholderTextColor={ink.placeholder}
            accessibilityLabel="Routine name"
            style={{
              flex: 1,
              minWidth: 0,
              padding: 0,
              fontFamily: font.semibold,
              fontSize: 27,
              letterSpacing: -0.675,
              color: ink.primary,
            }}
          />
        </View>

        <Text style={{ fontFamily: font.regular, fontSize: 12, color: ink.strip, marginTop: 12, marginBottom: 24 }}>
          {draft.items.length
            ? `${draft.items.length} exercises · ${totalSets} working sets`
            : 'No exercises yet'}
        </Text>

        {draft.items.length === 0 && (
          <Card tone="dashed" padding="roomy" style={{ marginBottom: 14, paddingVertical: 30 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center', color: '#505154' }}>
              No exercises yet
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              Add exercises, then set the sets, reps and starting weight for each.
            </Text>
          </Card>
        )}

        <View style={{ gap: 8, marginBottom: 14 }}>
          {draft.items.map((item, i) => (
            <BuilderItem
              key={item.name}
              item={item}
              index={i}
              unit={item.unit ?? defaultUnit}
              onChangeSets={(d) => editItem(i, (it) => ({ ...it, sets: shiftSets(it.sets, d) }))}
              onChangeReps={(d) => editItem(i, (it) => ({ ...it, reps: shiftReps(it.reps, d) }))}
              onChangeWeight={(d) => editItem(i, (it) => ({ ...it, weight: shiftWeight(it.weight, d) }))}
              onChangeUnit={(unit) => editItem(i, (it) => ({ ...it, unit }))}
              onRemove={() => setDraft((dr) => ({ ...dr, items: dr.items.filter((_, k) => k !== i) }))}
              dragging={reorder.drag?.from === i}
              shift={reorder.shiftFor(i)}
              onMeasure={reorder.onMeasure}
              onDragStart={reorder.onDragStart}
              onDragMove={reorder.onDragMove}
              onDragEnd={reorder.onDragEnd}
            />
          ))}
        </View>

        <Button
          label="+ Add exercise"
          tone="dashed"
          size="sm"
          onPress={() => setPicking(true)}
          labelStyle={{ fontFamily: font.medium, fontSize: 13.5, letterSpacing: 0 }}
          style={{ borderRadius: radius.card }}
        />
      </Scroll>

      {picking && (
        <ExercisePicker
          alreadyAdded={draft.items.map((i) => i.name)}
          onDismiss={() => setPicking(false)}
          onConfirm={(names) => {
            setPicking(false);
            if (names.length === 0) return;
            setDraft((d) => ({
              ...d,
              items: [
                ...d.items,
                // Sensible starting point; the steppers are right there to adjust.
                ...names.map((name) => ({ name, sets: 3, reps: '10', weight: 0, last: 'no history' })),
              ],
            }));
          }}
        />
      )}
    </Screen>
  );
}
