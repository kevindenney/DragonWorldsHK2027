/**
 * Toast Store - Zustand store for toast notifications
 */

import { create } from 'zustand';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastState {
  message: string | null;
  variant: ToastVariant;
  visible: boolean;
  duration: number;
}

interface ToastStore extends ToastState {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  variant: 'info',
  visible: false,
  duration: 3000,

  showToast: (message: string, variant: ToastVariant = 'info', duration: number = 3000) => {
    set({
      message,
      variant,
      visible: true,
      duration,
    });

    // Auto-hide after duration
    setTimeout(() => {
      set({ visible: false });
    }, duration);
  },

  hideToast: () => {
    set({ visible: false });
  },
}));

export default useToastStore;
