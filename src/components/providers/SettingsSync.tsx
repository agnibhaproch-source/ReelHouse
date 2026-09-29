'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { pickSettings, useUiStore, DEFAULT_SETTINGS } from '@/stores/ui';
import { useSession } from '@/hooks/useSession';
import { useProfileStore } from '@/stores/profile';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { PREFS_COOKIES } from '@/lib/rows';
import { setMuted, primeSound } from '@/lib/sound';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Applies experience settings to the document (reduced-motion class, grain, director's cut,
 * lights down), mirrors viewer prefs into cookies for server-side TMDB calls, and syncs
 * settings to the active profile (spec 57).
 */
export function SettingsSync() {
  const router = useRouter();
  const { reduced } = useMotionPrefs();
  const grain = useUiStore((s) => s.grain);
  const directorsCut = useUiStore((s) => s.directorsCut);
  const lightsDown = useUiStore((s) => s.lightsDown);
  const soundOn = useUiStore((s) => s.soundOn);
  const region = useUiStore((s) => s.region);
  const contentLanguage = useUiStore((s) => s.contentLanguage);
  const { profile, repo } = useSession();
  const hydratingFor = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reduced);
  }, [reduced]);
  useEffect(() => {
    document.documentElement.style.setProperty('--grain-opacity', String((grain / 100) * 0.1));
  }, [grain]);
  useEffect(() => {
    document.documentElement.classList.toggle('directors-cut', directorsCut);
  }, [directorsCut]);
  useEffect(() => {
    document.documentElement.classList.toggle('lights-down', lightsDown);
  }, [lightsDown]);

  useEffect(() => {
    setMuted(!soundOn);
    if (soundOn) primeSound();
    const onVis = () => setMuted(document.hidden || !useUiStore.getState().soundOn);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [soundOn]);

  // Cookies drive server-rendered TMDB calls (language, region, kids).
  useEffect(() => {
    const prev = document.cookie;
    setCookie(PREFS_COOKIES.language, profile?.language ?? contentLanguage);
    setCookie(PREFS_COOKIES.region, region);
    setCookie(PREFS_COOKIES.kids, profile?.is_kids ? '1' : '0');
    if (prev !== document.cookie && hydratingFor.current !== null) router.refresh();
  }, [profile?.language, profile?.is_kids, contentLanguage, region, router]);

  // Profile → store on profile switch.
  useEffect(() => {
    const id = profile?.id ?? 'guest';
    if (hydratingFor.current === id) return;
    hydratingFor.current = id;
    if (profile) useUiStore.getState().setSettings({ ...DEFAULT_SETTINGS, ...pickSettings({ ...DEFAULT_SETTINGS, ...profile.settings }) });
  }, [profile]);

  // Store → profile (debounced).
  useEffect(() => {
    if (!profile) return;
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useUiStore.subscribe((s, prev) => {
      const a = pickSettings(s);
      const b = pickSettings(prev);
      if (JSON.stringify(a) === JSON.stringify(b)) return;
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          void repo.profiles
            .update(profile.id, { settings: a })
            .then((p) => useProfileStore.getState().setCurrent(p))
            .catch(() => {}),
        600,
      );
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [profile, repo]);

  return null;
}
