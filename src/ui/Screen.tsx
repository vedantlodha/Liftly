import { Pressable, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { border, color, ink, radius, space } from '@/theme/tokens';
import { Chevron } from './Chevron';
import { Text } from './Text';

/** Full-bleed screen background with the top safe-area inset applied. */
export function Screen({ style, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets();
  return <View {...rest} style={[{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }, style]} />;
}

export type ScreenHeaderProps = {
  /** Small uppercase DM Mono line above the title. */
  eyebrow?: string;
  title: string;
};

/** The eyebrow-over-title block that opens Today, Schedule, Routines and History. */
export function ScreenHeader({ eyebrow, title }: ScreenHeaderProps) {
  return (
    <View style={{ paddingHorizontal: space.gutter, paddingTop: 20, paddingBottom: 6 }}>
      {eyebrow != null && <Text variant="eyebrow">{eyebrow}</Text>}
      <Text variant="pageTitle" style={{ marginTop: eyebrow != null ? 9 : 0 }}>
        {title}
      </Text>
    </View>
  );
}

/** Back-chevron bar above sub-screens (Library, History, session detail). */
export function SubScreenBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: border.tile,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          marginLeft: -4,
          borderRadius: radius.md,
          backgroundColor: pressed ? color.fillPressed : color.fillInput,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Chevron direction="left" color={ink.chevron} />
      </Pressable>
      <Text variant="eyebrow" style={{ fontSize: 12, letterSpacing: 1.2 }}>
        {label}
      </Text>
    </View>
  );
}
