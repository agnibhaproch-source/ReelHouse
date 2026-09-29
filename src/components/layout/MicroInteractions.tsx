'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores/ui';
import { toast } from '@/stores/toast';
import { watchTitle } from '@/lib/tab-title';
import { play } from '@/lib/sound';
import { isReducedNow } from '@/hooks/useMotionPrefs';

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
const IDLE_MS = 30_000;

function typingIn(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * Global micro-interactions (spec 39): `/` + ⌘K search, `?` shortcuts, Konami → Director's cut,
 * idle 30s on home → house lights down, offline toast, "Intermission" tab title.
 */
export function MicroInteractions() {
  const pathname = usePathname();
  const set = useUiStore((s) => s.set);

  useEffect(() => watchTitle(), []);

  // Shortcuts + Konami
  useEffect(() => {
    let seq: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        set('searchOpen', true);
        return;
      }
      if (typingIn(e.target)) return;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        set('searchOpen', true);
      } else if (e.key === '?') {
        e.preventDefault();
        set('shortcutsOpen', true);
      }
      seq = [...seq, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
      if (seq.join() === KONAMI.join()) {
        seq = [];
        const on = !useUiStore.getState().directorsCut;
        set('directorsCut', on);
        toast.info(
          on
            ? 'Director’s cut unlocked. Enter the code again to leave.'
            : 'Back to the theatrical cut.',
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [set]);

  // Idle on home → lights come down; any input restores.
  useEffect(() => {
    if (pathname !== '/') {
      set('lightsDown', false);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      if (useUiStore.getState().lightsDown) set('lightsDown', false);
      clearTimeout(t);
      t = setTimeout(() => set('lightsDown', true), IDLE_MS);
    };
    const events = ['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    wake();
    return () => {
      clearTimeout(t);
      events.forEach((ev) => window.removeEventListener(ev, wake));
      set('lightsDown', false);
    };
  }, [pathname, set]);

  // Press feedback for every button/link that isn't already a Pressable (spec 34). Uses WAAPI on
  // the independent `scale` property so it never clobbers transforms or transitions.
  useEffect(() => {
    const SELECTOR =
      'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="option"], summary';
    let pressed: { el: HTMLElement; anim: Animation } | null = null;
    const release = () => {
      if (!pressed) return;
      const { el, anim } = pressed;
      pressed = null;
      el.animate([{ scale: '0.96' }, { scale: '1' }], {
        duration: 420,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }).onfinish = () => anim.cancel();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || isReducedNow()) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(SELECTOR);
      if (
        !el ||
        el.closest('[data-pressable], [data-no-press]') ||
        el.matches(':disabled, [aria-disabled="true"]')
      )
        return;
      if (typeof el.animate !== 'function') return;
      void play('press');
      pressed = {
        el,
        anim: el.animate([{ scale: '1' }, { scale: '0.96' }], {
          duration: 120,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          fill: 'forwards',
        }),
      };
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  // Offline / online
  useEffect(() => {
    const off = () =>
      toast.info('You’re offline. Showing saved titles.', { icon: 'offline', duration: 6000 });
    const on = () => toast.success('Back online.');
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
    };
  }, []);

  return null;
}
