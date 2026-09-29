'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASES, DUR, STAGGER } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { TmdbImage } from '@/components/ui/TmdbImage';
import type { Movie, Paginated } from '@/lib/tmdb/types';
import { TransitionLink } from './TransitionLink';
import { RollText } from '@/components/motion/RollText';

export interface MegaItem {
  href: string;
  label: string;
  sub?: string;
  /** discover params for the poster collage */
  params: Record<string, string | number>;
}

function Collage({ params }: { params: Record<string, string | number> }) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const { data } = useQuery({
    queryKey: ['collage', qs],
    queryFn: async () => {
      const res = await fetch(`/api/tmdb/discover/movie?${qs}`);
      if (!res.ok) throw new Error('collage');
      return (await res.json()) as Paginated<Movie>;
    },
    staleTime: 60 * 60_000,
  });
  const posters = (data?.results ?? []).filter((m) => m.poster_path).slice(0, 3);
  return (
    <div className="relative h-full min-h-56" aria-hidden="true">
      <AnimatePresence>
        {posters.map((m, i) => (
          <motion.div
            key={`${qs}-${m.id}`}
            className="absolute top-1/2 left-1/2 aspect-[2/3] w-28 overflow-hidden rounded-poster shadow-2xl"
            initial={{ opacity: 0, rotate: 0, x: '-50%', y: '-40%' }}
            animate={{ opacity: 1, rotate: (i - 1) * 9, x: `${-50 + (i - 1) * 42}%`, y: `${-50 + Math.abs(i - 1) * 6}%` }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.slow, ease: EASES.reel, delay: i * 0.06 }}
          >
            <TmdbImage path={m.poster_path} kind="poster" alt="" sizes="112px" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MegaMenuProps {
  label: string;
  items: MegaItem[];
  active?: boolean;
  seeAll?: { href: string; label: string };
}

/**
 * Mega menu (spec 20): shutter-wipe open (clip-path from top), items stagger 40ms, hovered item
 * shows a poster collage. Keyboard: Enter/Space/↓ open, arrows move, Home/End, Esc closes.
 */
export function MegaMenu({ label, items, active, seeAll }: MegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(0);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const panel = document.getElementById(id);
      if (!panel?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open, id]);

  const focusItem = (i: number) => {
    const n = items.length;
    const idx = (i + n) % n;
    setHot(idx);
    itemRefs.current[idx]?.focus();
  };

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || ((e.key === 'Enter' || e.key === ' ') && !open)) {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    } else if (e.key === 'Escape') setOpen(false);
  };

  const cols = 3;
  const onItemKey = (e: KeyboardEvent, i: number) => {
    const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: items.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      if (e.key === 'ArrowUp' && i < cols) {
        trigger.current?.focus();
        return;
      }
      focusItem(Math.min(items.length - 1, Math.max(0, moves[e.key] as number)));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const enter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 120);
  };
  const leave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div className="static" onPointerEnter={enter} onPointerLeave={leave}>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        data-cursor="link"
        className={cn('roll-parent relative flex min-h-11 items-center gap-1 px-3 text-small font-semibold transition-colors duration-fast', active || open ? 'text-reel' : 'text-reel/75 hover:text-reel')}
      >
        <RollText>{label}</RollText>
        <ChevronDown className={cn('size-3.5 transition-transform duration-base ease-reel', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-label={label}
            className="absolute inset-x-0 top-full border-b border-line bg-void/95 backdrop-blur-xl"
            initial={reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={reduced ? { opacity: 0 } : { clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: DUR.fast, ease: EASES.shutter } }}
            transition={{ duration: DUR.base, ease: EASES.projector }}
            data-lenis-prevent
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[1fr_280px] gap-10 px-gutter py-8">
              <ul className="grid grid-cols-3 gap-x-6 gap-y-1">
                {items.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, STAGGER.maxItems) * STAGGER.base + 0.1, duration: DUR.base, ease: EASES.reel }}
                  >
                    <TransitionLink
                      ref={(n) => {
                        itemRefs.current[i] = n;
                      }}
                      href={item.href}
                      onKeyDown={(e) => onItemKey(e, i)}
                      onPointerEnter={() => setHot(i)}
                      onFocus={() => setHot(i)}
                      onClick={() => setOpen(false)}
                      className="group/item flex min-h-11 items-baseline gap-2 rounded-md px-2 py-2 font-display text-h3 text-reel/80 transition-colors duration-fast hover:text-reel focus-visible:text-reel"
                    >
                      <span className="transition-transform duration-base ease-reel group-hover/item:translate-x-1">{item.label}</span>
                      {item.sub && <span className="font-ui text-small text-dim">{item.sub}</span>}
                    </TransitionLink>
                  </motion.li>
                ))}
                {seeAll && (
                  <li className="col-span-3 mt-3">
                    <TransitionLink href={seeAll.href} onClick={() => setOpen(false)} className="text-small font-semibold text-cyan hover:underline">
                      {seeAll.label} →
                    </TransitionLink>
                  </li>
                )}
              </ul>
              {items[hot] && <Collage params={items[hot].params} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
