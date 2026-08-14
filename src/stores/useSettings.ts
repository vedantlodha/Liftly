import { create } from 'zustand';

import { persist } from '@/db/persistence';
import { setSetting, SETTING_KEYS } from '@/db/repositories/settings';
import type { WeightUnit } from './useUnits';

/**
 * App preferences.
 *
 * `defaultUnit` seeds newly added exercises only — it is not a display filter.
 * Each routine item carries its own unit once created, so changing this never
 * retroactively relabels existing work.
 */
type SettingsState = {
  defaultUnit: WeightUnit;
  setDefaultUnit: (unit: WeightUnit) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  defaultUnit: 'KG',
  setDefaultUnit: (defaultUnit) => {
    set({ defaultUnit });
    persist((db) => setSetting(db, SETTING_KEYS.defaultWeightUnit, defaultUnit));
  },
}));
