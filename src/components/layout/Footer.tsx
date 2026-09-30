'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState, type PointerEvent } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { gsap, useGSAP } from '@/lib/gsap';
import { LANGUAGES } from '@/lib/tmdb/languages';
import { useLenis } from '@/hooks/useLenis';
import { useMotionPrefs, isReducedNow } from '@/hooks/useMotionPrefs';
import { useMagnetic } from '@/hooks/useMagnetic';
import { RollText } from '@/components/motion/RollText';
import { Button } from '@/components/ui/Button';
import { SurpriseMe } from '@/components/movie/SurpriseMe';
import { TransitionLink } from './TransitionLink';
import { TmdbAttribution } from './TmdbAttribution';
import { Wordmark } from './Wordmark';

const HIDDEN_ON = /^\/(login|signup|forgot-password|profiles)(\/|$)/;

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Moods & genres' },
  { href: '/my-list', label: 'My list' },
  { href: '/taste', label: 'Your taste' },
  { href: '/account', label: 'Settings' },
];

/**
 * Footer (spec 28), as a closing sequence: a sign-off band with a cursor spotlight, one slim row
 * of links, languages in their own scripts, the fine print, and an end-credits wordmark a
 * projector beam sweeps across.
 */
export function Footer({ live = false }: { live?: boolean }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const topBtn = useRef<HTMLButtonElement>(null);
  const { scrollTo } = useLenis();
  const { reduced } = useMotionPrefs();
  const [lifting, setLifting] = useState(false);
  useMagnetic(topBtn, 0.4);

  useGSAP(
    () => {
      const root = ref.current;
      if (reduced || !root) return;
      // Real elements, not selector strings: during route changes the footer re-runs and a
      // string trigger can resolve to nothing, which breaks ScrollTrigger.
      const rise = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-foot-rise]'));
      const wordmark = root.querySelector<HTMLElement>('[data-foot-mark]');
      if (rise.length)
        gsap.from(rise, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'reel',
          stagger: 0.06,
          scrollTrigger: { trigger: root, start: 'top 85%', once: true },
        });
      if (wordmark)
        gsap.fromTo(
          wordmark,
          { yPercent: 40, clipPath: 'inset(0% 0% 100% 0%)' },
          {
            yPercent: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: {
              trigger: wordmark,
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: 0.6,
            },
          },
        );
    },
    { scope: ref, dependencies: [reduced, pathname], revertOnUpdate: true },
  );

  if (HIDDEN_ON.test(pathname)) return null;

  const spotlight = (e: PointerEvent<HTMLDivElement>) => {
    const el = band.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${e.clientX - r.left}px`);
    el.style.setProperty('--sy', `${e.clientY - r.top}px`);
  };

  const backToTop = () => {
    if (isReducedNow()) window.scrollTo({ top: 0, behavior: 'instant' });
    else {
      setLifting(true);
      scrollTo(0, { duration: 1.6, onComplete: () => setLifting(false) });
      setTimeout(() => setLifting(false), 1700);
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <footer ref={ref} className="bg-void relative mt-28 overflow-hidden pb-24 md:pb-0">
      {/* Sign-off band */}
      <div className="px-gutter mx-auto max-w-7xl">
        <div
          ref={band}
          onPointerMove={spotlight}
          className="footer-band rounded-modal border-line lit-edge relative isolate overflow-hidden border px-6 py-14 md:px-14 md:py-20"
        >
          <span aria-hidden="true" className="footer-band-beam absolute inset-0 -z-10" />
          <p data-foot-rise className="meta-caps text-dim">
            End of reel
          </p>
          <h2 data-foot-rise className="font-display text-h1 mt-3 max-w-3xl">
            Tonight’s showing is <em className="text-violet font-normal">up to you.</em>
          </h2>
          <div data-foot-rise className="mt-8 flex flex-wrap gap-3">
            <SurpriseMe variant="primary" size="lg" />
            <Button href="/ask" variant="secondary" size="lg" icon={<Sparkles />} magnetic={false}>
              Describe a mood
            </Button>
          </div>
        </div>
      </div>

      {/* One slim row: mark · links · back to top */}
      <div className="px-gutter mx-auto mt-14 flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-6">
        <TransitionLink
          href="/"
          aria-label="Reelhouse home"
          className="flex min-h-11 items-center"
          data-foot-rise
        >
          <Wordmark />
        </TransitionLink>
        <nav
          aria-label="Footer"
          className="order-last w-full md:order-none md:w-auto md:flex-1"
          data-foot-rise
        >
          <ul className="grid grid-cols-2 gap-x-7 md:flex md:flex-wrap md:gap-y-1">
            {(live
              ? [
                  ...LINKS.slice(0, 2),
                  { href: '/coming-soon', label: 'Coming soon' },
                  ...LINKS.slice(2),
                ]
              : LINKS
            ).map((l) => (
              <li key={l.href}>
                <TransitionLink
                  href={l.href}
                  className="text-small text-dim hover:text-reel duration-fast inline-flex min-h-11 items-center transition-colors"
                >
                  <RollText>{l.label}</RollText>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          ref={topBtn}
          type="button"
          onClick={backToTop}
          data-cursor="magnetic"
          data-foot-rise
          aria-label="Back to top"
          className="group border-line hover:border-violet duration-fast ml-auto grid size-14 place-items-center rounded-full border transition-colors"
        >
          <span data-magnetic-inner className="grid place-items-center">
            <ArrowUp
              className={`duration-base ease-snap size-5 transition-transform group-hover:-translate-y-1 ${lifting ? '-translate-y-6 opacity-0' : ''}`}
              aria-hidden="true"
            />
          </span>
        </button>
      </div>

      {/* Languages in their own scripts */}
      <nav
        aria-label="Browse by language"
        className="px-gutter mx-auto mt-6 max-w-7xl"
        data-foot-rise
      >
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <TransitionLink
                href={`/language/${l.code}`}
                lang={l.code}
                aria-label={`${l.name} films`}
                className="rounded-pill border-line text-small text-reel/75 hover:border-cyan/60 hover:text-reel inline-flex min-h-10 items-center border px-4 whitespace-nowrap transition-colors"
              >
                {l.native}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Fine print */}
      <div className="px-gutter border-line mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
        {live ? (
          <>
            <p className="text-dim text-[0.75rem]">
              © {new Date().getFullYear()} Reelhouse · Trailers only, never full films ·
              Availability by{' '}
              <a
                href="https://www.justwatch.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-reel underline-offset-4 hover:underline"
              >
                JustWatch
              </a>
            </p>
            <TmdbAttribution className="text-[0.75rem]" />
          </>
        ) : (
          <p className="text-dim text-[0.75rem]">
            © {new Date().getFullYear()} Reelhouse · All artwork is original, generated for
            Reelhouse — not studio posters · Ratings, runtimes and dates are approximate
          </p>
        )}
      </div>

      {/* End credits */}
      <div aria-hidden="true" className="px-gutter mt-8 overflow-hidden pb-6 select-none md:pb-8">
        <p
          data-foot-mark
          className="footer-mark font-display text-center text-[clamp(4.5rem,21vw,22rem)] leading-[0.78] font-semibold tracking-[-0.045em]"
        >
          Reelhouse
        </p>
      </div>
    </footer>
  );
}
