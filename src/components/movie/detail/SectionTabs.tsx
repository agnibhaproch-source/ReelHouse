'use client';

import { useEffect, useState } from 'react';
import * as m from 'motion/react-m';
import { useUiStore } from '@/stores/ui';
import { useLenis } from '@/hooks/useLenis';
import { SPRING } from '@/lib/tokens';
import { cn } from '@/lib/utils';

const TABS: { id: string; label: string }[] = [
  { id: 'overview-h', label: 'Overview' },
  { id: 'cast-h', label: 'Cast' },
  { id: 'videos-h', label: 'Trailers' },
  { id: 'facts-h', label: 'Details' },
  { id: 'providers-h', label: 'Where to watch' },
  { id: 'reviews-h', label: 'Reviews' },
  { id: 'gallery-h', label: 'Gallery' },
  { id: 'more-like-this', label: 'More like this' },
];

/**
 * Sticky section bar for the film page: only lists sections that exist, highlights the one in
 * view (sliding pill), and tucks under the navbar or rides to the top when the navbar hides.
 */
export function SectionTabs() {
  const [present, setPresent] = useState<typeof TABS>([]);
  const [active, setActive] = useState<string | null>(null);
  const navHidden = useUiStore((s) => s.navHidden);
  const { scrollTo } = useLenis();

  useEffect(() => {
    const found = TABS.filter((t) => document.getElementById(t.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sections are server-rendered; read once on mount
    setPresent(found);
    const targets = found
      .map(
        (t) => document.getElementById(t.id)?.closest('section') ?? document.getElementById(t.id),
      )
      .filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = top?.target.querySelector('[id]')?.id ?? top?.target.id;
        if (id) setActive(found.find((t) => t.id === id)?.id ?? null);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  if (present.length < 3) return null;
  return (
    <nav
      aria-label="On this page"
      className={cn(
        'border-line bg-void/80 duration-base ease-reel sticky z-30 -mt-px border-y backdrop-blur-xl transition-[top]',
        navHidden ? 'top-0' : 'top-(--nav-height)',
      )}
    >
      <ul className="px-gutter no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto">
        {present.map((t) => (
          <li key={t.id} className="relative shrink-0">
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? 'location' : undefined}
              onClick={(e) => {
                const el = document.getElementById(t.id);
                if (!el) return;
                e.preventDefault();
                scrollTo(el, { offset: -140, duration: 1.1 });
                setActive(t.id);
              }}
              className={cn(
                'text-small duration-fast relative z-[1] inline-flex min-h-12 items-center px-4 font-semibold whitespace-nowrap transition-colors',
                active === t.id ? 'text-reel' : 'text-dim hover:text-reel',
              )}
            >
              {t.label}
            </a>
            {active === t.id && (
              <m.span
                layoutId="section-tab"
                transition={SPRING}
                aria-hidden="true"
                className="bg-violet absolute inset-x-3 bottom-0 h-0.5 rounded-full"
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
