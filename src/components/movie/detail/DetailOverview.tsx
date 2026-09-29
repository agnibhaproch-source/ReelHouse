import { ScrubText } from '@/components/motion/ScrubText';
import { SplitHeading } from '@/components/motion/SplitHeading';

/** Large Fraunces overview that brightens word-by-word with scroll (spec 24.2). */
export function DetailOverview({ overview, tagline }: { overview: string; tagline: string | null }) {
  if (!overview) return null;
  return (
    <section aria-labelledby="overview-h" className="mx-auto max-w-5xl px-gutter py-20 md:py-28" data-quotable>
      <SplitHeading id="overview-h" as="h2" className="mb-6 font-ui text-small font-bold tracking-normal text-dim">
        Overview
      </SplitHeading>
      <ScrubText text={overview} className="font-display text-[clamp(1.5rem,3.4vw,2.9rem)] leading-[1.2] [font-variation-settings:'SOFT'_50,'opsz'_72]" />
      {tagline && <p className="sr-only">{tagline}</p>}
    </section>
  );
}
