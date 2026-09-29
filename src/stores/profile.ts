import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '@/lib/data/types';

interface ProfileState {
  current: Profile | null;
  setCurrent: (p: Profile | null) => void;
}

export const GUEST_PROFILE_ID = 'guest';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      current: null,
      setCurrent: (current) => set({ current }),
    }),
    { name: 'reelhouse-profile', storage: createJSONStorage(() => localStorage) },
  ),
);

/** Id used to key per-profile data; guests without a chosen profile share "guest". */
export const activeProfileId = (p: Profile | null): string => p?.id ?? GUEST_PROFILE_ID;
