import { create } from 'zustand';

/** Matches the prototype's 2.2s auto-dismiss. */
const DURATION_MS = 2200;
/** An undoable message stays longer — you have to read it, then decide. */
const UNDO_DURATION_MS = 5000;

type ToastState = {
  message: string | null;
  /** Set when the action can be reversed; cleared once the toast goes. */
  undo: (() => void) | null;
  show: (message: string, undo?: () => void) => void;
  runUndo: () => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Single transient message, as the prototype's `flash()`. A second call
 * replaces the first and restarts the clock rather than queueing, so rapid
 * actions always show their own latest result.
 *
 * A message may carry an undo. That is the only safety net on a swipe-delete:
 * the gesture is quick, easy to trigger by accident, and otherwise final.
 */
export const useToast = create<ToastState>((set, get) => ({
  message: null,
  undo: null,
  show: (message, undo) => {
    if (timer) clearTimeout(timer);
    set({ message, undo: undo ?? null });
    timer = setTimeout(() => set({ message: null, undo: null }), undo ? UNDO_DURATION_MS : DURATION_MS);
  },
  runUndo: () => {
    const { undo } = get();
    if (!undo) return;
    if (timer) clearTimeout(timer);
    // Cleared before running, so an undo that itself toasts is not wiped out.
    set({ message: null, undo: null });
    undo();
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null, undo: null });
  },
}));

/** Imperative access for callers outside React. */
export const toast = (message: string, undo?: () => void) => useToast.getState().show(message, undo);
