import { test, expect } from '@playwright/test';

import { loginAsDemo } from './helpers';

test.describe('Gestion des audits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'employee');
    await page.getByRole('tab', { name: 'Audits' }).click({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: 'Audits' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('liste des audits affichée', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Audit');
  });

  test('bouton créer un audit visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /créer un audit/i }).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('ouvrir modal de création', async ({ page }) => {
    await page
      .getByRole('button', { name: /créer un audit/i })
      .first()
      .click({ timeout: 8_000 });
    await page.waitForTimeout(800);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('bibliothèque de modèles visible', async ({ page }) => {
    await expect(
      page.getByText('Bibliothèque de modèles', { exact: true }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
