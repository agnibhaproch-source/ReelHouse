import type { Cast } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { CastPeek } from './CastPeek';

/**
 * Cast strip (spec 24.3): circular portraits; hover scales 1.08, grayscale → colour, name slides
 * up and the character fades in (spec 33). Click → person page.
 */
export function CastStrip({ cast, movieId }: { cast: Cast[]; movieId: number }) {
  if (!cast.length) return null;
  return (
    <section aria-labelledby="cast-h" className="py-10">
      <SplitHeading id="cast-h" className="px-gutter font-display text-h2 mb-6">
        Cast
      </SplitHeading>
      <Reveal as="ul" stagger className="no-scrollbar px-gutter flex gap-5 overflow-x-auto pb-4">
        {cast.map((c) => (
          <li key={c.credit_id ?? `${c.id}-${c.character}`} className="w-28 shrink-0 md:w-32">
            <CastPeek personId={c.id} excludeMovieId={movieId}>
              <TransitionLink
                href={`/person/${c.id}`}
                className="group/cast rounded-modal flex flex-col items-center gap-3 p-1 text-center"
                data-cursor="link"
              >
                <span className="bg-seat ring-line duration-base ease-reel group-hover/cast:ring-violet relative block size-24 overflow-hidden rounded-full ring-1 transition-[scale,box-shadow] group-hover/cast:scale-108 group-focus-visible/cast:scale-108 md:size-28">
                  <TmdbImage
                    path={c.profile_path}
                    kind="profile"
                    fallbackTitle={c.name}
                    alt=""
                    sizes={SIZES.profile}
                    className="duration-slow grayscale transition-[filter] group-hover/cast:grayscale-0 group-focus-visible/cast:grayscale-0"
                  />
                </span>
                <span className="relative block h-10 w-full overflow-hidden">
                  <span className="text-small duration-base ease-reel block truncate font-semibold transition-transform group-hover/cast:-translate-y-1">
                    {c.name}
                  </span>
                  <span className="text-dim duration-base ease-reel block truncate text-[0.75rem] transition-[opacity,translate] pointer-fine:translate-y-1 pointer-fine:opacity-0 pointer-fine:group-hover/cast:translate-y-0 pointer-fine:group-hover/cast:opacity-100 pointer-fine:group-focus-visible/cast:opacity-100">
                    {c.character || '—'}
                  </span>
                </span>
              </TransitionLink>
            </CastPeek>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
