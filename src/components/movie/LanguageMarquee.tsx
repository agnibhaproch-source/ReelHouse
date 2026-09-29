import { LANGUAGES } from '@/lib/tmdb/languages';
import { Marquee } from '@/components/motion/Marquee';
import { TransitionLink } from '@/components/layout/TransitionLink';

/** Two opposing, velocity-reactive marquees of language names (spec 32.6). */
export function LanguageMarquee() {
  const row = (reverse: boolean) =>
    (reverse ? [...LANGUAGES].reverse() : LANGUAGES).map((l) => (
      <TransitionLink
        key={l.code}
        href={`/language/${l.code}`}
        className="group flex items-baseline gap-4 px-6 font-display text-[clamp(2.5rem,7vw,6rem)] leading-none whitespace-nowrap text-reel/30 transition-colors duration-base hover:text-reel"
      >
        {l.native}
        <span className="font-ui text-small text-dim transition-colors group-hover:text-cyan">{l.name}</span>
        <span aria-hidden="true" className="text-violet/60">✦</span>
      </TransitionLink>
    ));
  return (
    <section aria-label="Browse by language" className="flex flex-col gap-4 overflow-hidden py-16">
      <Marquee speed={36} direction={1}>
        {row(false)}
      </Marquee>
      <Marquee speed={36} direction={-1}>
        {row(true)}
      </Marquee>
    </section>
  );
}
