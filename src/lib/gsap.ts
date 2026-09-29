'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { EASES, DUR } from './tokens';

let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  for (const [name, [a, b, c, d]] of Object.entries(EASES)) {
    CustomEase.create(name, `M0,0 C${a},${b} ${c},${d} 1,1`);
  }
  gsap.defaults({ ease: 'reel', duration: DUR.base });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

registerGsap();

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
