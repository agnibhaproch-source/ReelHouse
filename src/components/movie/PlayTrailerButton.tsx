'use client';

import { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { MovieSnapshot } from '@/lib/data/types';
import type { Video } from '@/lib/tmdb/types';
import { useTrailerStore } from '@/stores/trailer';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

interface Props {
  movie: MovieSnapshot;
  videos?: Video[];
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'icon';
  label?: string;
}

/** Label slides out, reel spins, then the letterbox transition opens the player (spec 34). */
export function PlayTrailerButton({
  movie,
  videos,
  color,
  size = 'md',
  variant = 'primary',
  label = 'Play trailer',
}: Props) {
  const open = useTrailerStore((s) => s.open);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLElement>(null);
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      loading={loading}
      label={variant === 'icon' ? `${label}: ${movie.title}` : undefined}
      icon={<Play fill="currentColor" />}
      data-cursor-label="Play"
      onClick={() => {
        setLoading(true);
        track('trailer_play', { movie_id: movie.movie_id });
        setTimeout(() => {
          open(movie, { videos, origin: ref.current?.getBoundingClientRect() ?? null, color });
          setLoading(false);
        }, 260);
      }}
    >
      {variant === 'icon' ? undefined : label}
    </Button>
  );
}
