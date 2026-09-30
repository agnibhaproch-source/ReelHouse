import { MOODS } from '@/lib/moods';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { MoodTile } from './MoodTile';

/** Home entry point into mood browse: five moods and a link to the rest. */
export function MoodStrip() {
  return (
    <section aria-labelledby="moods-heading" className="px-gutter cv-auto my-16 md:my-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="moods-heading" className="font-display text-h2">
          What’s the mood?
        </h2>
        <TransitionLink
          href="/browse#moods"
          className="text-small text-dim hover:text-reel duration-fast shrink-0 transition-colors"
        >
          All moods
        </TransitionLink>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {MOODS.slice(0, 5).map((m, i) => (
          <li key={m.slug} className={i === 4 ? 'max-md:hidden' : undefined}>
            <MoodTile mood={m} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
