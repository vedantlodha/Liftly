import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { buildDayView, type DayView } from '@/domain/dayView';
import { weekTotals } from '@/domain/stats';
import { addDays, DAY_NAMES, dayIndex } from '@/domain/week';
import type { Routine } from '@/data/seed';
import { findRoutineIn, useRoutines } from '@/stores/useRoutines';
import { resolveWeek, useSchedule } from '@/stores/useSchedule';
import { useHistory } from '@/stores/useHistory';
import { formatElapsed, sessionProgress, useSession } from '@/stores/useSession';
import { ResumeCard } from '@/features/today/ResumeCard';
import { RoutineSwitcher } from '@/features/today/RoutineSwitcher';
import { SessionCard } from '@/features/today/SessionCard';
import { WeekStrip } from '@/features/today/WeekStrip';
import { toast } from '@/stores/useToast';
import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Button, Card, CARET, Chevron, Screen, Scroll, Stat, StatRow, Text, useAnchor } from '@/ui';

export default function TodayScreen() {
  // Shares the schedule store with the Schedule tab, so a change made in either
  // place is the same change.
  const routines = useRoutines((s) => s.routines);
  const days = useSchedule((s) => s.days);
  const setOverride = useSchedule((s) => s.setOverride);
  const log = useHistory((s) => s.sessions);
  const session = useSession((s) => s.session);
  const pausedAt = useSession((s) => s.pausedAt);
  const pausedMs = useSession((s) => s.pausedMs);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // Days from today, driven by the week strip. 0 is today.
  const [selected, setSelected] = useState(0);

  // The resume card shows a running clock, so it re-renders on a tick while a
  // session is open — and stops entirely once `finish` clears it.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  const now = new Date();
  const ti = dayIndex(now);
  const resolved = resolveWeek(days, now);
  const today = resolved.find((d) => d.dayIndex === ti);

  const totals = weekTotals(log, now);
  const restDays = useMemo(
    () => new Set(resolved.filter((d) => !d.routineId && d.isRest).map((d) => d.dayIndex)),
    [resolved],
  );

  const upcoming = resolved.slice(ti + 1).concat(resolved).find((d) => d.routineId);
  const nextUp = upcoming ? `${upcoming.routineId} on ${DAY_NAMES[upcoming.dayIndex]}` : 'nothing';

  // The strip picks a day and this card follows it; the schedule repeats
  // weekly, so a day's plan is the one saved against its weekday.
  const selectedDate = addDays(now, selected);
  const scheduled = resolved.find((d) => d.dayIndex === dayIndex(selectedDate));
  const day = buildDayView({
    offset: selected,
    now,
    scheduled: findRoutineIn(routines, scheduled?.routineId),
    log,
    nextUp,
    isRest: scheduled?.isRest ?? false,
    hasRoutines: routines.length > 0,
  });

  // Swapping from Today is always a this-week change — the design's switcher
  // never edits the saved plan.
  const setDay = (name: string | null) => {
    if (name === today?.routineId) return;
    // Picking Rest from the switcher is deliberate, so it is a rest day
    // rather than a cleared one.
    setOverride(ti, name, name === null);
    toast(name ? `Today swapped to ${name} — this week only` : 'Today set to rest — this week only');
  };

  // The prototype resumes an open session rather than replacing it, so a stray
  // tap on Start can never discard logged sets.
  const startSession = (name?: string) => {
    if (session) {
      router.push(`/session/active?routine=${encodeURIComponent(session.name)}`);
      toast('Resuming your open session');
      return;
    }
    router.push(name ? `/session/active?routine=${encodeURIComponent(name)}` : '/session/active');
    if (!name) toast('Freestyle workout — nothing here touches your plan');
  };

  return (
    <Screen>
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: space.gutter,
          paddingTop: 20,
          paddingBottom: 6,
        }}
      >
        <View>
          <Text variant="eyebrow">
            {day.label}
          </Text>
          <Text variant="pageTitle" style={{ marginTop: 9 }}>
            {day.title}
          </Text>
        </View>
        <Avatar initials="VS" />
      </View>

      <Scroll
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Only while a session is actually open — finishing clears it. */}
        {session && (
          <ResumeCard
            name={session.name}
            paused={pausedAt != null}
            setsDone={sessionProgress(session).done}
            setsTotal={sessionProgress(session).total}
            elapsed={formatElapsed((pausedAt ?? Date.now()) - session.startedAt - pausedMs)}
            onPress={() => startSession()}
          />
        )}

        <WeekStrip
          restDays={restDays}
          selectedOffset={selected}
          onSelect={(offset) => {
            setSelected(offset);
            setSwitcherOpen(false);
          }}
        />

        {day.meta != null ? (
          <SessionCard
            day={day}
            routines={routines}
            switcherOpen={switcherOpen}
            onToggleSwitcher={() => setSwitcherOpen((v) => !v)}
            onCloseSwitcher={() => setSwitcherOpen(false)}
            onPickRoutine={setDay}
            onCreateRoutine={() => router.push(`/routine/new?day=${ti}&scope=week`)}
            onEdit={() => router.push(`/routine/${encodeURIComponent(day.title)}`)}
            onStart={() => startSession(day.title)}
            sessionOpen={session != null}
          />
        ) : (
          <RestDayCard
            day={day}
            routines={routines}
            switcherOpen={switcherOpen}
            onToggleSwitcher={() => setSwitcherOpen((v) => !v)}
            onCloseSwitcher={() => setSwitcherOpen(false)}
            onPickRoutine={setDay}
            onCreateRoutine={() => router.push(`/routine/new?day=${ti}&scope=week`)}
          />
        )}

        {/*
          The way to train something that is not the plan — and, once the day's
          workout is logged, the way to train again. Only offered on the day you
          are actually on.
        */}
        {day.isToday && (
          <Button
            label={session ? 'Resume workout' : 'Add new workout'}
            tone="outline"
            size="md"
            onPress={() => startSession()}
            labelStyle={{ fontFamily: font.medium, fontSize: 14, letterSpacing: 0 }}
            style={{ marginBottom: 30 }}
          />
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text variant="eyebrowTight">
            This week so far
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TextLink label="Exercises" onPress={() => router.push('/library')} />
            <TextLink label="History" onPress={() => router.push('/history')} />
          </View>
        </View>

        <StatRow style={{ marginBottom: 16 }}>
          <Stat value={String(totals.sessions)} label="sessions" />
          <Stat value={String(totals.sets)} label="sets logged" />
          <Stat value={totals.tonnes.toFixed(1)} label="tonnes moved" />
        </StatRow>
      </Scroll>
    </Screen>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: radius.pill,
        backgroundColor: color.fillHover,
        borderWidth: 1,
        borderColor: border.avatar,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
      }}
    >
      <Text style={{ fontFamily: font.semibold, fontSize: 12, color: ink.avatar }}>{initials}</Text>
    </View>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
      <Text style={{ fontFamily: font.medium, fontSize: 12, color: color.accent }}>{label}</Text>
    </Pressable>
  );
}

