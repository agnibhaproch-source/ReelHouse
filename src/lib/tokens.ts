/**
 * JS mirror of src/styles/tokens.css (motion + color values GSAP/WebGL need as numbers).
 * tests/unit/tokens.test.ts fails if these drift from the CSS.
 */
export const EASES = {
  projector: [0.77, 0, 0.175, 1],
  reel: [0.16, 1, 0.3, 1],
  shutter: [0.7, 0, 0.84, 0],
  snap: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EaseName = keyof typeof EASES;

/** Durations in milliseconds. */
export const DUR_MS = {
  instant: 120,
  fast: 220,
  base: 400,
  slow: 700,
  cinematic: 1200,
} as const;

/** Durations in seconds (GSAP). */
export const DUR = {
  instant: DUR_MS.instant / 1000,
  fast: DUR_MS.fast / 1000,
  base: DUR_MS.base / 1000,
  slow: DUR_MS.slow / 1000,
  cinematic: DUR_MS.cinematic / 1000,
} as const;

export const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;

export const COLORS = {
  void: '#08080d',
  seat: '#12121a',
  aisle: '#1c1c27',
  line: '#2a2a3a',
  reel: '#ede8df',
  dim: '#8c8a9b',
  violet: '#8b5cff',
  cyan: '#3fe0ff',
  amber: '#ffb547',
  danger: '#ff4d6d',
} as const;

/** Stagger budget from the motion language. */
export const STAGGER = { tight: 0.03, base: 0.04, loose: 0.06, maxItems: 8 } as const;

export const cssEase = (name: EaseName): string => `cubic-bezier(${EASES[name].join(', ')})`;
