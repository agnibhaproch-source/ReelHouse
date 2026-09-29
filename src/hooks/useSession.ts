'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Repo } from '@/lib/data/repo';
import type { Profile } from '@/lib/data/types';
import { localRepo } from '@/lib/data/local';

export interface SessionValue {
  ready: boolean;
  user: User | null;
  repo: Repo;
  profile: Profile | null;
  /** Key for per-profile data (profile id or "guest"). */
  profileId: string;
  accountsEnabled: boolean;
  selectProfile: (p: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionValue>({
  ready: false,
  user: null,
  repo: localRepo,
  profile: null,
  profileId: 'guest',
  accountsEnabled: false,
  selectProfile: () => {},
  signOut: async () => {},
});

export const useSession = (): SessionValue => useContext(SessionContext);
