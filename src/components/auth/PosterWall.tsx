'use client';

import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';

/** Slow wall of posters: 3 columns scrolling in opposite directions, tilted −8° (spec 50). */
export function PosterWall({ posters }: { posters: (string | null)[] }) {
  const { reduced } = useMotionPrefs();
  const cols = [0, 1, 2].map((c) => posters.filter((_, i) => i % 3 === c));
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute -inset-[20%] flex -rotate-[8deg] justify-center gap-4">
        {cols.map((col, c) => (
          <div key={c} className="flex w-1/3 max-w-60 flex-col">
            <div
              className="flex flex-col gap-4"
              style={reduced ? undefined : { animation: `wall-${c % 2 ? 'down' : 'up'} ${60 + c * 12}s linear infinite` }}
            >
              {[...col, ...col].map((p, i) => (
                <div key={i} className="relative aspect-[2/3] w-full overflow-hidden rounded-poster bg-seat">
                  <TmdbImage path={p} kind="poster" alt="" sizes="240px" loading={i < 4 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-void/40 via-void/60 to-void" />
    </div>
  );
}
