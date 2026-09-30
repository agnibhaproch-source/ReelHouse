import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';

// Accessibility (spec 60): zero axe violations on key pages (WCAG 2.2 AA rules).
test.use({ reducedMotion: 'reduce' });

for (const path of [
  '/styleguide',
  '/',
  '/movie/1001',
  '/movie/1003', // green per-film accent
  '/search?q=the',
  '/browse',
  '/mood/rainy-sunday',
  '/account',
  '/login',
  '/my-list',
  '/person/5001',
]) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      // Decorative film grain / cursor layers are aria-hidden; exclude them from colour checks.
      .exclude('.grain')
      .exclude('[data-cursor-root]')
      .analyze();
    const summary = results.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join(' | ')}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
}
