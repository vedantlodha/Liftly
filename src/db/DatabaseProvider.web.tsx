import type { ReactNode } from 'react';

/**
 * Web build: pass-through, no database.
 *
 * `expo-sqlite` on web runs SQLite as WASM, which needs `SharedArrayBuffer` and
 * therefore COOP/COEP cross-origin isolation that the Expo dev server does not
 * set. Metro resolves this `.web.tsx` file ahead of `DatabaseProvider.tsx`, so
 * the browser build never imports `expo-sqlite` at all.
 *
 * The browser is a UI-only preview surface. The data layer is verified under
 * Node against the real migration and schema (`pnpm db:verify`) and runs for
 * real on device. Screens that read from the database will render empty here.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
