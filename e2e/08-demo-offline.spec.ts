import { test, expect } from '@playwright/test';

/**
 * Non-régression B2/B3 — mode démo local (Supabase injoignable).
 * B2 : les KPIs du dashboard ne doivent jamais être à 0 en démo.
 * B3 : reload / deep-link ne doit pas déconnecter la démo locale.
 */

test.describe('Démo offline (B2/B3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/supabase.co/**', (route) => route.abort());
    await page.goto('./');
    const demoBtn = page.getByTestId('demo-login-button');
    await expect(demoBtn).toBeVisible({ timeout: 15_000 });
    await demoBtn.click();
    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('B2 — KPIs dashboard non nuls en démo locale', async ({ page }) => {
    const kpi = page.getByTestId('kpi-audits-done-value');
    await expect(kpi).toBeVisible({ timeout: 10_000 });
    const value = parseInt((await kpi.innerText()).trim(), 10);
    expect(value).toBeGreaterThan(0);

    const actionsKpi = page.getByTestId('kpi-actions-open-value');
    await expect(actionsKpi).toBeVisible();
    expect(parseInt((await actionsKpi.innerText()).trim(), 10)).toBeGreaterThan(
      0,
    );
  });

  test('B3 — reload conserve la session démo', async ({ page }) => {
    await page.reload();
    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('B3 — deep-link /actions reste connecté', async ({ page }) => {
    // URL relative : reste sous le base path /opspilot/
    await page.goto('./actions');
    await expect(
      page.getByText('Actions correctives').first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
  });

  test('B2 — écran Audits cohérent avec le dashboard (données du hook)', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Audits' }).click();
    await expect(
      page.getByText('Contrôle hygiène rayon frais').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
