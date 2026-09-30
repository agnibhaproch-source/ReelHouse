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

// --- Per-film accent (OKLCH) ---------------------------------------------------------------

const VIOLET = '#8b5cff';
const ACCENT_L = 0.74;

type Oklch = { l: number; c: number; h: number };

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function hexToOklch(hex: string): Oklch | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1] as string, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) =>
    srgbToLinear(x / 255),
  ) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** OKLCH → linear sRGB; null when out of gamut. */
function oklchToRgb({ l: L, c, h }: Oklch): [number, number, number] | null {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ] as [number, number, number];
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4) ? rgb : null;
}

/**
 * A legible accent derived from a poster's dominant colour: same hue, fixed lightness and a
 * clamped chroma, so it works as a button fill (dark text) and a focus ring on --bg-void.
 * Near-grey posters have no meaningful hue and keep the brand violet.
 */
export function filmAccent(hex: string | null | undefined): string {
  const src = hex ? hexToOklch(hex) : null;
  if (!src || src.c < 0.035) return VIOLET;
  let c = Math.min(Math.max(src.c * 1.5, 0.11), 0.19);
  let rgb = oklchToRgb({ l: ACCENT_L, c, h: src.h });
  while (!rgb && c > 0.02) {
    c -= 0.01;
    rgb = oklchToRgb({ l: ACCENT_L, c, h: src.h });
  }
  if (!rgb) return VIOLET;
  return `#${rgb
    .map((v) => Math.round(linearToSrgb(Math.min(Math.max(v, 0), 1)) * 255))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}
