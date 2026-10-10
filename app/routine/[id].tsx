import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import type { Routine } from '@/data/seed';
import { DAY_NAMES, type DayIndex } from '@/domain/week';
import { moveItem } from '@/domain/reorder';
import { shiftReps, shiftSets, shiftWeight } from '@/domain/reps';
import { ExercisePicker } from '@/features/library/ExercisePicker';
import { BuilderItem } from '@/features/routines/BuilderItem';
import { useReorder } from '@/features/routines/useReorder';
import { emptyRoutine, useRoutines } from '@/stores/useRoutines';
import { useSchedule } from '@/stores/useSchedule';
import { useSettings } from '@/stores/useSettings';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Button, Card, ConfirmDialog, Screen, Scroll, Text } from '@/ui';

export default function RoutineBuilderScreen() {
  /**
   * `day` and `scope` are set when the builder was opened from a day that is
   * waiting for a routine — Today's switcher or a Schedule row. Saving then
   * puts the new routine on that day, because "build one and come back to this
   * day" should not require coming back and picking it again.
   */
  const { id, day: dayParam, scope } = useLocalSearchParams<{ id: string; day?: string; scope?: string }>();
  const assignTo = dayParam != null && /^[0-6]$/.test(dayParam) ? (Number(dayParam) as DayIndex) : null;
  const setPlan = useSchedule((s) => s.setPlan);
  const setOverride = useSchedule((s) => s.setOverride);
  const routines = useRoutines((s) => s.routines);
  const save = useRoutines((s) => s.save);
  const defaultUnit = useSettings((s) => s.defaultUnit);

  const originalName = id === 'new' ? undefined : decodeURIComponent(id ?? '');
  const existing = originalName ? routines.find((r) => r.name === originalName) : undefined;

  // Edited locally and committed on Save, so Cancel genuinely discards.
  const [picking, setPicking] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Which complaint the name field is making, if any.
  const [nameError, setNameError] = useState<'missing' | 'duplicate' | null>(null);
  const nameInput = useRef<TextInput>(null);
  const reorder = useReorder((from, to) =>
    setDraft((dr) => ({ ...dr, items: moveItem(dr.items, from, to) })),
  );
  const [draft, setDraft] = useState<Routine>(() =>
    existing ? { ...existing, items: existing.items.map((i) => ({ ...i })) } : emptyRoutine(),
  );

  const editItem = (index: number, fn: (item: Routine['items'][number]) => Routine['items'][number]) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, i) => (i === index ? fn(it) : it)) }));

  const totalSets = draft.items.reduce((n, i) => n + i.sets, 0);

  // Snapshot of what was opened, so leaving can tell edits from a no-op visit.
  const original = useRef(JSON.stringify(existing ? { ...existing, items: existing.items } : emptyRoutine())).current;
  const dirty = JSON.stringify(draft) !== original;

  // Nudges the name field when Save is refused. No counter is needed to replay
  // it — unlike a CSS animation, restarting the sequence re-runs it.
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const refuseSave = (reason: 'missing' | 'duplicate') => {
    setNameError(reason);
    nameInput.current?.focus();
    const easing = Easing.bezier(0.36, 0.07, 0.19, 0.97);
    shake.value = withSequence(
      withTiming(-7, { duration: 76, easing }),
      withTiming(6, { duration: 84, easing }),
      withTiming(-4, { duration: 84, easing }),
      withTiming(3, { duration: 84, easing }),
      withTiming(0, { duration: 92, easing }),
    );
  };

  const leave = () => {
    setConfirmLeave(false);
    router.back();
  };

  const cancel = () => (dirty ? setConfirmLeave(true) : router.back());

  const commit = () => {
    const name = draft.name.trim();
    // A routine with no name used to save as "Untitled routine", which is not a
    // name the user chose and is impossible to tell apart from the next one.
    if (!name) {
      refuseSave('missing');
      return;
    }
    // Saving over another routine's name used to replace it without a word.
    // Renaming a routine to what it is already called is still just an update.
    if (routines.some((r) => r.name === name && r.name !== originalName)) {
      refuseSave('duplicate');
      return;
    }
    save({ ...draft, name }, originalName);

    // Only a brand-new routine claims the day it was started from; editing an
    // existing one should not quietly reschedule it.
    if (assignTo != null && !existing) {
      // Today's switcher is a this-week change, matching what picking an
      // existing routine there does. Schedule edits the saved plan.
      if (scope === 'week') setOverride(assignTo, name, false);
      else setPlan(assignTo, name, false);
    }

    router.back();
    toast(
      existing
        ? `${name} updated`
        : assignTo != null
          ? `${name} saved and set for ${scope === 'week' ? 'today' : DAY_NAMES[assignTo]}`
          : `${name} saved to your routines`,
    );
  };

  // Hardware back must not drop unsaved edits. The picker is a Modal and closes
  // itself, so by the time this fires the only things left are the dialog and
  // the screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmLeave) {
        setConfirmLeave(false);
        return true;
      }
      if (dirty) {
        setConfirmLeave(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [confirmLeave, dirty]);

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
        <Pressable accessibilityRole="button" onPress={cancel} hitSlop={8}>
          <Text style={{ fontFamily: font.medium, fontSize: 14, color: ink.subtle }}>Cancel</Text>
        </Pressable>
        <Text variant="eyebrow" style={{ fontSize: 12, letterSpacing: 1.2 }}>
          Routine
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save routine" onPress={commit} hitSlop={8}>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.accent }}>Save</Text>
        </Pressable>
      </View>

      <Scroll
        {...reorder.scrollProps}
        contentContainerStyle={{ padding: space.gutter, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderBottomWidth: 1.5,
              borderBottomColor: nameError ? color.dangerInk : border.control,
              paddingBottom: 10,
            },
            shakeStyle,
          ]}
        >
          <TextInput
            ref={nameInput}
            value={draft.name}
            onChangeText={(name) =>
              // Typing clears the complaint straight away rather than making the
              // user press Save again to find out it is satisfied.
              setDraft((d) => {
                // Any edit answers the complaint; Save decides if it is resolved.
                setNameError(null);
                return { ...d, name };
              })
            }
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
        </Animated.View>

        {nameError && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 }}>
            <View
              style={{
                width: 15,
                height: 15,
                borderRadius: radius.pill,
                backgroundColor: color.dangerInk,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 10, color: color.onAccent }}>!</Text>
            </View>
            <Text style={{ fontFamily: font.medium, fontSize: 12, color: color.dangerInk }}>
              {nameError === 'missing'
                ? 'Give this routine a name before saving'
                : `You already have a routine called ${draft.name.trim()}`}
            </Text>
          </View>
        )}

        <Text style={{ fontFamily: font.regular, fontSize: 12, color: ink.strip, marginTop: 12, marginBottom: 24 }}>
          {draft.items.length
            ? `${draft.items.length} exercises · ${totalSets} working sets`
            : 'No exercises yet'}
        </Text>

        {draft.items.length === 0 && (
          <Card tone="dashed" padding="roomy" style={{ marginBottom: 14, paddingVertical: 30 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center', color: ink.subtle }}>
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
              scrollDelta={reorder.scrollDelta}
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
                // The default is stamped here rather than read at display time,
                // so changing it later does not rewrite this routine.
                ...names.map((name) => ({
                  name,
                  sets: 3,
                  reps: '10',
                  weight: 0,
                  unit: defaultUnit,
                  last: 'no history',
                })),
              ],
            }));
          }}
        />
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="Discard changes?"
          message={
            draft.name.trim()
              ? `Your edits to ${draft.name.trim()} have not been saved.`
              : 'This routine has not been saved yet.'
          }
          // No scrim dismissal: the point is to make the choice explicit.
          actions={[
            { label: 'Keep editing', tone: 'primary', onPress: () => setConfirmLeave(false) },
            { label: 'Discard', tone: 'danger', onPress: leave },
          ]}
        />
      )}
    </Screen>
  );
}
