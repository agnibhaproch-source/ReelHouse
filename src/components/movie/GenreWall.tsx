'use client';

import { GENRES } from '@/lib/tmdb/genres';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

/** Genre wall (spec 32.5): scroll velocity skews the wall; hovering a word lights it. */
export function GenreWall() {
  const { reduced } = useMotionPrefs();
  return (
    <section aria-labelledby="genre-wall" className="overflow-hidden px-gutter py-20">
      <h2 id="genre-wall" className="mb-8 font-display text-h2">
        Pick a genre
      </h2>
      <div style={reduced ? undefined : { transform: 'skewX(calc(var(--scroll-velocity) * -10deg))' }}>
      <Reveal stagger className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        {GENRES.filter((g) => g.slug !== 'tv-movie').map((g, i) => (
          <TransitionLink
            key={g.slug}
            href={`/browse/${g.slug}`}
            className="font-display leading-[1.05] text-reel/25 transition-[color,text-shadow,font-variation-settings] duration-base ease-reel [font-variation-settings:'SOFT'_0,'wght'_500] hover:text-reel hover:[font-variation-settings:'SOFT'_100,'wght'_800] hover:[text-shadow:0_0_40px_var(--marquee-violet)] focus-visible:text-reel"
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
