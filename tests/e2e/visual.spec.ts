import { test, expect } from './fixtures';

// Visual regression (spec 65). Generate baselines with: pnpm test:e2e --update-snapshots
test.use({ reducedMotion: 'reduce' });

for (const path of ['/styleguide', '/', '/movie/1001', '/browse']) {
  test(`visual ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`${path.replace(/\W+/g, '_') || 'home'}.png`, { fullPage: false, maxDiffPixelRatio: 0.02, mask: [page.locator('.grain')] });
  });
}
