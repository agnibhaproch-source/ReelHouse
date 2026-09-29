import { TmdbImage } from '@/components/ui/TmdbImage';
import { TransitionLink } from '@/components/layout/TransitionLink';

const FAN = [
  'group-hover/tile:-rotate-[14deg] group-hover/tile:-translate-x-[70%]',
  'group-hover/tile:-translate-y-[6%]',
  'group-hover/tile:rotate-[14deg] group-hover/tile:translate-x-[70%]',
];

/** Typographic genre tile; hover fans 3 posters out behind the word like cards in hand (spec 26). */
export function GenreTile({
  slug,
  name,
  posters,
}: {
  slug: string;
  name: string;
  posters: string[];
}) {
  return (
    <TransitionLink
      href={`/browse/${slug}`}
      className="group/tile rounded-modal border-line bg-seat duration-base hover:border-violet/60 focus-visible:border-violet relative isolate flex h-44 items-end overflow-hidden border p-6 transition-colors md:h-56"
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -z-10 h-[140%] w-[34%] -translate-x-1/2 -translate-y-1/2"
      >
        {posters.map((p, i) => (
          <span
            key={p}
            className={`rounded-poster duration-slow ease-reel absolute inset-0 origin-bottom overflow-hidden opacity-0 shadow-2xl transition-[translate,rotate,opacity] group-hover/tile:opacity-70 group-focus-visible/tile:opacity-70 ${FAN[i] ?? ''}`}
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <TmdbImage path={p} kind="poster" alt="" sizes="160px" />
          </span>
        ))}
      </span>
      <span
        aria-hidden="true"
        className="from-void/90 via-void/30 absolute inset-0 -z-[5] bg-gradient-to-t to-transparent"
      />
      <span className="font-display duration-base text-[clamp(2.2rem,5vw,3.6rem)] leading-none transition-[font-variation-settings] [font-variation-settings:'SOFT'_0,'wght'_600] group-hover/tile:[font-variation-settings:'SOFT'_100,'wght'_800]">
        {name}
      </span>
    </TransitionLink>
  );
}
