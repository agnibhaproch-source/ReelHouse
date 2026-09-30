/**
 * Original generated artwork for the built-in catalogue: posters, backdrops, stills and
 * director portraits as SVG. Deterministic per film (same film → same art), composed from its
 * genres, title, year and director. Not real film artwork — nothing is copied or downloaded.
 */

export interface ArtFilm {
  id: number;
  title: string;
  year: number;
  genres: number[];
  lang: string;
  director: string;
}

type Rng = () => number;
type Palette = { sky: [string, string]; ground: string; accent: string; glow: string; ink: string };
type Motif = 'sun' | 'orbits' | 'moon' | 'blinds' | 'slashes' | 'blobs' | 'peaks' | 'waves';

// ---------------------------------------------------------------------------- utilities

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rngFrom(seed: string): Rng {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n: number) => Math.round(n * 10) / 10;
const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)] as T;

// ---------------------------------------------------------------------------- palettes

const PALETTES: Record<'warm' | 'cool' | 'dark' | 'bright', Palette[]> = {
  warm: [
    {
      sky: ['#2b0f1e', '#c2533a'],
      ground: '#1a0a12',
      accent: '#ffb547',
      glow: '#ff7a45',
      ink: '#fff1e0',
    },
    {
      sky: ['#1d1030', '#b0456b'],
      ground: '#140a1f',
      accent: '#ffc98b',
      glow: '#ff6f91',
      ink: '#fdeef4',
    },
    {
      sky: ['#2a1a0c', '#d08a3a'],
      ground: '#170e06',
      accent: '#ffe0a3',
      glow: '#ffae4a',
      ink: '#fff6e6',
    },
  ],
  cool: [
    {
      sky: ['#050d24', '#1f5f8b'],
      ground: '#030817',
      accent: '#3fe0ff',
      glow: '#5b8cff',
      ink: '#e6f7ff',
    },
    {
      sky: ['#0a0a22', '#4b3aa8'],
      ground: '#06061a',
      accent: '#a78bfa',
      glow: '#8b5cff',
      ink: '#efeaff',
    },
    {
      sky: ['#041a1a', '#16746b'],
      ground: '#021111',
      accent: '#46e39a',
      glow: '#2dd4bf',
      ink: '#e8fff8',
    },
  ],
  dark: [
    {
      sky: ['#0b0507', '#5c0f1a'],
      ground: '#050203',
      accent: '#ff4d6d',
      glow: '#b3122f',
      ink: '#f5e9e2',
    },
    {
      sky: ['#07080c', '#2c3446'],
      ground: '#030406',
      accent: '#d9dde6',
      glow: '#6b7a99',
      ink: '#eef1f6',
    },
    {
      sky: ['#0c0a05', '#4a3a12'],
      ground: '#060502',
      accent: '#e8c35a',
      glow: '#a07a1f',
      ink: '#faf3dd',
    },
  ],
  bright: [
    {
      sky: ['#1b1446', '#ff7a59'],
      ground: '#120c30',
      accent: '#ffd23f',
      glow: '#ff5fa2',
      ink: '#fffaf0',
    },
    {
      sky: ['#0f2a4a', '#3fc1c9'],
      ground: '#0a1b30',
      accent: '#ffe066',
      glow: '#5ee6c9',
      ink: '#f2ffff',
    },
    {
      sky: ['#301446', '#b15cff'],
      ground: '#1d0b2c',
      accent: '#9dffb0',
      glow: '#ff8ad8',
      ink: '#fbf4ff',
    },
  ],
};

const MOOD_BY_GENRE: Record<number, keyof typeof PALETTES> = {
  18: 'warm',
  10749: 'warm',
  10402: 'warm',
  36: 'warm',
  37: 'warm',
  878: 'cool',
  9648: 'cool',
  53: 'cool',
  99: 'cool',
  27: 'dark',
  80: 'dark',
  10752: 'dark',
  35: 'bright',
  10751: 'bright',
  16: 'bright',
  12: 'bright',
  14: 'bright',
  28: 'bright',
};

