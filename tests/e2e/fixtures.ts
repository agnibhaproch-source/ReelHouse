import { test as base, expect } from '@playwright/test';

/** Every test starts past the first-visit preloader (spec 36 is covered separately). */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('intro-seen', 'true');
        sessionStorage.setItem('leader-seen', '1');
      } catch {
        /* ignore */
      }
    });
    await use(page);
  },
});

export { expect };
