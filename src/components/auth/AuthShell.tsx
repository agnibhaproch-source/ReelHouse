import type { ReactNode } from 'react';
import { getTrending } from '@/lib/tmdb/endpoints';
import { safe } from '@/lib/tmdb/safe';
import { PosterWall } from './PosterWall';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { Wordmark } from '@/components/layout/Wordmark';

/** Split screen: poster wall left, glass form panel right (spec 50). */
export async function AuthShell({ children }: { children: ReactNode }) {
  const [a, b] = await Promise.all([safe(getTrending('week', 1)), safe(getTrending('week', 2))]);
  const posters = [...(a.data?.results ?? []), ...(b.data?.results ?? [])]
    .map((m) => m.poster_path)
    .slice(0, 24);
  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <PosterWall posters={posters.length ? posters : Array.from({ length: 18 }, () => null)} />
      </div>
      <div className="px-gutter relative flex items-center justify-center py-16">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <PosterWall posters={posters.slice(0, 12)} />
        </div>
        <div className="rounded-modal border-line bg-aisle/70 w-full max-w-md border p-8 shadow-2xl backdrop-blur-2xl md:p-10">
          <TransitionLink
            href="/"
            className="group/wm mb-8 inline-flex min-h-11 items-center"
            aria-label="Reelhouse home"
          >
            <Wordmark />
          </TransitionLink>
          {children}
        </div>
      </div>
    </div>
  );
}