const MOTIF_BY_GENRE: Record<number, Motif> = {
  18: 'sun',
  36: 'sun',
  10749: 'waves',
  10402: 'waves',
  878: 'orbits',
  99: 'orbits',
  27: 'moon',
  14: 'moon',
  80: 'blinds',
  53: 'blinds',
  9648: 'blinds',
  28: 'slashes',
  10752: 'slashes',
  35: 'blobs',
  10751: 'blobs',
  16: 'blobs',
  12: 'peaks',
  37: 'peaks',
};

function styleFor(film: ArtFilm, variant = 0) {
  const primary = film.genres[0] ?? 18;
  const rng = rngFrom(`${film.id}:${film.title}:${variant}`);
  const mood = MOOD_BY_GENRE[primary] ?? 'warm';
  const palette = PALETTES[mood][hash(film.title) % PALETTES[mood].length] as Palette;
  const motif = MOTIF_BY_GENRE[primary] ?? 'sun';
  // A secondary genre from a different family layers its texture on top.
  const second = film.genres
    .slice(1)
    .map((g) => MOTIF_BY_GENRE[g])
    .find((m) => m && m !== motif);
  return { rng, palette, motif, second };
}

/** Accent colour for a catalogue film's art (used as its page accent / dominant colour). */
export function artAccent(film: ArtFilm): string {
  return styleFor(film).palette.glow;
}

// ---------------------------------------------------------------------------- shared defs

function defs(p: Palette, id: string) {
  return `<defs>
<linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
<radialGradient id="glow${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${p.glow}" stop-opacity="0.85"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>
<filter id="grain${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.14"/></feComponentTransfer></filter>
<filter id="soft${id}"><feGaussianBlur stdDeviation="18"/></filter>
</defs>`;
}

// ---------------------------------------------------------------------------- motifs

function stars(rng: Rng, w: number, h: number, n: number, color: string) {
  let s = '';
  for (let i = 0; i < n; i++)
    s += `<circle cx="${r1(rng() * w)}" cy="${r1(rng() * h * 0.7)}" r="${r1(0.4 + rng() * 1.4)}" fill="${color}" opacity="${r1(0.25 + rng() * 0.6)}"/>`;
  return s;
}

