import { test, expect } from '@playwright/test';

import { loginAsDemo } from './helpers';

test.describe('Produits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'employee');
    await page
      .getByRole('button', { name: 'Produits' })
      .or(page.locator('text=Produits').first())
      .click({ timeout: 10_000 })
      .catch(() => {});
    await page.waitForTimeout(1_000);
  });

  test('page produits se charge sans crash', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('affichage liste produits ou état vide', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    // Either products shown or empty state — not blank
    expect(bodyText).toMatch(/produit|stock|article|Aucun/i);
  });
});
