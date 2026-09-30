import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { interpret } from '@/lib/nl-search.server';
import { interpretationChips, interpretationToQuery, isEmptyInterpretation } from '@/lib/nl-search';
import { discover } from '@/lib/tmdb/endpoints';
import { withMeta } from '@/lib/tmdb/meta';
import { safe } from '@/lib/tmdb/safe';
import { getRequestPrefs } from '@/lib/prefs.server';
import { DiscoverGrid } from '@/components/movie/DiscoverGrid';
import { AskForm } from '@/components/movie/AskForm';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/layout/EmptyState';
import { StatusBanner } from '@/components/layout/StatusBanner';

type Props = { searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = {
  title: 'Describe what you want to watch',
  description:
    'Say it in your own words — “a slow-burn Korean thriller under two hours” — and get films.',
  robots: { index: false },
};

const EXAMPLES = [
  'A slow-burn Korean thriller under two hours',
  'Feel-good Bollywood comedy, nothing scary',
  'Acclaimed sci-fi from the 90s',
  'Short animated films for a family night',
];

/** Natural-language search: the description becomes filters you can see and adjust. */
export default async function AskPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 200);
  const prefs = await getRequestPrefs();
  const result = q ? await interpret(q) : null;
  const understood = result && !isEmptyInterpretation(result.interpretation);
  const query = understood ? interpretationToQuery(result.interpretation) : null;
  const first = query
    ? await safe(
        discover({ sort: 'popularity.desc', raw: query }, prefs).then(async (p) => ({
          ...p,
          results: await withMeta(p.results),
        })),
      )
    : null;

  return (
    <div className="pt-32">
      <header className="px-gutter mx-auto mb-10 max-w-4xl">
        <p className="meta-caps text-dim flex items-center gap-2">
          <Sparkles className="text-violet size-4" aria-hidden="true" /> Ask Reelhouse
        </p>
        <h1 className="font-display text-h1 mt-2">What are you in the mood for?</h1>
        <AskForm initial={q} examples={q ? [] : EXAMPLES} />
        {result && understood && (
          <div className="mt-6 flex flex-wrap items-center gap-2" aria-live="polite">
            <span className="text-small text-dim">Understood as</span>
            {interpretationChips(result.interpretation).map((c) => (
              <span
                key={c}
                className="rounded-pill border-violet/40 bg-violet/10 text-small border px-3 py-1"
              >
                {c}
              </span>
            ))}
            <span className="text-dim text-[0.75rem]">
              {result.source === 'ai' ? '· interpreted by Claude' : '· keyword match'}
            </span>
          </div>
        )}
      </header>
      {q && !understood && (
        <EmptyState
          title="We couldn’t turn that into filters."
          body="Try naming a genre, a language, a decade or a length — or search by title instead."
          action={{ href: `/search?q=${encodeURIComponent(q)}`, label: 'Search titles' }}
        />
      )}
      {first?.error && <StatusBanner kind="down" />}
      {query && (
        <Suspense
          fallback={
            <div className="px-gutter">
              <GridSkeleton count={18} />
            </div>
          }
        >
          <DiscoverGrid
            key={q}
            fixed={{ extra: query }}
            initial={first?.data ?? undefined}
            label={`Films for “${q}”`}
            emptyBody="Nothing fits all of that. Try describing it more loosely — fewer genres, or no length limit."
          />
        </Suspense>
      )}
    </div>
  );
}