function RestDayCard({
  day,
  routines,
  switcherOpen,
  onToggleSwitcher,
  onCloseSwitcher,
  onPickRoutine,
  onCreateRoutine,
}: {
  day: DayView;
  routines: Routine[];
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  onCloseSwitcher: () => void;
  onPickRoutine: (name: string | null) => void;
  onCreateRoutine: () => void;
}) {
  const anchor = useAnchor();
  return (
    <Card
      tone="dashed"
      padding="roomy"
      style={{ alignItems: 'center', marginBottom: 14, paddingVertical: 26, borderRadius: radius.cardLg }}
    >
      <Text style={{ fontFamily: font.semibold, fontSize: 19, letterSpacing: -0.19, color: ink.primary }}>
        {day.restTitle}
      </Text>
      <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
        {day.restSub}
      </Text>

      {/* Only today offers a workout to pick — see the note in SessionCard. */}
      {day.isToday && (
      <View ref={anchor.ref} style={{ marginTop: 16, alignSelf: 'stretch' }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (switcherOpen ? onToggleSwitcher() : anchor.measure(onToggleSwitcher))}
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: radius.xl,
            backgroundColor: color.fill,
          }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 13.5, color: ink.primary }}>Pick a workout</Text>
          <Chevron direction={switcherOpen ? 'up' : 'down'} size={CARET.sm} color={ink.caret} />
        </Pressable>

        {switcherOpen && (
          <RoutineSwitcher
            routines={routines}
            current={null}
            anchor={anchor.rect}
            onDismiss={onCloseSwitcher}
            onCreate={() => {
              onCloseSwitcher();
              onCreateRoutine();
            }}
            onPick={(name) => {
              onPickRoutine(name);
              onCloseSwitcher();
            }}
          />
        )}
      </View>
      )}
    </Card>
  );
}
