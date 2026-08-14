import { Pressable, View } from 'react-native';

import { color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

export type ResumeCardProps = {
  name: string;
  paused: boolean;
  setsDone: number;
  setsTotal: number;
  elapsed: string;
  onPress: () => void;
};

/** Tinted card at the top of Today when a session is still open. */
export function ResumeCard({ name, paused, setsDone, setsTotal, elapsed, onPress }: ResumeCardProps) {
  const pct = setsTotal > 0 ? Math.round((setsDone / setsTotal) * 100) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Resume ${name}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: color.accentBg,
        borderWidth: 1,
        borderColor: pressed ? color.accentBorderHover : color.accentBorder,
        borderRadius: radius.panel,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 15,
        marginBottom: 16,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text variant="eyebrowTight" color={color.accent}>
          {paused ? 'Paused' : 'In progress'}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: font.semibold, fontSize: 12, color: color.accent }}>Resume ›</Text>
      </View>

      <Text style={{ fontFamily: font.semibold, fontSize: 20, lineHeight: 22, letterSpacing: -0.4, color: ink.primary, marginTop: 9 }}>
        {name}
      </Text>

      <Text style={{ fontFamily: font.mono, fontSize: 12, color: 'rgb(70,90,140)', marginTop: 6 }}>
        {`${setsDone} / ${setsTotal} sets · ${elapsed}`}
      </Text>

      <View style={{ height: 3, borderRadius: 2, backgroundColor: color.accentTrack, marginTop: 13 }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: color.accent, width: `${pct}%` }} />
      </View>
    </Pressable>
  );
}
