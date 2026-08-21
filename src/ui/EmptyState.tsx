import type { ReactNode } from 'react';
import { View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from './Text';

export type EmptyStateProps = {
  title: string;
  message: string;
  /** Optional glyph in a rounded tile above the title. */
  icon?: ReactNode;
};

/**
 * The dashed card shown where content would be, when there is none yet.
 *
 * Says what the user should do next rather than only that something is missing
 * — a first-run screen is the one place the app has to teach itself.
 */
export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <View
      style={{
        backgroundColor: color.surface,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: border.dashed,
        borderRadius: radius.menu,
        paddingVertical: 34,
        paddingHorizontal: 24,
        alignItems: 'center',
      }}
    >
      {icon != null && (
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: color.fill,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {icon}
        </View>
      )}
      <Text style={{ fontFamily: font.semibold, fontSize: 17, letterSpacing: -0.255, color: ink.primary }}>
        {title}
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 13,
          lineHeight: 19.5,
          color: ink.eyebrow,
          textAlign: 'center',
          marginTop: 7,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

/** The three-bar list glyph the design uses for "no routines yet". */
export function ListGlyph() {
  return (
    <View style={{ gap: 3 }}>
      {[17, 17, 10].map((width, i) => (
        <View key={i} style={{ width, height: 2.4, borderRadius: 2, backgroundColor: border.glyph }} />
      ))}
    </View>
  );
}
