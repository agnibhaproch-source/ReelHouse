'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Fires `onIntent` after the pointer rests `delay` ms; cancelled on leave. */
export function useHoverIntent(onIntent: () => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef(onIntent);
  useEffect(() => {
    cb.current = onIntent;
  });
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const start = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => cb.current(), delay);
  }, [cancel, delay]);
  useEffect(() => cancel, [cancel]);
  return { start, cancel };
}
