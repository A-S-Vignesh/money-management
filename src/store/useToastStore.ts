import { create } from "zustand";
import { haptic } from "@/lib/haptic";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (message, type = "info") => {
    const id = Date.now();
    // Centralized haptic — every success/error mutation cues the user without
    // each call site having to remember to fire haptic itself.
    if (type === "success") haptic("success");
    else if (type === "error") haptic("error");
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
