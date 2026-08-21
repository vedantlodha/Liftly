import { Pressable, TextInput, View } from 'react-native';

import { border, color, font, ink, radius } from '@/theme/tokens';
import { Text } from '@/ui';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** `page` is the bordered white field; `sheet` is the flat grey one. */
  tone?: 'page' | 'sheet';
};

/**
 * Search input.
 *
 * The magnifier is a plain circle, as the design draws it — the prototype has
 * no icon set, and a ring reads clearly enough at this size.
 */
export function SearchField({ value, onChangeText, placeholder = 'Search exercises', tone = 'page' }: SearchFieldProps) {
  const onPage = tone === 'page';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: onPage ? 44 : 42,
        borderRadius: radius.xl,
        paddingHorizontal: 14,
        backgroundColor: onPage ? color.surface : color.fill,
        borderWidth: onPage ? 1 : 0,
        borderColor: border.avatar,
      }}
    >
      <View
        style={{
          width: onPage ? 13 : 12,
          height: onPage ? 13 : 12,
          borderRadius: radius.pill,
          borderWidth: 1.5,
          borderColor: ink.eyebrow,
        }}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ink.placeholder}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        style={{
          flex: 1,
          padding: 0,
          fontFamily: 'Archivo_400Regular',
          fontSize: onPage ? 15 : 14.5,
          color: ink.primary,
        }}
      />

      {/* Only once there is something to clear, so the field stays quiet when empty. */}
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 18,
            height: 18,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? border.dashedStrong : border.check,
          })}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 11, lineHeight: 13, color: color.surface }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}
