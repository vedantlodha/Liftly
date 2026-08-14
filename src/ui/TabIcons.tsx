import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * Tab glyphs.
 *
 * The prototype draws these with rotated CSS borders because a Design Component
 * has no SVG available. React Native does, so these are real paths — same
 * shapes and the same 2pt/1.75pt active/inactive stroke weights, without the
 * transform-origin fragility.
 */
export type TabIconProps = { color: string; active: boolean };

const weight = (active: boolean) => (active ? 2 : 1.75);

export function TodayIcon({ color, active }: TabIconProps) {
  const w = weight(active);
  return (
    <Svg width={19} height={18} viewBox="0 0 19 18" fill="none">
      <Path
        d="M1.6 8.4 9.5 1.5l7.9 6.9"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.9 8.6v6.3a1.6 1.6 0 0 0 1.6 1.6h8a1.6 1.6 0 0 0 1.6-1.6V8.6"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RoutinesIcon({ color, active }: TabIconProps) {
  const w = weight(active);
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      {[4, 9, 14].map((y, i) => (
        <Line
          key={y}
          x1={1}
          y1={y}
          // The third rule is short — it reads as a list rather than a menu.
          x2={i === 2 ? 11 : 17}
          y2={y}
          stroke={color}
          strokeWidth={w}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export function ScheduleIcon({ color, active }: TabIconProps) {
  const w = weight(active);
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect x={1} y={1} width={16} height={16} rx={3.5} stroke={color} strokeWidth={w} />
      <Line x1={1} y1={5.75} x2={17} y2={5.75} stroke={color} strokeWidth={w} />
      {[5, 9, 13].map((cx) => (
        <Circle key={cx} cx={cx} cy={11.75} r={1.15} fill={color} />
      ))}
    </Svg>
  );
}
