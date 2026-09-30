'use client';

import { AnimatePresence, type PanInfo } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASES, DUR, SPRING } from '@/lib/tokens';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLenis } from '@/hooks/useLenis';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { useMediaQuery, QUERIES } from '@/hooks/useMediaQuery';

export type ModalVariant = 'center' | 'sheet' | 'fullscreen';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still labels the dialog). */
  hideTitle?: boolean;
  description?: string;
  /** `center` becomes a bottom sheet on mobile automatically. */
  variant?: ModalVariant;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

/**
 * Modal: focus trap, Esc closes, restores focus, aria-modal, scroll lock via Lenis stop()
 * (spec 14). Mobile sheets drag to dismiss with velocity (spec 62).
 */
export function Modal({
  open,
  onClose,
  title,
  hideTitle,
  description,
  variant = 'center',
  children,
  className,
  showClose = true,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const { stop, start } = useLenis();
  const { reduced } = useMotionPrefs();
  const mobile = useMediaQuery(QUERIES.mobile);
  const effective: ModalVariant = variant === 'center' && mobile ? 'sheet' : variant;
  useFocusTrap(ref, open, onClose);

  useEffect(() => {
    if (!open) return;
    stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      start();
      document.documentElement.style.overflow = prev;
    };
  }, [open, stop, start]);

  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : effective === 'sheet'
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
      : effective === 'fullscreen'
        ? {
            initial: { opacity: 0, scale: 0.98 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.98 },
          }
        : {
            initial: { opacity: 0, y: 24, scale: 0.97 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 12, scale: 0.98 },
          };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-(--z-modal)" data-lenis-prevent>
          <m.div
            aria-hidden="true"
            className="bg-void/80 absolute inset-0 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.base }}
            onClick={onClose}
          />
          <m.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            {...panelMotion}
            transition={effective === 'sheet' ? SPRING : { duration: DUR.base, ease: EASES.reel }}
            drag={effective === 'sheet' && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className={cn(
              'bg-aisle text-reel lit-edge absolute overflow-y-auto outline-none',
              effective === 'center' &&
                'rounded-modal top-1/2 left-1/2 max-h-[88svh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 p-6 md:p-8',
              effective === 'sheet' &&
                'rounded-t-modal inset-x-0 bottom-0 max-h-[90svh] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
              effective === 'fullscreen' && 'bg-void inset-0',
              className,
            )}
          >
            {effective === 'sheet' && (
              <div aria-hidden="true" className="rounded-pill bg-line mx-auto mb-4 h-1 w-10" />
            )}
            <h2
              id={titleId}
              className={cn('font-display text-h3 mb-2 pr-10', hideTitle && 'sr-only')}
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-small text-dim mb-4">
                {description}
              </p>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                data-cursor="link"
                className="text-dim duration-fast hover:bg-reel/10 hover:text-reel absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full transition-colors"
              >
                <X className="duration-base ease-snap size-5 transition-transform hover:rotate-90" />
              </button>
            )}
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
