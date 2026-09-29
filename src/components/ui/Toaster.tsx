'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, WifiOff } from 'lucide-react';
import { useToastStore, type Toast as ToastT } from '@/stores/toast';
import { SPRING, DUR } from '@/lib/tokens';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { cn } from '@/lib/utils';
import { FilmReelSpinner } from './FilmReelSpinner';

function ToastItem({ t }: { t: ToastT }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { reduced } = useMotionPrefs();
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), t.duration + (t.action ? 2000 : 0));
    return () => clearTimeout(id);
  }, [t, dismiss]);
  const Icon =
    t.icon === 'offline'
      ? WifiOff
      : t.kind === 'success'
        ? CheckCircle2
        : t.kind === 'error'
          ? AlertCircle
          : Info;
  return (
    <m.li
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: DUR.fast } }}
      transition={SPRING}
      className={cn(
        'rounded-modal border-line bg-seat/95 pointer-events-auto flex max-w-[92vw] min-w-72 items-center gap-3 border px-4 py-3 shadow-2xl backdrop-blur-md',
        t.kind === 'error' && 'border-danger/60',
      )}
    >
      {t.icon === 'reel' || t.icon === 'offline' ? (
        <span className="text-amber relative">
          <FilmReelSpinner className="size-5 [animation-duration:2.4s] [animation-iteration-count:2] [animation-timing-function:var(--ease-shutter)]" />
          {t.icon === 'offline' && (
            <Icon className="text-danger absolute -right-2 -bottom-1 size-3" aria-hidden="true" />
          )}
        </span>
      ) : (
        <Icon
          className={cn(
            'size-5 shrink-0',
            t.kind === 'success'
              ? 'text-success'
              : t.kind === 'error'
                ? 'text-danger'
                : 'text-cyan',
          )}
          aria-hidden="true"
        />
      )}
      <p className="text-small flex-1">{t.message}</p>
      {t.action && (
        <button
          type="button"
          data-cursor="link"
          className="rounded-pill text-small text-cyan hover:bg-cyan/10 min-h-11 px-3 font-bold"
          onClick={() => {
            t.action?.onAction();
            dismiss(t.id);
          }}
        >
          {t.action.label}
        </button>
      )}
    </m.li>
  );
}

/** Toast stack — success, error, info; enter/exit animated; announced politely. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-(--z-toast) max-md:bottom-24 max-md:left-4"
    >
      <ul className="flex flex-col items-end gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
