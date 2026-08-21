import { Pressable, View } from 'react-native';

import type { Routine } from '@/data/seed';
import { color, font, ink, radius } from '@/theme/tokens';
import { AnchoredMenu, Scroll, Text, type AnchorRect } from '@/ui';

export type RoutineSwitcherProps = {
  routines: Routine[];
  current: string | null;
  onPick: (name: string | null) => void;
  onDismiss: () => void;
  /** Leaves for the builder. The way out when the list has nothing you want. */
  onCreate: () => void;
  /** Measured position of the trigger, from `useAnchor`. */
  anchor: AnchorRect | null;
};

/**
 * Routine picker for the Today card and the rest-day card.
 *
 * Uses `AnchoredMenu`, which renders in a Modal — an in-place popover paints
 * fine on Android but is untouchable, because it falls outside its parent's
 * bounds. That is what made this list unscrollable on device.
 */
export function RoutineSwitcher({ routines, current, onPick, onDismiss, onCreate, anchor }: RoutineSwitcherProps) {
  // The last entry is an action rather than a choice: it leaves for the builder
  // instead of setting the day, which is why it is accent-coloured and never
  // shows a tick.
  const options: { name: string; sub: string; value: string | null; create?: true }[] = [
    ...routines.map((r) => ({ name: r.name, sub: `${r.items.length} exercises · ${r.tag}`, value: r.name })),
    { name: 'Rest', sub: 'No session today', value: null },
    { name: '+ New routine', sub: 'Build one from scratch', value: null, create: true },
  ];

  return (
    <AnchoredMenu rect={anchor} onDismiss={onDismiss}>
      <Scroll bounces={false}>
        {options.map((o) => (
          <Pressable
            key={o.name}
            accessibilityRole="button"
            accessibilityLabel={o.name}
            onPress={() => (o.create ? onCreate() : onPick(o.value))}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              paddingHorizontal: 12,
              paddingVertical: 11,
              borderRadius: radius.lg,
              backgroundColor: pressed ? color.fill : 'transparent',
            })}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: font.medium, fontSize: 14.5, color: o.create ? color.accent : ink.primary }}>
                {o.name}
              </Text>
              <Text variant="caption" style={{ marginTop: 3 }}>
                {o.sub}
              </Text>
            </View>
            {!o.create && o.value === current && <CheckDot />}
          </Pressable>
        ))}
      </Scroll>
    </AnchoredMenu>
  );
}

function CheckDot() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: radius.pill,
        backgroundColor: color.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.semibold, fontSize: 11, color: color.onAccent }}>✓</Text>
    </View>
  );
}
