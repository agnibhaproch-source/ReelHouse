import { test, expect } from './fixtures';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no smooth scroll, native cursor, calm document', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
    await expect(page.locator('html')).not.toHaveClass(/has-custom-cursor/);
    await expect(page.locator('[data-cursor-root]')).toHaveCount(0);
  });

  // Entrance animations are skipped, never half-run: nothing the reader needs may sit at opacity 0.
  test('all content is visible without scrolling it into view', async ({ page }) => {
    const hidden = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('main h1, main h2, main p, main li')]
          .filter(
            (e) =>
              e.getBoundingClientRect().width > 0 && !e.closest('[aria-hidden="true"], .sr-only'),
          )
          .filter((e) => {
            for (let n: Element | null = e; n; n = n.parentElement)
              if (getComputedStyle(n).opacity === '0') return true;
            return false;
          })
          .map((e) => `${e.tagName}: ${(e.textContent ?? '').trim().slice(0, 40)}`),
      );
    for (const path of ['/', '/movie/1001', '/person/5001', '/mood/feel-good']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      expect(await hidden(), path).toEqual([]);
    }
    await page.goto('/');
    await expect(page.locator('[data-hero-overview]')).toBeVisible();
  });
});

test('custom cursor mounts on fine pointers and the settings toggle restores the native one', async ({
  page,
}) => {
  await page.goto('/account?section=experience');
  await page.mouse.move(400, 300);
  await expect(page.locator('html')).toHaveClass(/has-custom-cursor/);
  await page.getByRole('switch', { name: 'Classic cursor' }).click();
  await expect(page.locator('html')).not.toHaveClass(/has-custom-cursor/);
});

test('first visit shows a skippable preloader, never on client navigations', async ({
  browser,
}) => {
  const page = await browser.newPage();
  await page.goto('/');
  const pre = page.locator('[data-preloader]');
  await expect(pre).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pre).toHaveCount(0);
  await page.getByRole('link', { name: 'My list' }).first().click();
  await expect(page).toHaveURL(/my-list|login/);
  await expect(pre).toHaveCount(0);
  await page.close();
});
