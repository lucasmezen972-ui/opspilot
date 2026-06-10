import { test, expect } from '@playwright/test';

/**
 * Test 1 — Authentification démo
 * Le bouton démo doit toujours fonctionner, même sans Supabase.
 */

test.describe('Authentification démo', () => {
  const demoButton = (page: Parameters<typeof test>[0]['page']) =>
    page.getByRole('button', { name: /connexion démo/i });

  test("l'écran de connexion s'affiche sans crash", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('OpsPilot')).toBeVisible({ timeout: 10_000 });
    await expect(demoButton(page)).toBeVisible({ timeout: 8_000 });
  });

  test('connexion démo redirige vers le dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(demoButton(page)).toBeVisible({ timeout: 10_000 });
    await demoButton(page).click();

    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("pas d'écran blanc après la connexion démo", async ({ page }) => {
    await page.goto('/');
    await demoButton(page).click();
    await page.waitForTimeout(5_000);

    const body = await page.textContent('body');
    expect(body?.trim().length).toBeGreaterThan(50);
    expect(body?.includes('Application failed')).toBeFalsy();
  });

  test('connexion démo fonctionne avec Supabase bloqué', async ({ page }) => {
    await page.route('**/supabase.co/**', (route) => route.abort());
    await page.goto('/');

    await expect(demoButton(page)).toBeVisible({ timeout: 10_000 });
    await demoButton(page).click();

    await expect(
      page.getByText('Tableau de bord opérationnel', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
