import { AlertTriangle, FlaskConical } from 'lucide-react';

/** Data-source banner: demo fixtures, or TMDB unavailable (spec 64). */
export function StatusBanner({ kind }: { kind: 'fixtures' | 'down' }) {
  return (
    <div
      role="status"
      className="mx-gutter rounded-modal border-amber/40 bg-amber/10 text-small text-reel relative z-[5] mt-[calc(var(--nav-height)+8px)] flex items-start gap-3 border px-4 py-3"
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
