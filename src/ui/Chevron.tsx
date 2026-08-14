import Svg, { Path } from 'react-native-svg';

import { ink } from '@/theme/tokens';

export type ChevronProps = {
  direction?: 'up' | 'down' | 'left' | 'right';
  /**
   * Visual width of the chevron, tip to tip.
   *
   * The design draws these as an N×N square rotated 45° with two borders
   * showing, which spans `N × √2` wide and half that tall. So a 9px CSS square
   * is `size={12.73}` here, and an 8px square is `size={11.31}`.
   */
  size?: number;
  thickness?: number;
  color?: string;
};

const ROTATION = { down: 0, left: 90, up: 180, right: 270 } as const;

/** Disclosure and back chevrons. Drawn pointing down, then rotated. */
export function Chevron({ direction = 'down', size = 12.73, thickness = 2, color = ink.caret }: ChevronProps) {
  // The path spans 16 of 24 viewBox units wide and is centred both ways, so the
  // square box can rotate about its centre for any direction.
  const box = size * (24 / 16);
  return (
    <Svg
      width={box}
      height={box}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: `${ROTATION[direction]}deg` }] }}
    >
      <Path
        d="M4 8 12 16 20 8"
        stroke={color}
        strokeWidth={(thickness * 24) / box}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Chevron widths for the CSS square sizes the design uses. */
export const CARET = { sm: 11.31, md: 12.73 } as const;
