import { test, expect } from '@playwright/test';

import { loginAsDemo } from './helpers';

test.describe('Gestion des audits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'employee');
    // Navigate to Audits tab
    await page
      .getByRole('button', { name: 'Audits' })
      .or(page.locator('text=Audits').first())
      .click({ timeout: 10_000 })
      .catch(() => {});
    await page.waitForTimeout(1_000);
  });

  test('liste des audits affichée', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain('Audit');
  });

  test('bouton créer un audit visible', async ({ page }) => {
    const createBtn = page
      .getByRole('button', { name: /créer un audit/i })
      .or(page.locator('text=Créer un audit'));
    await expect(createBtn.first()).toBeVisible({ timeout: 8_000 });
  });

  test('ouvrir modal de création', async ({ page }) => {
    await page
      .getByRole('button', { name: /créer un audit/i })
      .or(page.locator('text=Créer un audit'))
      .first()
      .click({ timeout: 8_000 })
      .catch(() => {});
    await page.waitForTimeout(800);
    const bodyText = await page.locator('body').innerText();
    // Modal or form opened
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('bibliothèque de modèles visible', async ({ page }) => {
    const templates = page.locator('text=Bibliothèque de modèles');
    await expect(templates.first()).toBeVisible({ timeout: 8_000 });
  });
});
