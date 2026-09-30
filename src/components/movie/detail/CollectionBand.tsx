import { Layers } from 'lucide-react';
import type { MovieDetail } from '@/lib/tmdb/types';
import { fallbackGlow } from '@/lib/tmdb/color';
import { TmdbImage } from '@/components/ui/TmdbImage';
import { Button } from '@/components/ui/Button';

/** "Part of the … collection" band on a film's page, linking to the collection timeline. */
export function CollectionBand({
  collection,
}: {
  collection: NonNullable<MovieDetail['belongs_to_collection']>;
}) {
  const glow = fallbackGlow(collection.name);
  return (
    <section aria-labelledby="collection-h" className="px-gutter py-10">
      <div className="rounded-modal border-line lit-edge relative isolate overflow-hidden border">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {collection.backdrop_path ? (
            <TmdbImage path={collection.backdrop_path} kind="backdrop" alt="" sizes="100vw" plain />
          ) : (
            <span
              className="absolute inset-0"
              style={{
                background: `radial-gradient(80% 140% at 85% 50%, color-mix(in oklab, ${glow} 40%, transparent), transparent 70%)`,
              }}
            />
          )}
          <span className="from-void via-void/85 absolute inset-0 bg-gradient-to-r to-transparent" />
        </div>
        <div className="flex flex-col items-start gap-4 p-6 md:p-10">
          <p className="meta-caps text-dim flex items-center gap-2">
            <Layers className="size-4" aria-hidden="true" /> Part of a collection
          </p>
          <h2 id="collection-h" className="font-display text-h2 max-w-xl">
            {collection.name}
          </h2>
          <Button href={`/collection/${collection.id}`} variant="secondary">
            See every film in order
          </Button>
        </div>
      </div>
    </section>
  );
}