function drawMotif(
  motif: Motif,
  rng: Rng,
  p: Palette,
  w: number,
  h: number,
  fx: number,
  id: string,
): string {
  const cx = w * fx;
  switch (motif) {
    case 'sun': {
      const y = h * (0.52 + rng() * 0.08);
      const r = Math.min(w, h) * (0.22 + rng() * 0.08);
      let lines = '';
      for (let i = 0; i < 9; i++) {
        const ly = y + 14 + i * i * 3.2;
        lines += `<rect x="${r1(cx - r * (1.05 - i * 0.06))}" y="${r1(ly)}" width="${r1(r * 2 * (1.05 - i * 0.06))}" height="${r1(2 + i * 0.6)}" fill="${p.accent}" opacity="${r1(0.5 - i * 0.045)}"/>`;
      }
      return `<circle cx="${cx}" cy="${y}" r="${r * 1.9}" fill="url(#glow${id})"/>
<circle cx="${cx}" cy="${y}" r="${r}" fill="${p.accent}"/>
<rect x="0" y="${y}" width="${w}" height="${h - y}" fill="${p.ground}"/>${lines}`;
    }
    case 'orbits': {
      const cy = h * (0.36 + rng() * 0.1);
      const r = Math.min(w, h) * (0.16 + rng() * 0.06);
      const tilt = -20 + rng() * 40;
      let rings = '';
      for (let i = 0; i < 4; i++)
        rings += `<ellipse cx="${cx}" cy="${cy}" rx="${r * (1.7 + i * 0.55)}" ry="${r * (0.45 + i * 0.16)}" fill="none" stroke="${p.accent}" stroke-width="${1.5 - i * 0.25}" opacity="${0.75 - i * 0.15}" transform="rotate(${r1(tilt)} ${cx} ${cy})"/>`;
      return `${stars(rng, w, h, 90, p.ink)}
<circle cx="${cx}" cy="${cy}" r="${r * 2.4}" fill="url(#glow${id})"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.sky[0]}" stroke="${p.accent}" stroke-width="2"/>
<path d="M${cx - r} ${cy} a${r} ${r} 0 0 0 ${2 * r} 0" fill="${p.glow}" opacity="0.35"/>${rings}
<path d="M0 ${h * 0.86} Q ${w * 0.5} ${h * 0.74} ${w} ${h * 0.86} L${w} ${h} L0 ${h}Z" fill="${p.ground}"/>`;
    }
    case 'moon': {
      const my = h * (0.2 + rng() * 0.08);
      const mr = Math.min(w, h) * 0.11;
      let trees = `M0 ${h}`;
      const base = h * 0.7;
      for (let x = 0; x <= w; x += w / 26) {
        const t = base - (20 + rng() * h * 0.22);
        trees += ` L${r1(x)} ${r1(base)} L${r1(x + w / 52)} ${r1(t)} L${r1(x + w / 26)} ${r1(base)}`;
      }
      trees += ` L${w} ${h} Z`;
      return `${stars(rng, w, h, 50, p.ink)}
<circle cx="${cx}" cy="${my}" r="${mr * 3}" fill="url(#glow${id})"/>
<circle cx="${cx}" cy="${my}" r="${mr}" fill="${p.ink}"/>
<circle cx="${cx + mr * 0.35}" cy="${my - mr * 0.1}" r="${mr * 0.92}" fill="${p.sky[0]}" opacity="0.9"/>
<rect x="0" y="${h * 0.6}" width="${w}" height="${h * 0.2}" fill="${p.glow}" opacity="0.12" filter="url(#soft${id})"/>
<path d="${trees}" fill="${p.ground}"/>`;
    }
    case 'blinds': {
      let bars = '';
      const gap = h / 18;
      for (let i = -4; i < 26; i++)
        bars += `<rect x="-${w}" y="${r1(i * gap)}" width="${w * 3}" height="${r1(gap * 0.46)}" fill="${p.accent}" opacity="0.14"/>`;
      const sx = cx;
      const sy = h * (0.44 + rng() * 0.08);
      const sr = Math.min(w, h) * 0.15;
      return `<g transform="rotate(${r1(-14 + rng() * 8)} ${w / 2} ${h / 2})">${bars}</g>
<path d="M${r1(w * 0.05)} 0 L${r1(w * 0.42)} 0 L${r1(sx + sr * 0.4)} ${h} L${r1(sx - sr * 2.2)} ${h}Z" fill="${p.accent}" opacity="0.12"/>
<circle cx="${sx}" cy="${sy - sr * 1.2}" r="${sr * 0.55}" fill="${p.ground}"/>
<path d="M${sx - sr} ${h} Q ${sx - sr} ${sy - sr * 0.4} ${sx} ${sy - sr * 0.45} Q ${sx + sr} ${sy - sr * 0.4} ${sx + sr} ${h}Z" fill="${p.ground}"/>
<path d="M${sx - sr * 0.9} ${sy - sr * 1.55} L${sx + sr * 0.9} ${sy - sr * 1.55} L${sx + sr * 0.55} ${sy - sr * 1.85} L${sx - sr * 0.55} ${sy - sr * 1.85}Z" fill="${p.ground}"/>`;
    }
    case 'slashes': {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x = rng() * w * 1.2 - w * 0.1;
        const bw = 10 + rng() * w * 0.08;
        s += `<path d="M${r1(x)} ${-h * 0.1} L${r1(x + bw)} ${-h * 0.1} L${r1(x + bw - w * 0.45)} ${h * 1.1} L${r1(x - w * 0.45)} ${h * 1.1}Z" fill="${i % 3 ? p.accent : p.glow}" opacity="${r1(0.12 + rng() * 0.35)}"/>`;
      }
      let sparks = '';
      for (let i = 0; i < 40; i++) {
        const x = cx + (rng() - 0.5) * w * 0.7;
        const y = h * 0.5 + (rng() - 0.5) * h * 0.5;
        sparks += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x - 6 - rng() * 14)}" y2="${r1(y + 10 + rng() * 22)}" stroke="${p.accent}" stroke-width="1.3" opacity="${r1(0.3 + rng() * 0.6)}"/>`;
      }
      return `<circle cx="${cx}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.45}" fill="url(#glow${id})"/>${s}${sparks}
<path d="M0 ${h * 0.82} L${w * 0.3} ${h * 0.76} L${w * 0.55} ${h * 0.8} L${w} ${h * 0.72} L${w} ${h} L0 ${h}Z" fill="${p.ground}"/>`;
    }
    case 'blobs': {
      let b = '';
      const colors = [p.accent, p.glow, p.ink, p.sky[1]];
      for (let i = 0; i < 6; i++) {
        const x = rng() * w;
        const y = rng() * h * 0.85;
        const r = Math.min(w, h) * (0.08 + rng() * 0.16);
        b += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(r * (0.7 + rng() * 0.5))}" fill="${pick(rng, colors)}" opacity="${r1(0.35 + rng() * 0.45)}" transform="rotate(${r1(rng() * 180)} ${r1(x)} ${r1(y)})"/>`;
      }
      let dots = '';
      for (let i = 0; i < 60; i++)
        dots += `<circle cx="${r1(rng() * w)}" cy="${r1(rng() * h)}" r="${r1(1.5 + rng() * 4)}" fill="${pick(rng, colors)}" opacity="0.7"/>`;
      return `${b}${dots}<path d="M0 ${h * 0.84} Q ${w * 0.25} ${h * 0.74} ${w * 0.5} ${h * 0.82} T ${w} ${h * 0.8} L${w} ${h} L0 ${h}Z" fill="${p.ground}"/>`;
    }
    case 'peaks': {
      let ranges = '';
      for (let layer = 0; layer < 4; layer++) {
        const base = h * (0.55 + layer * 0.1);
        let d = `M0 ${h}`;
        for (let x = 0; x <= w + 1; x += w / 7)
          d += ` L${r1(x)} ${r1(base - rng() * h * (0.22 - layer * 0.04))}`;
        d += ` L${w} ${h}Z`;
        ranges += `<path d="${d}" fill="${layer === 3 ? p.ground : p.sky[0]}" opacity="${r1(0.45 + layer * 0.18)}"/>`;
      }
      return `<circle cx="${cx}" cy="${h * 0.34}" r="${Math.min(w, h) * 0.34}" fill="url(#glow${id})"/>
<circle cx="${cx}" cy="${h * 0.34}" r="${Math.min(w, h) * 0.08}" fill="${p.accent}"/>${ranges}`;
    }
    case 'waves': {
      let lines = '';
      for (let i = 0; i < 14; i++) {
        const y = h * 0.35 + i * h * 0.035;
        const amp = 12 + rng() * 28;
        lines += `<path d="M0 ${r1(y)} C ${r1(w * 0.25)} ${r1(y - amp)}, ${r1(w * 0.5)} ${r1(y + amp)}, ${w} ${r1(y - amp * 0.4)}" fill="none" stroke="${i % 2 ? p.accent : p.glow}" stroke-width="${r1(1 + rng() * 1.5)}" opacity="${r1(0.25 + rng() * 0.5)}"/>`;
      }
      const r = Math.min(w, h) * 0.13;
      return `<circle cx="${cx - r * 0.55}" cy="${h * 0.3}" r="${r}" fill="${p.accent}" opacity="0.85"/>
<circle cx="${cx + r * 0.55}" cy="${h * 0.3}" r="${r}" fill="${p.glow}" opacity="0.75" style="mix-blend-mode:screen"/>${lines}`;
    }
  }
}

