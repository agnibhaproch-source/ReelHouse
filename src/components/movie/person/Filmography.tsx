'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { DUR } from '@/lib/tokens';
import type { PersonCredit } from '@/lib/tmdb/types';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { TransitionLink } from '@/components/layout/TransitionLink';

/**
 * Filmography timeline (spec 27): the vertical line draws with scroll progress (scrub, not time);
 * each year node pops in; titles listed per year with small posters.
 */
export function Filmography({ credits }: { credits: PersonCredit[] }) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPrefs();

  const byYear = new Map<string, PersonCredit[]>();
  for (const c of credits) {
    const y = c.release_date?.slice(0, 4) || 'Upcoming';
    byYear.set(y, [...(byYear.get(y) ?? []), c]);
  }
  const years = [...byYear.entries()].sort((a, b) => (a[0] === 'Upcoming' ? -1 : b[0] === 'Upcoming' ? 1 : Number(b[0]) - Number(a[0])));

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      gsap.fromTo('[data-line]', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('[data-node]').forEach((n) =>
        gsap.from(n, { scale: 0, duration: DUR.base, ease: 'snap', scrollTrigger: { trigger: n, start: 'top 72%', toggleActions: 'play none none reverse' } }),
      );
      gsap.utils.toArray<HTMLElement>('[data-year-items]').forEach((n) =>
        gsap.from(n, { autoAlpha: 0, x: 24, duration: DUR.slow, ease: 'reel', scrollTrigger: { trigger: n, start: 'top 80%', once: true } }),
      );
    },
    { scope: root, dependencies: [reduced, credits.length], revertOnUpdate: true },
  );

  if (!years.length) return null;
  return (
    <section ref={root} aria-labelledby="films-h" className="mx-auto max-w-5xl px-gutter py-16">
      <h2 id="films-h" className="mb-10 font-display text-h2">
        Filmography
      </h2>
      <ol data-timeline className="relative ml-3 flex flex-col gap-10 md:ml-24">
        <span aria-hidden="true" className="absolute top-0 bottom-0 -left-px w-0.5 bg-line" />
        <span aria-hidden="true" data-line className="absolute top-0 bottom-0 -left-px w-0.5 origin-top bg-violet" />
        {years.map(([year, list]) => (
          <li key={year} className="relative pl-8">
            <span aria-hidden="true" data-node className="absolute top-2 -left-[7px] size-3.5 rounded-full border-2 border-violet bg-void" />
            <h3 className="mb-3 font-display text-h3 md:absolute md:top-0 md:-left-24 md:w-16 md:text-right">{year}</h3>
            <ul data-year-items className="flex flex-col gap-3">
              {list.map((c) => (
                <li key={c.credit_id ?? `${c.id}-${c.character}-${c.job}`}>
                  <TransitionLink href={`/movie/${c.id}`} className="group flex items-center gap-4 rounded-md p-1 transition-colors hover:bg-reel/5">
                    <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[4px] bg-seat">
                      <TmdbImage path={c.poster_path} kind="poster" alt="" sizes="44px" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold transition-colors group-hover:text-cyan">{c.title}</span>
                      <span className="block truncate text-small text-dim">{c.character ? `as ${c.character}` : c.job}</span>
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
