import { cn } from '@/lib/utils';

/**
 * Required TMDB attribution (spec 11). Drop the official logo from
 * https://www.themoviedb.org/about/logos-attribution into /public/tmdb-logo.svg and swap the badge
 * for an <img> — the badge below is a neutral stand-in, not TMDB branding.
 */
export function TmdbAttribution({ className }: { className?: string }) {
  return (
    <div
      className={cn('text-small text-dim flex max-w-sm items-start gap-3 md:text-right', className)}
    >
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noreferrer"
        className="border-cyan/40 text-cyan shrink-0 rounded-md border px-2 py-1 font-extrabold tracking-wider md:order-last"
        aria-label="The Movie Database (TMDB) — opens in a new tab"
      >
        TMDB
      </a>
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </div>
  );
}
