import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onAction: () => void };
  duration: number;
  icon?: 'reel' | 'offline';
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { duration: 4000, ...t, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string, action?: Toast['action']) => useToastStore.getState().push({ kind: 'success', message, action }),
  error: (message: string, action?: Toast['action']) => useToastStore.getState().push({ kind: 'error', message, action }),
  info: (message: string, extra?: Partial<Omit<Toast, 'id' | 'kind' | 'message'>>) =>
    useToastStore.getState().push({ kind: 'info', message, ...extra }),
};
