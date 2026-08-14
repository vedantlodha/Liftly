import { create } from 'zustand';

/** Matches the prototype's 2.2s auto-dismiss. */
const DURATION_MS = 2200;

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Single transient message, as the prototype's `flash()`. A second call
 * replaces the first and restarts the clock rather than queueing, so rapid
 * actions always show their own latest result.
 */
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), DURATION_MS);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));

/** Imperative access for callers outside React. */
export const toast = (message: string) => useToast.getState().show(message);
