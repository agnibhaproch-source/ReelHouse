import { create } from 'zustand';
import type { MovieSnapshot } from '@/lib/data/types';
import type { Video } from '@/lib/tmdb/types';

interface TrailerState {
  movie: MovieSnapshot | null;
  videos: Video[] | null;
  origin: DOMRect | null;
  color: string | null;
  open: (movie: MovieSnapshot, opts?: { videos?: Video[]; origin?: DOMRect | null; color?: string | null }) => void;
  close: () => void;
}

export const useTrailerStore = create<TrailerState>()((set) => ({
  movie: null,
  videos: null,
  origin: null,
  color: null,
  open: (movie, opts = {}) => set({ movie, videos: opts.videos ?? null, origin: opts.origin ?? null, color: opts.color ?? null }),
  close: () => set({ movie: null, videos: null, origin: null }),
}));
