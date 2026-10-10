import { forwardRef } from 'react';
import { ScrollView, type ScrollViewProps, type ScrollView as RNScrollView } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';

export type ScrollProps = ScrollViewProps & {
  /**
   * Use gesture-handler's ScrollView so nested gestures can coordinate with
   * scrolling. Opt in for lists with drag-to-reorder or similar gestures.
   */
  gestureAware?: boolean;
};

/**
 * A ScrollView with the scroll indicators off.
 *
 * The prototype hides them globally rather than per-list:
 *
 *     div{scrollbar-width:none;-ms-overflow-style:none}
 *     div::-webkit-scrollbar{width:0;height:0;display:none}
 *
 * so this is the one place that rule lives. Use it instead of ScrollView; the
 * props are identical and either indicator can still be switched back on.
 */
export const Scroll = forwardRef<RNScrollView, ScrollProps>(function Scroll(
  { gestureAware, ...props },
  ref,
) {
  const Component = gestureAware ? GestureScrollView : ScrollView;
  return (
    <Component ref={ref} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} {...props} />
  );
});

export type { ScrollViewProps };
