import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Teach tailwind-merge our token font sizes so `text-small` never evicts a colour like `text-void`. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['hero', 'h1', 'h2', 'h3', 'body', 'small'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function yearOf(date: string | null | undefined): string {
  if (!date) return '';
  const y = date.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : '';
}

export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function formatMoney(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function isNewRelease(date: string | null | undefined, now: Date = new Date()): boolean {
  if (!date) return false;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return false;
  const diff = now.getTime() - t;
  return diff >= 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Match % shown on previews — derived from TMDB score, never above 99. */
export function matchPercent(voteAverage: number): number {
  return clamp(Math.round(voteAverage * 10 + 8), 40, 99);
}

export function greetingFor(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 23 || h < 4) return 'Late-night show?';
  if (h < 12) return 'Morning matinee?';
  if (h < 17) return 'Afternoon screening?';
  return 'Evening feature?';
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
