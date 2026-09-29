import { create } from 'zustand';

export type CursorMode =
  'default' | 'link' | 'play' | 'drag' | 'text' | 'hidden' | 'loading' | 'magnetic';

export const CURSOR_MODES: readonly CursorMode[] = [
  'default',
  'link',
  'play',
  'drag',
  'text',
  'hidden',
  'loading',
  'magnetic',
];

export interface MagnetRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

interface CursorState {
  mode: CursorMode;
  label: string | null;
  color: string | null;
  /** Forced mode (e.g. `loading` during route change) overrides hover-derived mode. */
  locked: boolean;
  magnet: MagnetRect | null;
  setMode: (mode: CursorMode, label?: string | null) => void;
  lock: (mode: CursorMode, label?: string | null) => void;
  unlock: () => void;
  setColor: (color: string | null) => void;
  setMagnet: (rect: MagnetRect | null) => void;
  reset: () => void;
}

export const isCursorMode = (v: string | null | undefined): v is CursorMode =>
  !!v && (CURSOR_MODES as readonly string[]).includes(v);

export const useCursorStore = create<CursorState>()((set, get) => ({
  mode: 'default',
  label: null,
  color: null,
  locked: false,
  magnet: null,
  setMode: (mode, label = null) => {
    if (get().locked) return;
    if (get().mode === mode && get().label === label) return;
    set({ mode, label });
  },
  lock: (mode, label = null) => set({ mode, label, locked: true }),
  unlock: () => set({ locked: false, mode: 'default', label: null }),
  setColor: (color) => set({ color }),
  setMagnet: (magnet) => set({ magnet }),
  reset: () => set({ mode: 'default', label: null, color: null, locked: false, magnet: null }),
}));
