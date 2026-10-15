import { create } from 'zustand';

/** Small notifications shown by the app shell (translated there). */
export type ToastData =
  | { kind: 'xp'; amount: number }
  | { kind: 'level'; level: number }
  | { kind: 'achievement'; id: string; icon: string };

export interface Toast {
  id: number;
  data: ToastData;
}

/** How long a toast stays visible. */
export const TOAST_MS = 3500;

interface ToastState {
  toasts: Toast[];
  push: (data: ToastData) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (data) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, data }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), TOAST_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
