import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, readCount } from './helpers';

/**
 * Non-régression B2/B3 — mode démo local (Supabase injoignable).
 * B2 : les KPIs du dashboard ne doivent jamais être à 0 en démo.
 * B3 : reload / deep-link ne doit pas déconnecter la démo locale.
 */

test.describe('Démo offline (B2/B3)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
  });

  test('B2 — KPIs dashboard non nuls en démo locale', async ({ page }) => {
    expect(await readCount(page, 'kpi-audits-done-value')).toBeGreaterThan(0);
    expect(await readCount(page, 'kpi-actions-open-value')).toBeGreaterThan(0);
  });

  test('B3 — reload conserve la session démo', async ({ page }) => {
    await page.reload();
    await expect(
      page.getByText('Carnet de bord terrain', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('B3 — deep-link /actions reste connecté', async ({ page }) => {
    // URL relative : reste sous le base path /opspilot/
    await page.goto('./actions');
    await expect(page.getByTestId('page-actions-title')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('B2 — écran Formation alimenté en démo locale', async ({ page }) => {
    await page.getByRole('tab', { name: 'Formation' }).click();
    await expect(
      page.getByText('Hygiène et sécurité alimentaire (HACCP)').first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Gestion des DLC et rotation des stocks').first(),
    ).toBeVisible();
  });

  test('B2 — écran Audits cohérent avec le dashboard (store partagé)', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Audits' }).click();
    await expect(
      page.getByText('Contrôle hygiène rayon frais').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
