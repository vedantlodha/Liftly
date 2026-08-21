import { Pressable } from 'react-native';

import { border, color, font, ink, radius, space } from '@/theme/tokens';
import { Scroll, Text } from '@/ui';
import { FILTER_GROUPS } from './catalog';
import type { CatalogGroup } from '@/catalog/taxonomy';

export type FilterChipsProps = {
  value: CatalogGroup | 'All';
  onChange: (value: CatalogGroup | 'All') => void;
  /** `page` sits on the grey background; `sheet` sits on white. */
  tone?: 'page' | 'sheet';
};

/**
 * Muscle-group filter row, shared by the Library page and the exercise picker.
 *
 * The two differ only in what they sit on: an unselected chip is white against
 * the page and grey against a sheet, so each stays distinguishable from its
 * backdrop.
 */
export function FilterChips({ value, onChange, tone = 'page' }: FilterChipsProps) {
  const onPage = tone === 'page';
  return (
    <Scroll
      horizontal
      style={[
        // A horizontal list inside a flex column stretches to fill it unless
        // told not to — in the picker sheet that made the chips sheet-tall.
        { flexGrow: 0, flexShrink: 0 },
        // Bleed to the sheet edge so chips scroll off rather than stopping short.
        onPage ? null : { marginHorizontal: -(space.gutter - 2) },
      ]}
      contentContainerStyle={{
        gap: 7,
        paddingTop: onPage ? 14 : 0,
        paddingBottom: onPage ? 12 : 10,
        paddingHorizontal: onPage ? 0 : space.gutter - 2,
      }}
    >
      {FILTER_GROUPS.map((g) => {
        const on = value === g.value;
        return (
          <Pressable
            key={g.value}
            accessibilityRole="button"
            accessibilityLabel={`Filter ${g.label}`}
            aria-selected={on}
            onPress={() => onChange(g.value)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: radius.pill,
              backgroundColor: on ? color.accent : onPage ? color.surface : color.fill,
              borderWidth: 1,
              borderColor: on ? color.accent : onPage ? border.avatar : border.tile,
            }}
          >
            <Text style={{ fontFamily: font.medium, fontSize: 12, color: on ? color.onAccent : ink.action }}>
              {g.label}
            </Text>
          </Pressable>
        );
      })}
    </Scroll>
  );
}
