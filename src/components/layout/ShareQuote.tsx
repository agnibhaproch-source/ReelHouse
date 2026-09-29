'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { toast } from '@/stores/toast';
import { SPRING } from '@/lib/tokens';

/** Selecting text inside `[data-quotable]` on a detail page shows a tiny "Share quote" pill (spec 39). */
export function ShareQuote() {
  const pathname = usePathname();
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const enabled = pathname.startsWith('/movie/') || pathname.startsWith('/person/');

  useEffect(() => {
    if (!enabled) return;
    const onUp = () => {
      requestAnimationFrame(() => {
        const s = window.getSelection();
        const text = s?.toString().trim() ?? '';
        const anchor = s?.anchorNode?.parentElement;
        if (!s || s.rangeCount === 0 || text.length < 12 || !anchor?.closest('[data-quotable]')) {
          setSel(null);
          return;
        }
        const r = s.getRangeAt(0).getBoundingClientRect();
        setSel({ text: text.slice(0, 280), x: r.left + r.width / 2, y: r.top + window.scrollY });
      });
    };
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-share-quote]')) setSel(null);
    };
    document.addEventListener('pointerup', onUp);
    document.addEventListener('keyup', onUp);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('keyup', onUp);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [enabled]);

  const share = async () => {
    if (!sel) return;
    const payload = `“${sel.text}” — ${document.title}\n${window.location.href}`;
    try {
      if (navigator.share)
        await navigator.share({
          text: `“${sel.text}”`,
          url: window.location.href,
          title: document.title,
        });
      else {
        await navigator.clipboard.writeText(payload);
        toast.success('Quote copied');
      }
    } catch {
      /* user cancelled */
    }
    setSel(null);
  };

  return (
    <AnimatePresence>
      {enabled && sel && (
        <m.button
          key="share-quote"
          type="button"
          data-share-quote
          onClick={() => void share()}
          className="rounded-pill bg-violet text-small text-void absolute z-(--z-toast) flex min-h-9 -translate-x-1/2 -translate-y-full items-center gap-1.5 px-3 font-bold shadow-xl"
          style={{ left: sel.x, top: sel.y - 10 }}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={SPRING}
        >
          <Quote className="size-3.5" aria-hidden="true" /> Share quote
        </m.button>
      )}
    </AnimatePresence>
  );
}
