import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Reminder {
  id: number;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  poster_path: string | null;
  notified?: boolean;
}

interface RemindersState {
  items: Reminder[];
  has: (id: number) => boolean;
  toggle: (r: Omit<Reminder, 'notified'>) => boolean;
  markNotified: (ids: number[]) => void;
}

/** Release reminders, kept on this device (works for guests; no account or server needed). */
export const useReminders = create<RemindersState>()(
  persist(
    (set, get) => ({
      items: [],
      has: (id) => get().items.some((r) => r.id === id),
      toggle: (r) => {
        const on = !get().has(r.id);
        set((s) => ({
          items: on
            ? [...s.items, { ...r, notified: false }]
            : s.items.filter((x) => x.id !== r.id),
        }));
        return on;
      },
      markNotified: (ids) =>
        set((s) => ({
          items: s.items.map((r) => (ids.includes(r.id) ? { ...r, notified: true } : r)),
        })),
    }),
    { name: 'reelhouse-reminders', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
