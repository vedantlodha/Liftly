import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { border, color, ink, radius } from '@/theme/tokens';
import { RoutinesIcon, ScheduleIcon, TodayIcon, type TabIconProps } from './TabIcons';

/**
 * Expo Router 57 vendors react-navigation internally, so `BottomTabBarProps`
 * has no public import path. Deriving it from the `Tabs` component keeps this
 * correct if the internals move.
 */
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, (p: TabIconProps) => React.ReactElement> = {
  index: TodayIcon,
  routines: RoutinesIcon,
  schedule: ScheduleIcon,
};

/**
 * Floating pill tab bar. The design fades the screen out behind it with a
 * gradient rather than a hard edge, so scrolled content dissolves under the bar.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['rgba(244,245,247,0)', color.bg, color.bg]}
      locations={[0, 0.3, 1]}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 10,
        paddingHorizontal: 14,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: color.surface,
          borderWidth: 1,
          borderColor: border.card,
          borderRadius: radius.panel,
          padding: 5,
        }}
      >
        {state.routes.map((route, i) => {
          const Icon = ICONS[route.name];
          if (!Icon) return null;

          const active = state.index === i;
          const tint = active ? color.accent : ink.caret;
          const options = descriptors[route.key]?.options;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              // `aria-selected` maps to accessibilityState on native and to the
              // real attribute on web; accessibilityState alone leaves web silent.
              aria-selected={active}
              accessibilityLabel={options?.title ?? route.name}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 11,
                borderRadius: radius.card,
                backgroundColor: pressed ? color.fillHover : 'transparent',
              })}
            >
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Icon color={tint} active={active} />
                {/* underline indicator — reserved even when inactive so icons never shift */}
                <View
                  style={{
                    width: 16,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: active ? color.accent : 'transparent',
                  }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}
