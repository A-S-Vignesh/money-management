// lib/toast.ts
// Global toast notification store. Screens and mutation hooks push
// messages here; the <Toast /> component (mounted once in _layout)
// renders them with slide-down animation + auto-dismiss.

import { create } from "zustand";
import { hapticSuccess, hapticError } from "./haptics";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  /** Optional body text shown below the title. */
  body?: string;
  /** Auto-dismiss after this many ms. Defaults to 3000. */
  duration?: number;
}

interface ToastState {
  /** Currently visible toast (one at a time). */
  current: ToastMessage | null;
  /** Queued toasts waiting to display. */
  queue: ToastMessage[];

  /** Push a toast. If nothing is showing, displays immediately;
   *  otherwise it's queued and shown after the current one dismisses. */
  show: (msg: Omit<ToastMessage, "id">) => void;

  /** Convenience: show a success toast with just a title. */
  success: (title: string, body?: string) => void;
  /** Convenience: show an error toast with just a title. */
  error: (title: string, body?: string) => void;
  /** Convenience: show an info toast with just a title. */
  info: (title: string, body?: string) => void;

  /** Dismiss the current toast and advance the queue. Called by the
   *  Toast component when the auto-dismiss timer fires or the user
   *  swipes/taps to dismiss. */
  dismiss: () => void;
}

let _nextId = 1;

export const useToast = create<ToastState>((set, get) => ({
  current: null,
  queue: [],

  show: (msg) => {
    const toast: ToastMessage = { ...msg, id: String(_nextId++) };
    // Fire matching haptic
    if (toast.type === "success") hapticSuccess();
    else if (toast.type === "error") hapticError();
    const { current } = get();
    if (!current) {
      set({ current: toast });
    } else {
      set((s) => ({ queue: [...s.queue, toast] }));
    }
  },

  success: (title, body) => get().show({ type: "success", title, body }),
  error: (title, body) => get().show({ type: "error", title, body }),
  info: (title, body) => get().show({ type: "info", title, body }),

  dismiss: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
}));
