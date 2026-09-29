'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { EASES, DUR } from './tokens';
import { bezier } from './bezier';

let registered = false;

/** Registers ScrollTrigger + the named token eases (projector, reel, shutter, snap). */
export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  for (const [name, curve] of Object.entries(EASES)) gsap.registerEase(name, bezier(curve));
  gsap.defaults({ ease: 'reel', duration: DUR.base });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

registerGsap();

export { gsap, ScrollTrigger, useGSAP };
