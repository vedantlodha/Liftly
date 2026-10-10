import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { toDateKey } from '@/domain/week';

const CHECK_MS = 60_000;

/**
 * Current local midnight, with a stable Date identity until the day changes.
 */
export function useToday(): Date {
  const [key, setKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    const check = () => setKey(toDateKey(new Date()));

    // Background intervals may stop, so also check when the app becomes active.
    const app = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    const timer = setInterval(check, CHECK_MS);

    return () => {
      app.remove();
      clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  }, [key]);
}
