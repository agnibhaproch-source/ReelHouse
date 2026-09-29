'use client';

import * as m from 'motion/react-m';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useUiStore } from '@/stores/ui';
import { EASES, DUR } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

/** Search icon morphs into an expanding input pill (scaleX wrapper + clip-path), then opens the palette. */
export function SearchTrigger() {
  const set = useUiStore((s) => s.set);
  const [morph, setMorph] = useState(false);
  const { reduced } = useMotionPrefs();

  const open = () => {
    if (reduced) return set('searchOpen', true);
    setMorph(true);
    setTimeout(() => {
      set('searchOpen', true);
      setMorph(false);
    }, 280);
  };

  return (
    <div className="relative size-11">
      <m.span
        aria-hidden="true"
        className="rounded-pill border-line bg-aisle absolute top-0 right-0 h-11 w-56 origin-right border"
        initial={false}
        animate={
          morph
            ? { scaleX: 1, clipPath: 'inset(0% 0% 0% 0% round 999px)', opacity: 1 }
            : { scaleX: 0.2, clipPath: 'inset(0% 0% 0% 80% round 999px)', opacity: 0 }
        }
        transition={{ duration: DUR.fast, ease: EASES.reel }}
      />
      <button
        type="button"
        onClick={open}
        aria-label="Search (press / or ⌘K)"
        aria-keyshortcuts="/ Control+K Meta+K"
        data-cursor="link"
        className="group text-reel duration-fast hover:bg-reel/10 relative grid size-11 place-items-center rounded-full transition-colors"
      >
        <Search
          className="duration-base ease-snap size-5 transition-transform group-hover:scale-110"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
