/** Deterministic brand-palette glow for titles without artwork. */
const PALETTE = ['#8b5cff', '#3fe0ff', '#ffb547', '#ff4d6d', '#46e39a', '#6c7bff'] as const;

export function fallbackGlow(seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length] as string;
}

/** hex → "r g b" for use in rgb(var(--x) / a). */
export function hexToRgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '139 92 255';
  const n = Number.parseInt(m[1] as string, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
