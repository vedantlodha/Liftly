import { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { Routine } from '@/data/seed';
import { DAY_NAMES, type DayIndex } from '@/domain/week';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Scroll, Sheet, Text } from '@/ui';

const FULL_DAY: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** `thisWeekOnly` decides whether Save writes the plan or a one-week override. */
export type DaySaveScope = 'everyWeek' | 'thisWeek';

export type DayEditSheetProps = {
  day: DayIndex;
  /** Currently resolved routine for the day, `null` for rest. */
  current: string | null;
  /** True when the day is a chosen rest day rather than simply blank. */
  currentIsRest: boolean;
  /** Whether the day is already showing a this-week override. */
  overridden: boolean;
  routines: Routine[];
  onDismiss: () => void;
  /** Leaves for the builder; this day is left as it was. */
  onCreate: () => void;
  onSave: (routineId: string | null, isRest: boolean, scope: DaySaveScope) => void;
};

export function DayEditSheet({
  day,
  current,
  currentIsRest,
  overridden,
  routines,
  onDismiss,
  onSave,
  onCreate,
}: DayEditSheetProps) {
  /**
   * `undefined` is a day with nothing on it — distinct from `null`, which is a
   * chosen rest day. Tapping the selected option returns here, which is the
   * only way to empty a day once something has been put on it.
   */
  const [choice, setChoice] = useState<string | null | undefined>(currentIsRest || current ? current : undefined);
  // Opens on whichever scope the day is already using, so re-saving an override
  // does not silently promote it to the permanent plan.
  const [scope, setScope] = useState<DaySaveScope>(overridden ? 'thisWeek' : 'everyWeek');

  // The last entry is an action, not a choice: it abandons this sheet for the
  // builder, so it carries no radio and is accent-coloured to say so.
  const options: { id: string | null; name: string; sub: string; create?: true }[] = [
    { id: null, name: 'Rest', sub: 'Recovery day — no session scheduled' },
    ...routines.map((r) => ({
      id: r.name,
      name: r.name,
      sub: `${r.items.length} exercises · ${r.tag}`,
    })),
    { id: null, name: '+ New routine', sub: 'Build one and come back to this day', create: true },
  ];

  return (
    <Sheet onDismiss={onDismiss}>
      <Text variant="sheetTitle">{FULL_DAY[DAY_NAMES[day]] ?? DAY_NAMES[day]}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 12.5, color: ink.muted, marginTop: 6, marginBottom: 18 }}>
        Pick what this day should be.
      </Text>

      <Scroll style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 7 }}>
        {options.map((o) => {
          const on = !o.create && choice !== undefined && choice === o.id;
          return (
            <Pressable
              key={o.name}
              accessibilityRole={o.create ? 'button' : 'radio'}
              aria-checked={o.create ? undefined : on}
              accessibilityLabel={o.name}
              // Tapping what is already chosen clears the day.
              onPress={() => (o.create ? onCreate() : setChoice(on ? undefined : o.id))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 15,
                paddingVertical: 14,
                borderRadius: 13,
                backgroundColor: color.fill,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontFamily: font.medium, fontSize: 14.5, color: o.create ? color.accent : ink.primary }}
                >
                  {o.name}
                </Text>
                <Text style={{ fontFamily: font.regular, fontSize: 11, color: ink.strip, marginTop: 3 }}>
                  {o.sub}
                </Text>
              </View>
              {!o.create && (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...(on
                      ? { backgroundColor: color.accent }
                      : { borderWidth: 1.5, borderColor: border.check }),
                  }}
                >
                  {on && <Text style={{ fontFamily: font.semibold, fontSize: 12, color: color.onAccent }}>✓</Text>}
                </View>
              )}
            </Pressable>
          );
        })}
      </Scroll>

      <Text variant="eyebrowTight" style={{ marginBottom: 9 }}>
        Apply to
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        <ScopeCard
          title="Every week"
          sub="Updates the plan"
          selected={scope === 'everyWeek'}
          onPress={() => setScope('everyWeek')}
        />
        <ScopeCard
          title="Just this week"
          sub="Reverts Monday"
          selected={scope === 'thisWeek'}
          onPress={() => setScope('thisWeek')}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save day"
        onPress={() => onSave(choice ?? null, choice === null, scope)}
        style={({ pressed }) => ({
          height: 50,
          borderRadius: radius.card,
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
      >
        <Text variant="button" color={color.onAccent}>
          Save
        </Text>
      </Pressable>
    </Sheet>
  );
}

function ScopeCard({
  title,
  sub,
  selected,
  onPress,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 13,
        borderWidth: 1.5,
        backgroundColor: selected ? color.accentBg : color.fill,
        borderColor: selected ? color.accent : 'transparent',
      }}
    >
      <Text
        style={{ fontFamily: font.semibold, fontSize: 13, color: selected ? color.accent : ink.control }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 11,
          marginTop: 3,
          color: selected ? 'rgba(47,107,255,0.8)' : ink.faint,
        }}
      >
        {sub}
      </Text>
    </Pressable>
  );
}
