import { View } from 'react-native';

import { color } from '@/theme/tokens';

export type TrashGlyphProps = {
  /** Overall width; the design uses 15 for rows and 13 for set rows. */
  size?: number;
};

/**
 * The bin drawn in the swipe-to-delete panel.
 *
 * Built from three views rather than an SVG because that is how the prototype
 * draws it — a lid, a handle, and an open-topped body — and at this size the
 * stroke widths matter more than the shape.
 */
export function TrashGlyph({ size = 15 }: TrashGlyphProps) {
  const height = size * (16 / 15);
  const bar = size < 14 ? 1.8 : 2;
  const inset = size < 14 ? 3.5 : 4;
  const bodyInset = size < 14 ? 1.5 : 2;
  const lidTop = size < 14 ? 2 : 3;

  return (
    <View style={{ width: size, height, position: 'relative' }}>
      {/* lid */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: lidTop,
          height: bar,
          borderRadius: 2,
          backgroundColor: color.dangerInk,
        }}
      />
      {/* handle */}
      <View
        style={{
          position: 'absolute',
          left: inset,
          right: inset,
          top: 0,
          height: bar,
          borderRadius: 2,
          backgroundColor: color.dangerInk,
        }}
      />
      {/* body, open at the top so the lid reads as separate */}
      <View
        style={{
          position: 'absolute',
          left: bodyInset,
          right: bodyInset,
          top: lidTop + 2,
          bottom: 0,
          borderWidth: bar,
          borderTopWidth: 0,
          borderColor: color.dangerInk,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}
