import { test, expect } from './fixtures';

test('guest: home → card → detail → trailer (or no-trailer state) → back', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Featured movies' })).toBeVisible();
  const card = page.locator('a[data-poster-id]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  const name = (await card.getAttribute('aria-label')) ?? '';
  await card.click();
  await expect(page).toHaveURL(/\/movie\/\d+/);
  const title = name.split(',')[0] ?? '';
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeAttached();
  const play = page.getByRole('button', { name: /play trailer/i }).first();
  if (await play.isVisible().catch(() => false)) {
    await play.click();
    const dialog = page.getByRole('dialog', { name: /trailer/i });
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Close trailer' }).click();
    await expect(dialog).toBeHidden();
  } else {
    await expect(page.getByText('No trailer available.')).toBeVisible();
  }
  await page.goBack();
  await expect(page).toHaveURL('/');
});

test('search by keyboard: / → type → arrows → Enter', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  const box = page.getByRole('combobox', { name: /search movies and people/i });
  await expect(box).toBeFocused();
  await box.fill('the');
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/(movie|person)\/\d+/);
});

test('profile → add to list → reload → still there', async ({ page }) => {
  await page.goto('/profiles');
  await page.getByRole('button', { name: 'Add a profile' }).click();
  await page.getByLabel('Name').fill('E2E');
  await page.getByRole('button', { name: 'Add profile' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  // Avatars float (L3 ambient), so they are never "stable" for Playwright's actionability check.
  await page.getByRole('button', { name: /watch as e2e/i }).click({ force: true });
  await expect(page).toHaveURL('/');
  const card = page.locator('a[data-poster-id]').first();
  const id = await card.getAttribute('data-poster-id');
  await page.goto(`/movie/${id}`);
  await page.getByRole('button', { name: /^add .* to my list$/i }).first().click();
  await expect(page.getByText('Added to my list')).toBeVisible();
  await page.goto('/my-list');
  await page.reload();
  await expect(page.locator(`a[data-poster-id="${id}"]`)).toBeVisible();
});

test('404 is designed and searchable', async ({ page }) => {
  await page.goto('/movie/99999999');
  await expect(page.getByRole('heading', { name: 'This reel is missing.' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: /search movies/i })).toBeVisible();
});

test('skip link is the first tab stop', async ({ page }) => {
  await page.goto('/browse');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
