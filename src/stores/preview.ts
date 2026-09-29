import { create } from 'zustand';
import type { Movie } from '@/lib/tmdb/types';

export type PreviewSource = 'hover' | 'keyboard' | 'touch';

interface PreviewState {
  movie: Movie | null;
  anchor: DOMRect | null;
  source: PreviewSource;
  /** Element to return focus to. */
  returnFocus: HTMLElement | null;
  open: (movie: Movie, anchor: DOMRect, source: PreviewSource, returnFocus?: HTMLElement | null) => void;
  close: () => void;
}

export const usePreviewStore = create<PreviewState>()((set) => ({
  movie: null,
  anchor: null,
  source: 'hover',
  returnFocus: null,
  open: (movie, anchor, source, returnFocus = null) => set({ movie, anchor, source, returnFocus }),
  close: () => set({ movie: null, anchor: null }),
}));
