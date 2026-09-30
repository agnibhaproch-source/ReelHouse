import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  body?: ReactNode;
  action?: { href: string; label: string };
  children?: ReactNode;
}

/** Empty states: say what happened + one clear action (spec 64). */
export function EmptyState({ title, body, action, children }: EmptyStateProps) {
  return (
    <div className="px-gutter mx-auto flex max-w-xl flex-col items-center gap-4 py-20 text-center">
      <svg viewBox="0 0 64 48" className="empty-reel text-line w-24" aria-hidden="true">
        <rect
          x="2"
          y="2"
          width="60"
          height="44"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {[8, 20, 32, 44, 56].map((x) => (
          <g key={x} className="empty-reel-holes">
            <rect x={x - 2} y="5" width="4" height="4" rx="1" fill="currentColor" />
            <rect x={x - 2} y="39" width="4" height="4" rx="1" fill="currentColor" />
          </g>
        ))}
        <path
          d="M14 14h36v20H14z"
          fill="none"
          stroke="var(--marquee-violet)"
          strokeWidth="2"
          strokeDasharray="4 3"
          className="empty-reel-frame"
        />
      </svg>
      <h2 className="font-display text-h3">{title}</h2>
      {body && <p className="text-dim">{body}</p>}
      {action && <Button href={action.href}>{action.label}</Button>}
      {children}
    </div>
  );
}
