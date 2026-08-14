import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DAY_NAMES, dayIndex, type DayIndex } from '@/domain/week';
import { DayEditSheet, type DaySaveScope } from '@/features/schedule/DayEditSheet';
import { findRoutineIn, useRoutines } from '@/stores/useRoutines';
import { resolveWeek, useSchedule } from '@/stores/useSchedule';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Screen, ScreenHeader, Scroll, Stat, StatRow, Text } from '@/ui';

export default function ScheduleScreen() {
  const routines = useRoutines((s) => s.routines);
  const days = useSchedule((s) => s.days);
  const setPlan = useSchedule((s) => s.setPlan);
  const setOverride = useSchedule((s) => s.setOverride);
  const [editing, setEditing] = useState<DayIndex | null>(null);

  const now = new Date();
  const today = dayIndex(now);
  const resolved = resolveWeek(days, now);

  const trainingDays = resolved.filter((d) => d.routineId).length;

  const save = (day: DayIndex, routineId: string | null, scope: DaySaveScope) => {
    if (scope === 'thisWeek') setOverride(day, routineId);
    else setPlan(day, routineId);
    setEditing(null);
    toast(
      scope === 'thisWeek'
        ? `${DAY_NAMES[day]} changed for this week only`
        : `${DAY_NAMES[day]} updated in the weekly plan`,
    );
  };

  const editingDay = editing != null ? resolved.find((d) => d.dayIndex === editing) : undefined;

  return (
    <Screen>
      <ScreenHeader eyebrow="Repeats every week" title="Schedule" />

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: border.card,
            borderRadius: radius.panel,
            overflow: 'hidden',
          }}
        >
          {resolved.map((day, i) => {
            const routine = findRoutineIn(routines, day.routineId);
            return (
              <Pressable
                key={day.dayIndex}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${DAY_NAMES[day.dayIndex]}`}
                onPress={() => setEditing(day.dayIndex)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 15,
                  borderBottomWidth: i === resolved.length - 1 ? 0 : 1,
                  borderBottomColor: border.rowSoft,
                  backgroundColor: pressed ? color.fillHover : color.surface,
                })}
              >
                <Text
                  caps
                  style={{
                    width: 34,
                    fontFamily: font.monoMedium,
                    fontSize: 11,
                    letterSpacing: 0.66,
                    color: ink.muted,
                  }}
                >
                  {DAY_NAMES[day.dayIndex]}
                </Text>

                {/* Accent spine for a training day, grey for rest. */}
                <View
                  style={{
                    width: 3,
                    height: 28,
                    borderRadius: 2,
                    backgroundColor: routine ? color.accent : 'rgba(20,22,26,0.14)',
                  }}
                />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: font.medium, fontSize: 15, letterSpacing: -0.15, color: ink.primary }}>
                    {routine ? routine.name : 'Rest day'}
                  </Text>
                  <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: ink.strip, marginTop: 3 }}>
                    {routine ? `${routine.items.length} exercises · ${routine.tag}` : 'Recovery, walk, stretch'}
                  </Text>
                </View>

                {/* An overridden day shows THIS WK instead of TODAY — the temporary
                    state is the more useful thing to surface. */}
                {day.overridden ? (
                  <Badge label="This wk" tone="accent" />
                ) : day.dayIndex === today ? (
                  <Badge label="Today" tone="neutral" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 11.5,
            lineHeight: 17.8,
            color: ink.strip,
            paddingHorizontal: 4,
            paddingTop: 12,
          }}
        >
          Tap a day to set its workout or mark it as rest. Days marked{' '}
          <Text style={{ fontFamily: font.regular, fontSize: 11.5, color: color.accent }}>THIS WK</Text> revert to the
          saved schedule next Monday.
        </Text>

        <StatRow style={{ marginTop: 20 }}>
          <Stat size="sm" value={String(trainingDays)} label="training days" />
          <Stat size="sm" value={String(7 - trainingDays)} label="rest days" />
        </StatRow>
      </Scroll>

      {editing != null && editingDay && (
        <DayEditSheet
          day={editing}
          current={editingDay.routineId}
          overridden={editingDay.overridden}
          routines={routines}
          onDismiss={() => setEditing(null)}
          onSave={(routineId, scope) => save(editing, routineId, scope)}
        />
      )}
    </Screen>
  );
}

function Badge({ label, tone }: { label: string; tone: 'accent' | 'neutral' }) {
  const accent = tone === 'accent';
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderColor: accent ? color.accentBorderMid : 'rgba(20,22,26,0.18)',
      }}
    >
      <Text
        caps
        style={{
          fontFamily: font.monoMedium,
          fontSize: 9,
          letterSpacing: 0.72,
          color: accent ? color.accent : ink.caret,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
