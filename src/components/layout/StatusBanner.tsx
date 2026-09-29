import { AlertTriangle, FlaskConical } from 'lucide-react';

/** Data-source banner: demo fixtures, or TMDB unavailable (spec 64). */
export function StatusBanner({ kind }: { kind: 'fixtures' | 'down' }) {
  return (
    <div role="status" className="relative z-[5] mx-gutter mt-[calc(var(--nav-height)+8px)] flex items-start gap-3 rounded-modal border border-amber/40 bg-amber/10 px-4 py-3 text-small text-reel">
      {kind === 'fixtures' ? <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />}
      <p>
        {kind === 'fixtures' ? (
          <>
            Running on demo data. Add <code className="rounded bg-void/60 px-1">TMDB_READ_TOKEN</code> to <code className="rounded bg-void/60 px-1">.env.local</code> to load real movies, posters and trailers.
          </>
        ) : (
          'Showing saved results. Live data is unavailable right now.'
        )}
      </p>
    </div>
  );
}
