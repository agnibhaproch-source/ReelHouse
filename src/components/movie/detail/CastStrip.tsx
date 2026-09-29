import type { Cast } from '@/lib/tmdb/types';
import { SIZES } from '@/lib/tmdb/images';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { SplitHeading } from '@/components/motion/SplitHeading';
import { Reveal } from '@/components/motion/Reveal';
import { TransitionLink } from '@/components/layout/TransitionLink';

/**
 * Cast strip (spec 24.3): circular portraits; hover scales 1.08, grayscale → colour, name slides
 * up and the character fades in (spec 33). Click → person page.
 */
export function CastStrip({ cast }: { cast: Cast[] }) {
  if (!cast.length) return null;
  return (
    <section aria-labelledby="cast-h" className="py-10">
      <SplitHeading id="cast-h" className="mb-6 px-gutter font-display text-h2">
        Cast
      </SplitHeading>
      <Reveal as="ul" stagger className="no-scrollbar flex gap-5 overflow-x-auto px-gutter pb-4" >
        {cast.map((c) => (
          <li key={c.credit_id ?? `${c.id}-${c.character}`} className="w-28 shrink-0 md:w-32">
            <TransitionLink href={`/person/${c.id}`} className="group/cast flex flex-col items-center gap-3 rounded-modal p-1 text-center" data-cursor="link">
              <span className="relative block size-24 overflow-hidden rounded-full bg-seat ring-1 ring-line transition-[scale,box-shadow] duration-base ease-reel group-hover/cast:scale-108 group-hover/cast:ring-violet group-focus-visible/cast:scale-108 md:size-28">
                <TmdbImage path={c.profile_path} kind="profile" alt="" sizes={SIZES.profile} className="grayscale transition-[filter] duration-slow group-hover/cast:grayscale-0 group-focus-visible/cast:grayscale-0" />
              </span>
              <span className="relative block h-10 w-full overflow-hidden">
                <span className="block truncate text-small font-semibold transition-transform duration-base ease-reel group-hover/cast:-translate-y-1">{c.name}</span>
                <span className="block truncate text-[0.75rem] text-dim transition-[opacity,translate] duration-base ease-reel pointer-fine:translate-y-1 pointer-fine:opacity-0 pointer-fine:group-hover/cast:translate-y-0 pointer-fine:group-hover/cast:opacity-100 pointer-fine:group-focus-visible/cast:opacity-100">
                  {c.character || '—'}
                </span>
              </span>
            </TransitionLink>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
