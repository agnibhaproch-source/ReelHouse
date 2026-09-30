import { AlertTriangle, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Data-source banner: demo fixtures, or TMDB unavailable (spec 64). `floating` lays it over a
 * full-height hero instead of pushing the hero below the fold.
 */
export function StatusBanner({
  kind,
  floating = false,
}: {
  kind: 'fixtures' | 'down';
  floating?: boolean;
}) {
  return (
    <div
      role="status"
      className={cn(
        'mx-gutter rounded-modal border-amber/40 text-small text-reel z-[5] flex items-start gap-3 border px-4 py-3',
        floating
          ? 'bg-void/70 absolute inset-x-0 top-[calc(var(--nav-height)+8px)] backdrop-blur-md'
          : 'bg-amber/10 relative mt-[calc(var(--nav-height)+8px)]',
      )}
    >
      {kind === 'fixtures' ? (
        <FlaskConical className="text-amber mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertTriangle className="text-amber mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <p>
        {kind === 'fixtures' ? (
          <>
            Running on demo data. Add{' '}
            <code className="bg-void/60 rounded px-1">TMDB_READ_TOKEN</code> to{' '}
            <code className="bg-void/60 rounded px-1">.env.local</code> to load real movies, posters
            and trailers.
          </>
        ) : (
          'Showing saved results. Live data is unavailable right now.'
        )}
      </p>
    </div>
  );
}
