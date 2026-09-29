'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import {
  PAGE_INTRO_EVENT,
  lastDetail,
  onTransitionRequest,
  setTransitioning,
  waitForPage,
  type TransitionRequest,
} from '@/lib/transition';
import { useLenis } from '@/hooks/useLenis';
import { isReducedNow, useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useCursorStore } from '@/stores/cursor';
import { useUiStore } from '@/stores/ui';
import { play } from '@/lib/sound';

function focusHeading() {
  const h1 = document.querySelector<HTMLElement>('main h1');
  if (!h1) return;
  if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
  h1.focus({ preventScroll: true });
}

function inViewport(r: DOMRect) {
  return (
    r.bottom > 0 &&
    r.top < window.innerHeight &&
    r.right > 0 &&
    r.left < window.innerWidth &&
    r.width > 0
  );
}

/**
 * Fixed overlay that runs page transitions (spec 35): shutter (default), shared poster
 * (card → detail and back), film burn (auth routes), crossfade (reduced motion).
 */
export function TransitionLayer() {
  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const seam = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const burn = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const popPending = useRef(false);
  const { scrollTo } = useLenis();
  const { webglEnabled } = useMotionPrefs();
  const scrollRef = useRef(scrollTo);
  const webglRef = useRef(webglEnabled);

  useEffect(() => {
    scrollRef.current = scrollTo;
    webglRef.current = webglEnabled;
  });

  useEffect(() => {
    const topEl = top.current!;
    const botEl = bottom.current!;
    gsap.set(topEl, { yPercent: -101 });
    gsap.set(botEl, { yPercent: 101 });

    const toTop = () => {
      scrollRef.current(0, { immediate: true });
      window.scrollTo(0, 0);
    };
    const finish = () => {
      setTransitioning(false);
      useUiStore.getState().set('transitioning', false);
      useCursorStore.getState().unlock();
      if (root.current) root.current.style.pointerEvents = 'none';
      requestAnimationFrame(focusHeading);
    };
    const intro = () => window.dispatchEvent(new Event(PAGE_INTRO_EVENT));

    const closeShutter = () =>
      new Promise<void>((resolve) => {
        tl.current?.kill();
        tl.current = gsap
          .timeline({ onComplete: resolve })
          .to(topEl, { yPercent: 0, duration: 0.5, ease: 'shutter' }, 0)
          .to(botEl, { yPercent: 0, duration: 0.5, ease: 'shutter' }, 0)
          .fromTo(
            seam.current,
            { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: 0.18, ease: 'reel' },
            0.4,
          )
          .to(seam.current, { opacity: 0, duration: 0.2 }, 0.58);
      });
    const openShutter = () =>
      new Promise<void>((resolve) => {
        tl.current?.kill();
        tl.current = gsap
          .timeline({ onComplete: resolve })
          .to(topEl, { yPercent: -101, duration: 0.7, ease: 'reel' }, 0)
          .to(botEl, { yPercent: 101, duration: 0.7, ease: 'reel' }, 0)
          .call(intro, [], 0.42);
      });

    const burnCover = async (cover: boolean) => {
      const el = burn.current!;
      if (webglRef.current) {
        try {
          const { runFilmBurn } = await import('@/components/gl/filmBurnRunner');
          await runFilmBurn(el, cover);
          return;
        } catch {
          /* CSS fallback below */
        }
      }
      el.style.opacity = '1';
      await gsap.fromTo(
        el,
        { '--burn': cover ? '0%' : '150%' },
        {
          '--burn': cover ? '150%' : '0%',
          duration: cover ? 0.6 : 0.7,
          ease: cover ? 'shutter' : 'reel',
        },
      );
      if (!cover) el.style.opacity = '0';
    };

    const run = async (req: TransitionRequest) => {
      setTransitioning(true);
      useUiStore.getState().set('transitioning', true);
      useCursorStore.getState().lock('loading');
      if (root.current) root.current.style.pointerEvents = 'auto';
      void play('whoosh');
      const reduced = isReducedNow();
      try {
        if (reduced) {
          await gsap.to(fade.current, { opacity: 1, duration: 0.1, ease: 'none' });
          req.push(req.href);
          await waitForPage();
          toTop();
          await gsap.to(fade.current, { opacity: 0, duration: 0.1, ease: 'none' });
        } else if (req.kind === 'poster' && req.poster) {
          const { rect, src, radius, id } = req.poster;
          const clone = document.createElement('img');
          clone.src = src;
          clone.alt = '';
          Object.assign(clone.style, {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            objectFit: 'cover',
            borderRadius: `${radius}px`,
            zIndex: 'var(--z-transition)',
            boxShadow: '0 30px 80px rgb(0 0 0 / 0.6)',
            pointerEvents: 'none',
          });
          document.body.appendChild(clone);
          gsap.to(fade.current, { opacity: 0.85, duration: 0.3 });
          req.push(req.href);
          await waitForPage();
          toTop();
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const target = document.querySelector<HTMLElement>(`[data-shared-poster="${id}"]`);
          const tr = target?.getBoundingClientRect();
          gsap.to(fade.current, { opacity: 0, duration: 0.5, delay: 0.2 });
          if (target && tr && inViewport(tr)) {
            gsap.set(target, { opacity: 0 });
            await gsap.to(clone, {
              left: tr.left,
              top: tr.top,
              width: tr.width,
              height: tr.height,
              borderRadius: 6,
              duration: 0.8,
              ease: 'projector',
            });
            gsap.set(target, { opacity: 1 });
          }
          intro();
          await gsap.to(clone, { opacity: 0, duration: DUR.fast });
          clone.remove();
        } else if (req.kind === 'burn') {
          await burnCover(true);
          req.push(req.href);
          await waitForPage();
          toTop();
          await burnCover(false);
          intro();
        } else {
          await closeShutter();
          req.push(req.href);
          await waitForPage();
          toTop();
          await openShutter();
        }
      } catch (err) {
        console.error('[transition]', err);
        req.push(req.href);
        gsap.set(topEl, { yPercent: -101 });
        gsap.set(botEl, { yPercent: 101 });
        gsap.set([fade.current, burn.current], { opacity: 0 });
      } finally {
        finish();
      }
    };

    const off = onTransitionRequest((req) => void run(req));

    // Back/forward: abort anything mid-flight; cover instantly, open once the page is ready.
    const onPop = () => {
      tl.current?.kill();
      gsap.killTweensOf([topEl, botEl, fade.current, burn.current]);
      document.querySelectorAll('body > img[style*="z-transition"]').forEach((n) => n.remove());
      gsap.set([fade.current, burn.current], { opacity: 0 });
      popPending.current = true;
      const leavingDetail = prevPath.current.startsWith('/movie/') && lastDetail.id !== null;
      if (!isReducedNow() && !leavingDetail) {
        gsap.set([topEl, botEl], { yPercent: 0 });
      } else {
        gsap.set(topEl, { yPercent: -101 });
        gsap.set(botEl, { yPercent: 101 });
      }
      finish();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      off();
      window.removeEventListener('popstate', onPop);
      tl.current?.kill();
    };
  }, []);

  // After a popstate route change: reverse poster flight or open the shutter.
  useEffect(() => {
    if (prevPath.current === pathname) return;
    const fromDetail = prevPath.current.startsWith('/movie/');
    prevPath.current = pathname;
    if (!popPending.current) return;
    popPending.current = false;
    const topEl = top.current!;
    const botEl = bottom.current!;
    void waitForPage(800).then(async () => {
      const card = lastDetail.id
        ? document.querySelector<HTMLElement>(`[data-poster-id="${lastDetail.id}"]`)
        : null;
      const cr = card?.getBoundingClientRect();
      if (
        fromDetail &&
        card &&
        cr &&
        inViewport(cr) &&
        lastDetail.rect &&
        lastDetail.src &&
        !isReducedNow()
      ) {
        const clone = document.createElement('img');
        clone.src = lastDetail.src;
        clone.alt = '';
        const r = lastDetail.rect;
        Object.assign(clone.style, {
          position: 'fixed',
          left: `${r.left}px`,
          top: `${r.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          objectFit: 'cover',
          borderRadius: '6px',
          zIndex: 'var(--z-transition)',
          pointerEvents: 'none',
        });
        document.body.appendChild(clone);
        gsap.set(card, { opacity: 0 });
        await gsap.to(clone, {
          left: cr.left,
          top: cr.top,
          width: cr.width,
          height: cr.height,
          duration: 0.7,
          ease: 'projector',
        });
        gsap.set(card, { opacity: 1 });
        clone.remove();
      } else {
        gsap.to(topEl, { yPercent: -101, duration: 0.7, ease: 'reel' });
        gsap.to(botEl, { yPercent: 101, duration: 0.7, ease: 'reel' });
      }
      lastDetail.id = null;
      window.dispatchEvent(new Event(PAGE_INTRO_EVENT));
    });
  }, [pathname]);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-(--z-transition)"
    >
      <div
        ref={top}
        className="bg-seat absolute inset-x-0 top-0 h-[50.5vh] will-change-transform"
      />
      <div
        ref={bottom}
        className="bg-seat absolute inset-x-0 bottom-0 h-[50.5vh] will-change-transform"
      />
      <div
        ref={seam}
        className="bg-cyan absolute inset-x-0 top-1/2 h-px -translate-y-1/2 scale-x-0 opacity-0 shadow-[0_0_24px_var(--marquee-cyan)]"
      />
      <div ref={fade} className="bg-void absolute inset-0 opacity-0" />
      <div ref={burn} className="film-burn absolute inset-0 opacity-0" />
    </div>
  );
}
