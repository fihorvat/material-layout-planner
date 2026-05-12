import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { newId } from '@/domain/ids';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  message: string;
  severity: ToastSeverity;
  createdAt: number;
};

type ToastState = {
  toasts: Toast[];
  pushToast: (message: string, severity?: ToastSeverity) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

export const useToastStore = create<ToastState>()(
  subscribeWithSelector(
    immer((set) => ({
      toasts: [],
      pushToast: (message, severity = 'info') => {
        const id = newId();
        set((s) => {
          s.toasts.push({ id, message, severity, createdAt: Date.now() });
        });
        if (severity !== 'error') {
          setTimeout(() => {
            set((s) => {
              s.toasts = s.toasts.filter((t) => t.id !== id);
            });
          }, 4000);
        }
        return id;
      },
      dismissToast: (id) =>
        set((s) => {
          s.toasts = s.toasts.filter((t) => t.id !== id);
        }),
      clearToasts: () =>
        set((s) => {
          s.toasts = [];
        }),
    })),
  ),
);
