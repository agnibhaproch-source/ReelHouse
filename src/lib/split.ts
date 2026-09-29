'use client';

import type { SplitText as SplitTextT } from 'gsap/SplitText';
import { gsap } from './gsap';

export type SplitTextClass = typeof SplitTextT;

let loading: Promise<SplitTextClass> | null = null;

/** SplitText is loaded on demand (spec 61: "SplitText only on client", plugins imported where used). */
export function loadSplitText(): Promise<SplitTextClass> {
  loading ??= import('gsap/SplitText').then(({ SplitText }) => {
    gsap.registerPlugin(SplitText);
    return SplitText;
  });
  return loading;
}
