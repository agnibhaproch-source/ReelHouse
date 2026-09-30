'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { loadSplitText } from '@/lib/split';
import { DUR, EASES } from '@/lib/tokens';
import { useUiStore } from '@/stores/ui';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLenis } from '@/hooks/useLenis';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { TransitionLink } from './TransitionLink';
import { SoundToggle } from './SoundToggle';
import { MotionToggle } from './MotionToggle';
import type { MegaItem } from './MegaMenu';

/**
 * Mobile (<768px) full-screen menu (spec 20): hamburger lines morph into an X, links reveal
 * through SplitText line masks, focus is trapped while open.
 */
export function MobileMenu({ genres, languages }: { genres: MegaItem[]; languages: MegaItem[] }) {
  const open = useUiStore((s) => s.mobileMenuOpen);
  const set = useUiStore((s) => s.set);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { stop, start } = useLenis();
  const close = () => set('mobileMenuOpen', false);
  useFocusTrap(panel, open, close);

  useEffect(() => {
    set('mobileMenuOpen', false);
  }, [pathname, set]);

  useEffect(() => {
    if (!open) return;
    stop();
    const el = panel.current;
    let split: { revert: () => void } | null = null;
    let cancelled = false;
    if (el && !isReducedNow())
      void loadSplitText().then((SplitText) => {
        if (cancelled) return;
        const s = SplitText.create(el.querySelectorAll('[data-split]'), {
          type: 'lines',
          mask: 'lines',
          aria: 'none',
        });
        split = s;
        gsap.from(s.lines, {
          yPercent: 110,
          duration: DUR.slow,
          ease: 'reel',
          stagger: 0.04,
          delay: 0.15,
        });
      });
    return () => {
      cancelled = true;
      start();
      split?.revert();
    };
  }, [open, stop, start]);

  const line =
    'absolute left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-pill bg-reel transition-[top,rotate,opacity] duration-base ease-snap';

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => set('mobileMenuOpen', !open)}
        className="relative z-(--z-modal) size-11 md:hidden"
      >
        <span
          aria-hidden="true"
          className={line}
          style={{ top: open ? 21 : 15, rotate: open ? '45deg' : '0deg' }}
        />
        <span aria-hidden="true" className={line} style={{ top: 21, opacity: open ? 0 : 1 }} />
        <span
          aria-hidden="true"
          className={line}
          style={{ top: open ? 21 : 27, rotate: open ? '-45deg' : '0deg' }}
        />
      </button>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <m.div
                ref={panel}
                id="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="bg-void px-gutter fixed inset-0 z-(--z-modal) overflow-y-auto pt-24 pb-32 md:hidden"
                initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                exit={{
                  clipPath: 'inset(0% 0% 100% 0%)',
                  transition: { duration: DUR.fast, ease: EASES.shutter },
                }}
                transition={{ duration: DUR.base, ease: EASES.projector }}
                data-lenis-prevent
              >
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="right-gutter hover:bg-reel/10 absolute top-3.5 grid size-11 place-items-center rounded-full"
                >
                  <X className="size-6" aria-hidden="true" />
                </button>
                <nav aria-label="Mobile">
                  <ul className="flex flex-col gap-1">
                    {[
                      { href: '/', label: 'Home' },
                      { href: '/browse', label: 'Moods & genres' },
                      { href: '/coming-soon', label: 'Coming soon' },
                      { href: '/search', label: 'Search' },
                      { href: '/my-list', label: 'My list' },
                      { href: '/taste', label: 'Your taste' },
                      { href: '/profiles', label: 'Profiles' },
                      { href: '/account', label: 'Settings' },
                    ].map((l) => (
                      <li key={l.href}>
                        <TransitionLink
                          href={l.href}
                          onClick={close}
                          className="font-display text-h1 block py-1"
                          aria-current={pathname === l.href ? 'page' : undefined}
                        >
                          <span data-split>{l.label}</span>
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                  <h2 className="text-small text-dim mt-10 mb-3 font-semibold">Genres</h2>
                  <ul className="flex flex-wrap gap-2">
                    {genres.slice(0, 12).map((g) => (
                      <li key={g.href}>
                        <TransitionLink
                          href={g.href}
                          onClick={close}
                          className="rounded-pill border-line text-small inline-flex min-h-11 items-center border px-4"
                        >
                          {g.label}
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                  <h2 className="text-small text-dim mt-8 mb-3 font-semibold">Languages</h2>
                  <ul className="flex flex-wrap gap-2">
                    {languages.map((g) => (
                      <li key={g.href}>
                        <TransitionLink
                          href={g.href}
                          onClick={close}
                          className="rounded-pill border-line text-small inline-flex min-h-11 items-center border px-4"
                        >
                          {g.label}
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex gap-2">
                    <SoundToggle />
                    <MotionToggle />
                  </div>
                </nav>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
