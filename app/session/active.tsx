import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { BackHandler } from 'react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { ExercisePicker } from '@/features/library/ExercisePicker';
import { SwapSheet } from '@/features/library/SwapSheet';
import { ExerciseCard } from '@/features/session/ExerciseCard';
import { useReorder } from '@/features/routines/useReorder';
import { Keypad } from '@/features/session/Keypad';
import { RestTimer } from '@/features/session/RestTimer';
import { toast } from '@/stores/useToast';
import { unitLabel } from '@/stores/useUnits';
import { useSettings } from '@/stores/useSettings';
import {
  formatElapsed,
  nextSetLabel,
  sessionProgress,
  useSession,
} from '@/stores/useSession';
import { border, color, font, ink, radius } from '@/theme/tokens';
import { Button, Card, ConfirmDialog, Screen, Scroll, Text } from '@/ui';

/** The header clock and rest countdown both need sub-second accuracy. */
const TICK_MS = 500;

/** Named so the lock is ours to release and nothing else can clear it. */
const KEEP_AWAKE_TAG = 'liftly-workout';

export default function ActiveSessionScreen() {
  const { routine } = useLocalSearchParams<{ routine?: string }>();
  const s = useSession();
  const { session, pausedAt, pausedMs, restEndsAt, pad } = s;

  // Build the session once, from the route param. Re-entering an open session
  // must not rebuild it, or logged sets would vanish.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!session) s.start(routine ? decodeURIComponent(routine) : undefined);
  }, [routine, session, s]);

  const [dialog, setDialog] = useState<'finish' | 'leave' | null>(null);

  /**
   * Returns to Today.
   *
   * Not `router.back()`: this screen is often the only route in the stack —
   * opened from a notification, a deep link, or a cold start — and an
   * unhandled GO_BACK closes the app instead, which used to dump the user on
   * the Android home screen and take the in-memory session with it.
   */
  const goHome = () => {
    // `navigate` rather than `back`: it returns to Today if Today is already in
    // the stack and pushes it if not, so it works whether this screen was
    // reached from Today or was itself the entry point — a cold start, a
    // restored task, a deep link. `back()` in that second case pops the last
    // route and Android closes the app, which is how leaving a workout ended up
    // on the home screen with the session gone.
    console.log('[liftly] leaving workout — canGoBack:', router.canGoBack());
    router.navigate('/(tabs)');
  };
  const [picking, setPicking] = useState(false);
  const [swapAt, setSwapAt] = useState<number | null>(null);
  const defaultUnit = useSettings((st) => st.defaultUnit);
  // Reordering the live session only; the saved routine keeps its own order.
  const reorder = useReorder((from, to) => s.reorderItems(from, to));

  // A clock, not state: re-render on a tick rather than storing elapsed time.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [session]);

  /**
   * Holds the screen on while a workout is live.
   *
   * Two reasons. The obvious one is that re-unlocking between every set is
   * miserable. The quieter one is that a screen-off, backgrounded app is the
   * first thing Android reclaims — keeping it awake is the cheapest way to stop
   * the process being killed mid-session in the first place.
   */
  useEffect(() => {
    if (!session) return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => void deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [session]);

  // Backing out of a live session must not silently discard logged sets, so the
  // hardware back button asks instead of popping the route.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const st = useSession.getState();
      if (!st.session) return false;
      // The keypad is the innermost thing open, so back closes that first.
      if (st.pad) {
        st.closePad();
        return true;
      }
      // Never leaves on its own: back in the gym is usually a fumble, and the
      // three ways out of a workout are different enough to be worth choosing
      // between deliberately.
      setDialog((d) => d ?? 'leave');
      return true;
    });
    return () => sub.remove();
  }, []);

  if (!session) return <Screen />;

  const paused = pausedAt != null;
  const elapsed = formatElapsed((paused ? pausedAt : Date.now()) - session.startedAt - pausedMs);
  const { done, total } = sessionProgress(session);
  const restLeft = restEndsAt ? restEndsAt - Date.now() : 0;
  const resting = restLeft > 0;

  const guardPaused = () => {
    if (paused) toast('Resume to log sets');
    return paused;
  };

  return (
    <Screen>
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: border.tile,
        }}
      >
        {paused ? (
          <Pressable accessibilityRole="button" onPress={s.resume} hitSlop={8}>
            <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.accent }}>Resume</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={s.pause} hitSlop={8}>
            <Text style={{ fontFamily: font.medium, fontSize: 13.5, color: ink.body }}>Pause</Text>
          </Pressable>
        )}

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: font.semibold, fontSize: 14, letterSpacing: -0.14, color: ink.primary }}>
            {session.name}
          </Text>
          <Text
            style={{
              fontFamily: font.monoMedium,
              fontSize: 11,
              color: paused ? '#787A7E' : color.accent,
              marginTop: 2,
            }}
          >
            {elapsed}
            {paused ? '  ·  PAUSED' : ''}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
          onPress={() => {
            s.closePad();
            setDialog('finish');
          }}
          hitSlop={8}
        >
          <Text style={{ fontFamily: font.semibold, fontSize: 13.5, color: color.accent }}>Finish</Text>
        </Pressable>
      </View>

      {/* progress */}
      <View style={{ height: 2, backgroundColor: 'rgba(20,22,26,0.089)' }}>
        <View
          style={{
            height: 2,
            backgroundColor: color.accent,
            width: `${total ? Math.round((done / total) * 100) : 0}%`,
          }}
        />
      </View>

      <Scroll
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {session.items.map((item, i) => (
          <ExerciseCard
            key={`${item.name}-${i}`}
            item={item}
            index={i}
            paused={paused}
            editing={pad?.item === i ? { set: pad.set, field: pad.field } : null}
            onEditCell={(setIndex, field) => !guardPaused() && s.openPad(i, setIndex, field)}
            onToggleDone={(setIndex) => !guardPaused() && s.toggleDone(i, setIndex)}
            onAddSet={() => !guardPaused() && s.addSet(i)}
            onRemoveSet={(setIndex) => {
              const removed = item.sets[setIndex];
              s.removeSet(i, setIndex);
              toast('Set removed', removed && (() => s.restoreSet(i, setIndex, removed)));
            }}
            onChangeUnit={(unit) => s.setItemUnit(i, unit)}
            dragging={reorder.drag?.from === i}
            shift={reorder.shiftFor(i)}
            onMeasure={reorder.onMeasure}
            onDragStart={reorder.onDragStart}
            onDragMove={reorder.onDragMove}
            onDragEnd={reorder.onDragEnd}
            onSwap={() => setSwapAt(i)}
            onToggleSkip={() => {
              s.toggleSkip(i);
              toast(item.skipped ? `${item.name} back in` : `${item.name} skipped for today`);
            }}
          />
        ))}

        {session.items.length === 0 && (
          <Card tone="dashed" padding="roomy" style={{ marginBottom: 10 }}>
            <Text variant="rowTitle" style={{ textAlign: 'center' }}>
              Nothing logged yet
            </Text>
            <Text variant="bodySm" style={{ textAlign: 'center', marginTop: 6 }}>
              Add an exercise to start this freestyle workout.
            </Text>
          </Card>
        )}

        <Button
          label="+ Add exercise"
          tone="dashed"
          size="sm"
          onPress={() => !guardPaused() && setPicking(true)}
          labelStyle={{ fontFamily: font.medium, fontSize: 13.5, letterSpacing: 0 }}
        />
      </Scroll>

      {/* off-plan notice — sits above the rest timer when both are showing */}
      {session.changes.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: resting ? 96 : 16,
            zIndex: 70,
            backgroundColor: color.accentBg,
            borderWidth: 1,
            borderColor: color.accentBorderMid,
            borderRadius: radius.card,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: font.regular, fontSize: 12.5, lineHeight: 17, color: color.accent }}>
            {`${session.changes.length} ${session.changes.length === 1 ? 'change' : 'changes'} off plan — we’ll ask what to keep at the end.`}
          </Text>
        </View>
      )}

      {resting && !pad && (
        <RestTimer
          remaining={formatElapsed(restLeft)}
          nextSet={nextSetLabel(session)}
          onExtend={() => s.extendRest()}
          onSkip={s.skipRest}
        />
      )}

      {picking && (
        <ExercisePicker
          alreadyAdded={session.items.map((it) => it.name)}
          onDismiss={() => setPicking(false)}
          onConfirm={(names) => {
            setPicking(false);
            if (names.length === 0) return;
            s.addExercises(names, defaultUnit);
            toast(`${names.length} added — off plan for today`);
          }}
        />
      )}

      {swapAt != null && session.items[swapAt] && (
        <SwapSheet
          current={session.items[swapAt].name}
          onDismiss={() => setSwapAt(null)}
          onSwap={(name) => {
            const from = session.items[swapAt]?.name;
            s.swapExercise(swapAt, name);
            setSwapAt(null);
            toast(`${from} → ${name}`);
          }}
        />
      )}

      {dialog === 'finish' && (
        <ConfirmDialog
          title="Finish workout?"
          message={
            `${done} of ${total} sets logged in ${elapsed}.` +
            (done < total ? ' The rest will be saved as skipped.' : '')
          }
          onDismiss={() => setDialog(null)}
          actions={[
            {
              label: 'Finish and save',
              tone: 'primary',
              onPress: () => {
                setDialog(null);
                s.finish();
                // `replace`, not `push`: the finished session must not be
                // reachable again by backing into it.
                router.replace('/session/summary');
              },
            },
            { label: 'Keep training', tone: 'neutral', onPress: () => setDialog(null) },
          ]}
        />
      )}

      {dialog === 'leave' && (
        <ConfirmDialog
          title="Leave this workout?"
          message={`${session.name} · ${done} of ${total} sets logged · ${elapsed}`}
          onDismiss={() => setDialog(null)}
          // Safest first: a back press is more often a mis-swipe than a decision,
          // so the option that changes nothing is the one under your thumb.
          actions={[
            { label: 'Keep training', tone: 'primary', onPress: () => setDialog(null) },
            {
              label: paused ? 'Go home, stay paused' : 'Pause and go home',
              tone: 'neutral',
              onPress: () => {
                setDialog(null);
                // Stays open so Today can offer to resume it.
                if (!paused) s.pause();
                goHome();
                toast('Workout paused — resume it from Today');
              },
            },
            {
              label: 'Exit and discard',
              tone: 'danger',
              onPress: () => {
                setDialog(null);
                s.discard();
                goHome();
                toast('Workout discarded');
              },
            },
          ]}
        />
      )}

      {pad && (
        <Keypad
          label={
            pad.field === 'weight'
              ? `Weight (${unitLabel(session.items[pad.item]?.unit ?? 'KG')}) · set ${pad.set + 1}`
              : `Reps · set ${pad.set + 1}`
          }
          onKey={s.pressKey}
          onDone={s.closePad}
        />
      )}
    </Screen>
  );
}
