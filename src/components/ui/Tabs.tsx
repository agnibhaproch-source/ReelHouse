'use client';

import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/tokens';

export interface TabItem {
  id: string;
  label: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  /** Set false when the tabs don't control TabPanels (e.g. a filter-style switcher). */
  controlsPanels?: boolean;
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
  idPrefix?: string;
}

/** Tablist with a sliding active indicator (Motion layoutId) and arrow-key navigation. */
export function Tabs({
  items,
  value,
  onChange,
  label,
  className,
  idPrefix,
  controlsPanels = true,
}: TabsProps) {
  const auto = useId();
  const prefix = idPrefix ?? auto;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % n
        : e.key === 'ArrowLeft'
          ? (i - 1 + n) % n
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'no-scrollbar border-line relative flex gap-1 overflow-x-auto border-b',
        className,
      )}
    >
      {items.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(n) => {
              refs.current[i] = n;
            }}
            role="tab"
            type="button"
            id={`${prefix}-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={controlsPanels ? `${prefix}-panel-${t.id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            data-cursor="link"
            className={cn(
              'text-small duration-fast relative min-h-11 px-4 py-3 font-semibold whitespace-nowrap transition-colors',
              selected ? 'text-reel' : 'text-dim hover:text-reel',
            )}
          >
            {t.label}
            {selected && (
              <motion.span
                layoutId={`${prefix}-indicator`}
                transition={SPRING}
                className="rounded-pill bg-cyan absolute inset-x-2 -bottom-px h-0.5"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  value,
  prefix,
  children,
  className,
}: {
  id: string;
  value: string;
  prefix: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${prefix}-panel-${id}`}
      aria-labelledby={`${prefix}-tab-${id}`}
      tabIndex={0}
      hidden={id !== value}
      className={className}
    >
      {children}
    </div>
  );
}
