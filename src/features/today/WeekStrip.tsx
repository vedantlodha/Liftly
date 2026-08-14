import { useRef, useState } from 'react';
import { Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

import { LOGGED_DATES, WEEK, todayIndex } from '@/data/seed';
import { border, color, font, ink, space } from '@/theme/tokens';
import { Scroll, Text } from '@/ui';

const CELL = 54;
const GAP = 7;
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DSHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MSHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
  month: string;
};

/** Two weeks back through the end of the current week, exactly as the prototype builds it. */
function buildStrip(now: Date): Cell[] {
  const ti = todayIndex(now);
  const logged = new Set(LOGGED_DATES);
  const cells: Cell[] = [];

  for (let off = -14; off <= 6 - ti; off++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
    const wd = (dt.getDay() + 6) % 7;
    const key = `${DSHORT[dt.getDay()]} ${dt.getDate()} ${MSHORT[dt.getMonth()]}`;

    cells.push({
      offset: off,
      letter: LETTERS[wd] ?? '',
      num: String(dt.getDate()),
      done: off < 0 && (logged.has(key) || (off > -7 && !!WEEK[wd]?.done)),
      month: MFULL[dt.getMonth()] ?? '',
    });
  }
  return cells;
}

export type WeekStripProps = {
  /** Days from today. The parent owns it, because the card below reflects it. */
  selectedOffset: number;
  onSelect: (offset: number) => void;
};

export function WeekStrip({ selectedOffset, onSelect }: WeekStripProps) {
  const cells = useRef(buildStrip(new Date())).current;
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
          const state = c.offset === selectedOffset && c.offset !== 0 ? 'selected' : c.offset === 0 ? 'today' : c.done ? 'done' : 'plain';
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
                    fontFamily: state === 'plain' ? font.medium : font.semibold,
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
  plain: { backgroundColor: color.surface, borderWidth: 1, borderColor: border.tile },
} as const;

const LABEL_COLOR = {
  done: color.onAccent,
  today: color.accent,
  selected: color.onInverse,
  plain: ink.muted,
} as const;
