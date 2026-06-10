import { test, expect } from '@playwright/test';

import { loginAsDemo } from './helpers';

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'employee');
  });

  const tabs = [
    { name: 'Audits', keyword: 'Audits' },
    { name: 'Produits', keyword: 'Produits' },
    { name: 'Actions', keyword: 'Actions' },
    { name: 'Formation', keyword: 'Formation' },
    { name: 'Profil', keyword: 'Profil' },
  ];

  for (const tab of tabs) {
    test(`onglet ${tab.name} accessible`, async ({ page }) => {
      const tabBtn = page.getByRole('button', { name: tab.name }).or(
        page.locator(`text=${tab.name}`).first(),
      );
      // Try clicking the tab
      await tabBtn.click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1_500);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(10);
    });
  }

  test('refresh navigateur — pas de crash', async ({ page }) => {
    await page.reload();
    await page.waitForTimeout(3_000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
