'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { EASES } from '@/lib/tokens';
import { clamp } from '@/lib/utils';
import { bezier } from '@/lib/bezier';
import { ScrollContext, type ScrollApi } from '@/hooks/useLenis';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

export const easeProjector = bezier(EASES.projector);

/**
 * Lenis smooth scroll driven by the GSAP ticker and synced with ScrollTrigger (spec 31).
 * Disabled (native scroll) for reduced motion and touch devices.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { smoothScroll } = useMotionPrefs();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (!smoothScroll) return;
    const l = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -80 },
    });
    const root = document.documentElement;
    const onScroll = (x: Lenis) => {
      ScrollTrigger.update();
      root.style.setProperty('--scroll-velocity', clamp(x.velocity / 40, -1, 1).toFixed(3));
    };
    l.on('scroll', onScroll);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- publishing the instance to context
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      root.style.setProperty('--scroll-velocity', '0');
      setLenis(null);
    };
  }, [smoothScroll]);

  // Native-scroll velocity for rows/grain when Lenis is off.
  useEffect(() => {
    if (lenis) return;
    let last = window.scrollY;
    let frame = 0;
    const root = document.documentElement;
    const loop = () => {
      const y = window.scrollY;
      root.style.setProperty('--scroll-velocity', clamp((y - last) / 40, -1, 1).toFixed(3));
      last = y;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [lenis]);

  // Refresh triggers once fonts + images settle.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    if (new URLSearchParams(window.location.search).get('debug') === 'scroll') {
      ScrollTrigger.defaults({ markers: true });
    }
    return () => window.removeEventListener('load', refresh);
  }, []);

  const api = useMemo<ScrollApi | null>(() => {
    if (!lenis) return null;
    return {
      lenis,
      scrollTo: (target, opts) =>
        lenis.scrollTo(target, {
          offset: opts?.offset ?? 0,
          duration: opts?.duration ?? 1.2,
          immediate: opts?.immediate,
          easing: easeProjector,
          onComplete: opts?.onComplete,
          force: true,
        }),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
      velocity: () => lenis.velocity,
      direction: () => lenis.direction,
    };
  }, [lenis]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
