'use client';

import { GENRES } from '@/lib/tmdb/genres';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

/** Genre wall (spec 32.5): scroll velocity skews the wall; hovering a word lights it. */
export function GenreWall() {
  const { reduced } = useMotionPrefs();
  return (
    <section aria-labelledby="genre-wall" className="px-gutter overflow-hidden py-20">
      <h2 id="genre-wall" className="font-display text-h2 mb-8">
        Pick a genre
      </h2>
      <div
        style={reduced ? undefined : { transform: 'skewX(calc(var(--scroll-velocity) * -10deg))' }}
      >
        <Reveal stagger className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {GENRES.filter((g) => g.slug !== 'tv-movie').map((g, i) => (
            <TransitionLink
              key={g.slug}
              href={`/browse/${g.slug}`}
              className="font-display text-reel/45 duration-base ease-reel hover:text-reel focus-visible:text-reel leading-[1.05] transition-[color,text-shadow,font-variation-settings] [font-variation-settings:'SOFT'_0,'wght'_500] hover:[font-variation-settings:'SOFT'_100,'wght'_800] hover:[text-shadow:0_0_40px_var(--marquee-violet)]"
              style={{ fontSize: `clamp(2rem, ${4 + ((i * 7) % 5)}vw, ${4.5 + ((i * 3) % 4)}rem)` }}
            >
              {g.name}
            </TransitionLink>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
