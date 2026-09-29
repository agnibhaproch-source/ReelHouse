'use client';

import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { GENRES } from '@/lib/tmdb/genres';
import { LANGUAGES } from '@/lib/tmdb/languages';
import { useLenis } from '@/hooks/useLenis';
import { useMotionPrefs, isReducedNow } from '@/hooks/useMotionPrefs';
import { useMagnetic } from '@/hooks/useMagnetic';
import { VariableHover } from '@/components/motion/VariableHover';
import { Marquee } from '@/components/motion/Marquee';
import { RollText } from '@/components/motion/RollText';
import { FilmReelSpinner } from '@/components/ui/FilmReelSpinner';
import { TransitionLink } from './TransitionLink';
import { TmdbAttribution } from './TmdbAttribution';

const HIDDEN_ON = /^\/(login|signup|forgot-password|profiles)(\/|$)/;

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Browse',
    links: [{ href: '/', label: 'Home' }, { href: '/browse', label: 'All genres' }, ...GENRES.slice(0, 4).map((g) => ({ href: `/browse/${g.slug}`, label: g.name })), { href: '/search', label: 'Search' }],
  },
  { title: 'Languages', links: LANGUAGES.slice(0, 7).map((l) => ({ href: `/language/${l.code}`, label: l.name })) },
  {
    title: 'Account',
    links: [
      { href: '/my-list', label: 'My list' },
      { href: '/profiles', label: 'Profiles' },
      { href: '/account', label: 'Settings' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/styleguide', label: 'Styleguide' },
      { href: 'https://www.themoviedb.org/', label: 'TMDB' },
      { href: 'https://www.justwatch.com/', label: 'JustWatch' },
    ],
  },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  const external = href.startsWith('http');
  const inner = (
    <>
      <RollText>{label}</RollText>
      <svg viewBox="0 0 16 16" className="size-3 opacity-0 transition-opacity duration-fast group-hover/fl:opacity-100 group-focus-visible/fl:opacity-100" aria-hidden="true">
        <path
          d="M3 13 13 3M6 3h7v7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          pathLength={1}
          strokeDasharray="1"
          className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-base ease-reel group-hover/fl:[stroke-dashoffset:0] group-focus-visible/fl:[stroke-dashoffset:0]"
        />
      </svg>
    </>
  );
  const cls = 'group/fl inline-flex min-h-9 items-center gap-1.5 text-small text-dim transition-colors duration-fast hover:text-reel';
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noreferrer">
      {inner}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <TransitionLink href={href} className={cls}>
      {inner}
    </TransitionLink>
  );
}

/** Footer (spec 28): end-credits wordmark reveal, rolling links, TMDB attribution, magnetic back-to-top. */
export function Footer() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const topBtn = useRef<HTMLButtonElement>(null);
  const { scrollTo } = useLenis();
  const { reduced } = useMotionPrefs();
  const [spinning, setSpinning] = useState(false);
  useMagnetic(topBtn, 0.4);

  useGSAP(
    () => {
      if (reduced || !mark.current || !ref.current) return;
      gsap.fromTo(
        mark.current,
        { yPercent: 45, clipPath: 'inset(0% 0% 100% 0%)' },
        { yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'bottom bottom', scrub: 0.6 } },
      );
    },
    { scope: ref, dependencies: [reduced, pathname], revertOnUpdate: true },
  );

  if (HIDDEN_ON.test(pathname)) return null;

  const backToTop = () => {
    if (isReducedNow()) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setSpinning(true);
      scrollTo(0, { duration: 1.6, onComplete: () => setSpinning(false) });
      setTimeout(() => setSpinning(false), 1700);
    }
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <footer ref={ref} className="relative mt-24 overflow-hidden border-t border-line bg-void pb-24 md:pb-0">
      <Marquee speed={30} label="Credits" className="border-b border-line py-3 text-small text-dim">
        {['Built by Agni', 'Posters & data from TMDB', 'Motion by GSAP + Motion', 'Smooth scroll by Lenis', 'Sound: procedurally generated (CC0)', 'Set in Fraunces & Manrope', 'No full movies — trailers only'].map((c) => (
          <span key={c} className="flex items-center gap-8 px-4 whitespace-nowrap">
            {c}
            <span aria-hidden="true" className="text-violet">✦</span>
          </span>
        ))}
      </Marquee>

      <div className="mx-auto grid max-w-7xl gap-10 px-gutter pt-16 md:grid-cols-[1fr_auto]">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 font-ui text-small font-bold tracking-normal text-reel">{col.title}</h2>
              <ul className="flex flex-col">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <FooterLink {...l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-6 md:items-end">
          <button
            ref={topBtn}
            type="button"
            onClick={backToTop}
            data-cursor="magnetic"
            className="group flex min-h-12 items-center gap-3 rounded-pill border border-line px-5 text-small font-semibold transition-colors duration-fast hover:border-violet hover:text-violet"
          >
            <span data-magnetic-inner className="flex items-center gap-3">
              <FilmReelSpinner className={spinning ? 'size-5' : 'size-5 [animation-play-state:paused]'} />
              Back to top
            </span>
          </button>
          <TmdbAttribution />
        </div>
      </div>

      <div ref={mark} className="pointer-events-auto mt-10 select-none px-gutter pb-6 md:pb-10" aria-hidden="true">
        <VariableHover text="Reelhouse" className="block text-center text-[clamp(4rem,19vw,20rem)] leading-[0.8] tracking-[-0.04em] text-reel/90" />
      </div>
    </footer>
  );
}
