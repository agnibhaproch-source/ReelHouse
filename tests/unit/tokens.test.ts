import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COLORS, DUR_MS, EASES } from '@/lib/tokens';

const css = readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');
const globals = readFileSync(path.resolve(__dirname, '../../src/styles/globals.css'), 'utf8');
const value = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();

describe('design tokens', () => {
  it('JS eases mirror the CSS custom properties', () => {
    for (const [name, curve] of Object.entries(EASES)) {
      expect(value(`ease-${name}`)).toBe(`cubic-bezier(${curve.join(', ')})`);
    }
  });

  it('JS durations mirror the CSS custom properties', () => {
    for (const [name, ms] of Object.entries(DUR_MS)) expect(value(`dur-${name}`)).toBe(`${ms}ms`);
  });

  it('JS colours mirror the CSS custom properties', () => {
    const map: Record<string, string> = {
      void: 'bg-void',
      seat: 'bg-seat',
      aisle: 'bg-aisle',
      line: 'line',
      reel: 'text-reel',
      dim: 'text-dim',
      violet: 'marquee-violet',
      cyan: 'marquee-cyan',
      amber: 'projector-amber',
      danger: 'danger',
    };
    for (const [k, css] of Object.entries(map))
      expect(value(css)?.toLowerCase()).toBe(COLORS[k as keyof typeof COLORS]);
  });

  it('Tailwind @theme maps onto the live tokens (changing a token updates classes)', () => {
    expect(globals).toContain('@theme inline');
    expect(globals).toContain('--color-violet: var(--marquee-violet)');
    expect(globals).toContain('--ease-reel: var(--ease-reel)');
  });

  it('secondary text meets WCAG AA on the page background', () => {
    const lum = (hex: string) => {
      const c = [0, 2, 4]
        .map((i) => Number.parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    };
    const ratio = (a: string, b: string) =>
      (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    expect(ratio(COLORS.dim, COLORS.void)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(COLORS.dim, COLORS.aisle)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(COLORS.void, COLORS.violet)).toBeGreaterThanOrEqual(4.5);
  });
});
