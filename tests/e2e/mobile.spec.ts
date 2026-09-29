import { test, expect } from './fixtures';

test.use({ viewport: { width: 360, height: 780 } });

test('no horizontal overflow at 360px and bottom tabs work', async ({ page }) => {
  for (const path of ['/', '/browse', '/movie/1001', '/search?q=the', '/account']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `overflow on ${path}`).toBeLessThanOrEqual(1);
  }
  await page.goto('/');
  const tabs = page.getByRole('navigation', { name: 'Tabs' });
  await expect(tabs).toBeVisible();
  await tabs.getByRole('button', { name: 'Open search' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('hamburger menu traps focus', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
