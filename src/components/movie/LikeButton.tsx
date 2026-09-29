'use client';

import { useRef } from 'react';
import { Heart } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';
import { useMyRating, useSetRating } from '@/hooks/useRatings';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { Button } from '@/components/ui/Button';

/** "Like" = a 5-star rating shortcut; heart beats on hover, bursts on like (specs 33, 55). */
export function LikeButton({ movieId, title, size = 'md' }: { movieId: number; title: string; size?: 'sm' | 'md' }) {
  const rating = useMyRating(movieId);
  const set = useSetRating(movieId);
  const liked = rating !== null && rating >= 8;
  const ref = useRef<HTMLElement>(null);
  return (
    <Button
      ref={ref}
      variant="icon"
      size={size}
      iconAnim="heart"
      label={liked ? `Unlike ${title}` : `Like ${title}`}
      aria-pressed={liked}
      className={cn(liked && 'text-danger')}
      icon={<Heart fill={liked ? 'currentColor' : 'none'} />}
      onClick={() => {
        const svg = ref.current?.querySelector('svg');
        if (!liked && svg && !isReducedNow()) {
          gsap.fromTo(svg, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.4)' });
        }
        set.mutate(liked ? null : 10);
      }}
    />
  );
}
