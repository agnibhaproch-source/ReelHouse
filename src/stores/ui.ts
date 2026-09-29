import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Settings persisted per device and synced to the active profile (spec 57). */
export interface ExperienceSettings {
  reducedMotion: boolean;
  soundOn: boolean;
  classicCursor: boolean;
  webgl: boolean;
  /** 0–100 */
  grain: number;
  region: string;
  contentLanguage: string;
}

export const DEFAULT_SETTINGS: ExperienceSettings = {
  reducedMotion: false,
  soundOn: false,
  classicCursor: false,
  webgl: true,
  grain: 40,
  region: 'IN',
  contentLanguage: 'en-US',
};

interface UiState extends ExperienceSettings {
  navHidden: boolean;
  activePreviewId: number | null;
  transitioning: boolean;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  mobileMenuOpen: boolean;
  directorsCut: boolean;
  lightsDown: boolean;
  set: <K extends keyof UiState>(key: K, value: UiState[K]) => void;
  setSettings: (s: Partial<ExperienceSettings>) => void;
  toggle: (key: 'reducedMotion' | 'soundOn' | 'classicCursor' | 'webgl' | 'directorsCut') => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      navHidden: false,
      activePreviewId: null,
      transitioning: false,
      searchOpen: false,
      shortcutsOpen: false,
      mobileMenuOpen: false,
      directorsCut: false,
      lightsDown: false,
      set: (key, value) => set({ [key]: value } as Partial<UiState>),
      setSettings: (s) => set(s),
      toggle: (key) => set((st) => ({ [key]: !st[key] }) as Partial<UiState>),
    }),
    {
      name: 'reelhouse-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): ExperienceSettings => ({
        reducedMotion: s.reducedMotion,
        soundOn: s.soundOn,
        classicCursor: s.classicCursor,
        webgl: s.webgl,
        grain: s.grain,
        region: s.region,
        contentLanguage: s.contentLanguage,
      }),
    },
  ),
);

export const pickSettings = (s: ExperienceSettings): ExperienceSettings => ({
  reducedMotion: s.reducedMotion,
  soundOn: s.soundOn,
  classicCursor: s.classicCursor,
  webgl: s.webgl,
  grain: s.grain,
  region: s.region,
  contentLanguage: s.contentLanguage,
});
