import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Height the keyboard currently covers, or 0 when it is closed.
 *
 * Needed because a React Native `Modal` opens its own Android window, and a
 * `statusBarTranslucent` one does not honour the activity's `adjustResize`. The
 * sheets inside those modals therefore have to move themselves.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS reports the frame before the animation so the sheet moves with the
    // keyboard rather than after it; Android only emits the `Did` pair.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
