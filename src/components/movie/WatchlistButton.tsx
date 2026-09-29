'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import type { MovieSnapshot } from '@/lib/data/types';
import { useInWatchlist, useToggleWatchlist } from '@/hooks/useWatchlist';
import { isReducedNow } from '@/hooks/useMotionPrefs';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/lib/tokens';

/** 6 tiny film-frame confetti pieces from the button centre (spec 34). */
function burst(from: HTMLElement) {
  if (isReducedNow()) return;
  const r = from.getBoundingClientRect();
  const colors = [COLORS.violet, COLORS.cyan, COLORS.amber, COLORS.reel];
  for (let i = 0; i < 6; i++) {
    const frame = document.createElement('span');
    Object.assign(frame.style, {
      position: 'fixed',
      left: `${r.left + r.width / 2 - 5}px`,
      top: `${r.top + r.height / 2 - 7}px`,
      width: '10px',
      height: '14px',
      borderRadius: '2px',
      border: `2px solid ${colors[i % colors.length]}`,
      zIndex: 'var(--z-toast)',
      pointerEvents: 'none',
    });
    document.body.appendChild(frame);
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const d = 38 + Math.random() * 26;
    gsap.to(frame, {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      rotation: (Math.random() - 0.5) * 240,
      opacity: 0,
      scale: 0.6,
      duration: 0.7,
      ease: 'reel',
      onComplete: () => frame.remove(),
    });
  }
}

interface WatchlistButtonProps {
  movie: MovieSnapshot;
  variant?: 'secondary' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

/** Plus morphs into a check; add → confetti + toast; remove → undo toast (specs 34, 52). */
export function WatchlistButton({ movie, variant = 'secondary', size = 'md', className, iconOnly }: WatchlistButtonProps) {
  const inList = useInWatchlist(movie.movie_id);
  const toggle = useToggleWatchlist();
  const ref = useRef<HTMLElement>(null);
  const label = inList ? `Remove ${movie.title} from my list` : `Add ${movie.title} to my list`;

  const icon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={inList ? 'M5 12.5 10 17.5 19 7' : 'M12 5v14M5 12h14'} className="transition-[d] duration-base ease-snap" />
    </svg>
  );

  return (
    <Button
      ref={ref}
      variant={iconOnly ? 'icon' : variant}
      size={size}
      icon={icon}
      iconAnim={inList ? 'none' : 'plus'}
      label={label}
      aria-pressed={inList}
      aria-label={iconOnly ? undefined : label}
      disabled={toggle.isPending}
      className={cn(inList && variant !== 'primary' && 'text-cyan', className)}
      onClick={() => {
        if (!inList && ref.current) burst(ref.current);
        toggle.mutate({ movie, add: !inList });
      }}
    >
      {iconOnly ? undefined : inList ? 'In my list' : 'Add to my list'}
    </Button>
  );
}
