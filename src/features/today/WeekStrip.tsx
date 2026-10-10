import { useMemo, useRef, useState } from 'react';
import { Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

import { logKeyFor } from '@/domain/dayView';
import { dayIndex } from '@/domain/week';
import { useHistory } from '@/stores/useHistory';
import { border, color, font, ink, space } from '@/theme/tokens';
import { useToday } from './useToday';
import { Scroll, Text } from '@/ui';

const CELL = 54;
const GAP = 7;
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MFULL = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

type Cell = {
  /** Days from today; 0 is today, negative is past. */
  offset: number;
  letter: string;
  num: string;
  done: boolean;
  /** The weekly plan marks this weekday as rest. */
  rest: boolean;
  month: string;
};

/**
 * Two weeks back through the end of the current week, exactly as the prototype
 * builds it.
 *
 * A day is ticked only when the log actually holds a session for it. This used
 * to read the demo constants, which meant a blank install still claimed a
 * finished workout on Monday.
 */
function buildStrip(now: Date, loggedDates: ReadonlySet<string>, restDays: ReadonlySet<number>): Cell[] {
  const ti = dayIndex(now);
  const cells: Cell[] = [];

  for (let off = -14; off <= 6 - ti; off++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
    const wd = (dt.getDay() + 6) % 7;

    cells.push({
      offset: off,
      letter: LETTERS[wd] ?? '',
      num: String(dt.getDate()),
      done: off < 0 && loggedDates.has(logKeyFor(dt)),
      rest: restDays.has(wd),
      month: MFULL[dt.getMonth()] ?? '',
    });
  }
  return cells;
}

export type WeekStripProps = {
  /** Days from today. The parent owns it, because the card below reflects it. */
  selectedOffset: number;
  onSelect: (offset: number) => void;
  /** Weekday indices the user deliberately set to rest, Monday-first. */
  restDays: ReadonlySet<number>;
};

export function WeekStrip({ selectedOffset, onSelect, restDays }: WeekStripProps) {
  const log = useHistory((s) => s.sessions);
  const today = useToday();
  const cells = useMemo(
    () => buildStrip(today, new Set(log.map((s) => s.date)), restDays),
    [today, log, restDays],
  );
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const todayAt = cells.findIndex((c) => c.offset === 0);
  const [month, setMonth] = useState(cells[todayAt]?.month ?? '');

  // Land with today at the right edge, the way the prototype scrolls the strip.
  const scrollToToday = (w: number, animated = false) => {
    if (w <= 0 || todayAt < 0) return;
    const left = space.gutter + todayAt * (CELL + GAP);
    scroller.current?.scrollTo({ x: Math.max(0, left - w + CELL + space.gutter), animated });
  };

  // The header names whichever month is under the middle of the strip, so
  // scrolling back through a boundary relabels it.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = e.nativeEvent;
    const middle = contentOffset.x + layoutMeasurement.width / 2;
    const at = cells.findIndex((_, i) => space.gutter + i * (CELL + GAP) + CELL / 2 >= middle);
    const next = cells[at === -1 ? cells.length - 1 : at]?.month;
    if (next && next !== month) setMonth(next);
  };

  return (
    <>
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}
      >
        <Text style={{ fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.6, color: ink.caret }}>
          {month}
        </Text>
        {selectedOffset !== 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
            hitSlop={8}
            onPress={() => {
              onSelect(0);
              scrollToToday(width, true);
            }}
          >
            <Text style={{ fontFamily: font.medium, fontSize: 11.5, color: color.accent }}>Today</Text>
          </Pressable>
        )}
      </View>

      <Scroll
        ref={scroller}
        horizontal
        // Bleed past the page gutter so cells can scroll under the screen edge.
        style={{ marginHorizontal: -space.gutter, marginBottom: 22 }}
        contentContainerStyle={{ paddingHorizontal: space.gutter, gap: GAP }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setWidth(w);
          if (w !== width) scrollToToday(w);
        }}
      >
        {cells.map((c) => {
          // Selected beats done, so the dark pill is never hidden by a tick.
          // A logged workout outranks the plan, and the selection outranks both.
          const state =
            c.offset === selectedOffset && c.offset !== 0
              ? 'selected'
              : c.offset === 0
                ? 'today'
                : c.done
                  ? 'done'
                  : c.rest
                    ? 'rest'
                    : 'plain';
          return (
            <Pressable
              key={c.offset}
              accessibilityRole="button"
              accessibilityLabel={`${c.letter} ${c.num}`}
              aria-selected={c.offset === selectedOffset}
              onPress={() => onSelect(c.offset)}
              style={{ width: CELL, alignItems: 'center', gap: 8 }}
            >
              <Text style={{ fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.72, color: ink.strip }}>
                {c.letter}
              </Text>
              <View
                style={[
                  { width: '100%', height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
                  CELL_STYLE[state],
                ]}
              >
                <Text
                  style={{
                    fontFamily: state === 'plain' || state === 'rest' ? font.medium : font.semibold,
                    fontSize: state === 'done' ? 13 : 11,
                    color: LABEL_COLOR[state],
                  }}
                >
                  {state === 'done' ? '✓' : c.num}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Scroll>
    </>
  );
}

const CELL_STYLE = {
  done: { backgroundColor: color.accent },
  today: { backgroundColor: color.accentBg, borderWidth: 1.5, borderColor: color.accent },
  selected: { backgroundColor: color.inverseSurface },
  rest: { backgroundColor: color.restBg, borderWidth: 1, borderColor: color.restBorder },
  plain: { backgroundColor: color.surface, borderWidth: 1, borderColor: border.tile },
} as const;

const LABEL_COLOR = {
  done: color.onAccent,
  today: color.accent,
  selected: color.onInverse,
  rest: color.restInk,
  plain: ink.muted,
} as const;
