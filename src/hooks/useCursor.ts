'use client';

import type { HTMLAttributes } from 'react';
import type { CursorMode } from '@/stores/cursor';

/** Spread onto an element to opt into a cursor mode via event delegation (spec 30). */
export function cursorProps(
  mode: CursorMode,
  label?: string,
): HTMLAttributes<HTMLElement> & Record<`data-${string}`, string> {
  return label ? { 'data-cursor': mode, 'data-cursor-label': label } : { 'data-cursor': mode };
}
