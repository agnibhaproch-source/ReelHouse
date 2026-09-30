import { ArrowUpRight } from 'lucide-react';
import type { Mood, MoodAccent } from '@/lib/moods';
import { TransitionLink } from '@/components/layout/TransitionLink';
import { cn } from '@/lib/utils';

const ACCENT: Record<MoodAccent, { glow: string; border: string; text: string }> = {
  violet: {
    glow: 'bg-violet',
    border: 'hover:border-violet/60 focus-visible:border-violet',
    text: 'text-violet',
  },
  cyan: {
    glow: 'bg-cyan',
    border: 'hover:border-cyan/60 focus-visible:border-cyan',
    text: 'text-cyan',
  },
  amber: {
    glow: 'bg-amber',
    border: 'hover:border-amber/60 focus-visible:border-amber',
    text: 'text-amber',
  },
  danger: {
    glow: 'bg-danger',
    border: 'hover:border-danger/60 focus-visible:border-danger',
    text: 'text-danger',
  },
  success: {
    glow: 'bg-success',
    border: 'hover:border-success/60 focus-visible:border-success',
    text: 'text-success',
  },
};

/** Mood card: name, one-line pitch and a coloured projector glow that brightens on hover. */
export function MoodTile({ mood, compact = false }: { mood: Mood; compact?: boolean }) {
  const a = ACCENT[mood.accent];
  return (
    <TransitionLink
      href={`/mood/${mood.slug}`}
      className={cn(
        'group/mood rounded-modal border-line bg-seat duration-base relative isolate flex h-full flex-col justify-end overflow-hidden border shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] transition-colors',
        compact ? 'min-h-36 p-5' : 'min-h-48 p-6 md:min-h-56',
        a.border,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'duration-slow ease-reel absolute -top-1/3 -right-1/4 -z-10 aspect-square w-3/4 rounded-full opacity-25 blur-3xl transition-[opacity,scale] group-hover/mood:scale-125 group-hover/mood:opacity-45 group-focus-visible/mood:opacity-45',
          a.glow,
        )}
      />
      <ArrowUpRight
        aria-hidden="true"
        className={cn(
          'duration-base ease-reel absolute top-5 right-5 size-5 opacity-50 transition-[opacity,translate] group-hover/mood:translate-x-0.5 group-hover/mood:-translate-y-0.5 group-hover/mood:opacity-100',
          a.text,
        )}
      />
      <span
        className={cn(
          'font-display block pr-7',
          compact ? 'text-[1.6rem]/[1.05]' : 'text-[clamp(1.9rem,3.6vw,2.6rem)]/[1.05]',
        )}
      >
        {mood.name}
      </span>
      <span className="text-dim text-small mt-2 block max-w-[34ch]">{mood.blurb}</span>
    </TransitionLink>
  );
}
