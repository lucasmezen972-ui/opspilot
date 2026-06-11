import { test, expect } from '@playwright/test';

import { blockSupabase, readCount } from './helpers';

/**
 * Test 1 — Authentification démo
 * Le bouton démo doit toujours fonctionner, même sans Supabase.
 */

test.describe('Authentification démo', () => {
  test("l'écran de connexion s'affiche sans crash", async ({ page }) => {
    await page.goto('./');
    await expect(page.getByText('OpsPilot').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('demo-login-button')).toBeVisible({
      timeout: 8_000,
    });
  });

  test('connexion démo redirige vers le dashboard', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('demo-login-button').click();

    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('kpi-audits-done')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('connexion démo avec Supabase bloqué — KPIs non nuls', async ({
    page,
  }) => {
    await blockSupabase(page);
    await page.goto('./');
    await page.getByTestId('demo-login-button').click();

    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    expect(await readCount(page, 'kpi-audits-done-value')).toBeGreaterThan(0);
    expect(await readCount(page, 'kpi-actions-open-value')).toBeGreaterThan(0);
  });
});