function texture(motif: Motif | undefined, rng: Rng, p: Palette, w: number, h: number) {
  if (motif === 'orbits' || motif === 'moon') return stars(rng, w, h, 40, p.ink);
  if (motif === 'blinds') {
    let s = '';
    for (let i = 0; i < 22; i++)
      s += `<rect x="0" y="${r1((i * h) / 22)}" width="${w}" height="1.2" fill="${p.ink}" opacity="0.05"/>`;
    return s;
  }
  if (motif === 'waves' || motif === 'blobs') {
    let s = '';
    for (let i = 0; i < 24; i++)
      s += `<circle cx="${r1(rng() * w)}" cy="${r1(rng() * h * 0.6)}" r="${r1(1 + rng() * 2.5)}" fill="${p.accent}" opacity="0.5"/>`;
    return s;
  }
  return '';
}

// ---------------------------------------------------------------------------- typography

function wrap(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
    return kept;
  }
  return lines;
}

const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

// ---------------------------------------------------------------------------- public API

/** 500×750 poster: full-bleed scene, credit line, title set large at the foot. */
export function posterSvg(film: ArtFilm): string {
  const W = 500;
  const H = 750;
  const id = `p${film.id}`;
  const { rng, palette: p, motif, second } = styleFor(film);
  const fx = 0.35 + rng() * 0.3;
  const len = film.title.length;
  const size = len <= 8 ? 78 : len <= 14 ? 62 : len <= 24 ? 50 : 40;
  const lines = wrap(film.title, Math.floor(430 / (size * 0.52)), 3);
  const lh = size * 1.02;
  const top = H - 70 - lh * (lines.length - 1);
  const title = lines
    .map((l, i) => `<tspan x="36" y="${r1(top + i * lh)}">${esc(l)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(p, id)}
<rect width="${W}" height="${H}" fill="url(#sky${id})"/>
${drawMotif(motif, rng, p, W, H * 0.88, fx, id)}
<rect x="0" y="${r1(H * 0.87)}" width="${W}" height="${r1(H * 0.13 + 1)}" fill="${p.ground}"/>
${texture(second, rng, p, W, H * 0.85)}
<rect width="${W}" height="${H}" fill="url(#fade${id})"/>
<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${p.ink}" stroke-opacity="0.18"/>
<text x="36" y="56" fill="${p.ink}" fill-opacity="0.75" font-family="${SANS}" font-size="13" letter-spacing="3.5">${esc(String(film.year))} · ${esc(film.lang.toUpperCase())}</text>
<text x="36" y="${r1(top - lh * 0.95)}" fill="${p.accent}" font-family="${SANS}" font-size="12" letter-spacing="3" font-weight="700">A FILM BY ${esc(film.director.toUpperCase())}</text>
<text fill="${p.ink}" font-family="${SERIF}" font-size="${size}" font-weight="700" letter-spacing="-1">${title}</text>
<rect width="${W}" height="${H}" filter="url(#grain${id})"/>
</svg>`;
}

/** 1280×720 backdrop (or a still, when `variant` > 0): the scene without type. */
export function backdropSvg(film: ArtFilm, variant = 0): string {
  const W = 1280;
  const H = 720;
  const id = `b${film.id}v${variant}`;
  const { rng, palette: p, motif, second } = styleFor(film, variant);
  // Keep the focal point right of centre so hero copy on the left stays legible.
  const fx = variant ? 0.2 + rng() * 0.6 : 0.62 + rng() * 0.18;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(p, id)}
<rect width="${W}" height="${H}" fill="url(#sky${id})"/>
${drawMotif(variant === 2 && second ? second : motif, rng, p, W, H, fx, id)}
${texture(second, rng, p, W, H)}
<rect width="${W}" height="${H}" filter="url(#grain${id})"/>
</svg>`;
}

/** 400×600 director portrait: an abstract figure with rim light on the person's colour. */
export function portraitSvg(name: string): string {
  const W = 400;
  const H = 600;
  const id = `r${hash(name)}`;
  const moods = Object.values(PALETTES).flat();
  const p = moods[hash(name) % moods.length] as Palette;
  const rng = rngFrom(name);
  const hx = W * (0.44 + rng() * 0.12);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(p, id)}
<rect width="${W}" height="${H}" fill="url(#sky${id})"/>
<circle cx="${hx + 60}" cy="${H * 0.3}" r="220" fill="url(#glow${id})"/>
<circle cx="${hx}" cy="${H * 0.38}" r="78" fill="${p.ground}"/>
<path d="M${hx - 78} ${H * 0.36} a78 78 0 0 1 150 -18" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.8"/>
<path d="M${hx - 150} ${H} C ${hx - 150} ${H * 0.62}, ${hx - 70} ${H * 0.54}, ${hx} ${H * 0.54} C ${hx + 70} ${H * 0.54}, ${hx + 150} ${H * 0.62}, ${hx + 150} ${H}Z" fill="${p.ground}"/>
<rect width="${W}" height="${H}" fill="url(#fade${id})" opacity="0.5"/>
<rect width="${W}" height="${H}" filter="url(#grain${id})"/>
</svg>`;
}
