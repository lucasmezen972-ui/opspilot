import { test, expect } from '@playwright/test';

/**
 * Test 1 — Authentification démo
 * Le bouton démo doit toujours fonctionner, même sans Supabase.
 */

test.describe('Authentification démo', () => {
  test("l'écran de connexion s'affiche sans crash", async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('OpsPilot')).toBeVisible({ timeout: 10_000 });
    // Le bouton démo doit être présent
    await expect(
      page.getByText('⚡ Connexion Démo').or(page.getByTestId('demo-login-button')),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('connexion démo redirige vers le dashboard', async ({ page }) => {
    await page.goto('/');

    // Attendre que le bouton démo soit visible
    const demoBtn = page
      .getByText('⚡ Connexion Démo')
      .or(page.getByTestId('demo-login-button'));
    await expect(demoBtn).toBeVisible({ timeout: 10_000 });

    // Cliquer sur le bouton démo
    await demoBtn.click();

    // Le dashboard doit s'afficher
    await expect(
      page
        .getByText('Tableau de bord opérationnel')
        .or(page.getByText('KPIs du jour'))
        .or(page.getByText('Demo Employé')),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("pas d'écran blanc après la connexion démo", async ({ page }) => {
    await page.goto('/');
    await page
      .getByText('⚡ Connexion Démo')
      .or(page.getByTestId('demo-login-button'))
      .click();
    await page.waitForTimeout(5_000);

    // Le corps de la page ne doit pas être vide
    const body = await page.textContent('body');
    expect(body?.trim().length).toBeGreaterThan(50);
    // Pas de texte d'erreur React brut
    expect(body?.includes('Application failed')).toBeFalsy();
  });

  test('connexion démo fonctionne avec Supabase bloqué', async ({ page }) => {
    // Bloquer toutes les requêtes vers Supabase
    await page.route('**/supabase.co/**', (route) => route.abort());

    await page.goto('/');

    const demoBtn = page
      .getByText('⚡ Connexion Démo')
      .or(page.getByTestId('demo-login-button'));
    await expect(demoBtn).toBeVisible({ timeout: 10_000 });
    await demoBtn.click();

    // Doit quand même accéder au dashboard (mode local)
    await expect(
      page
        .getByText('Tableau de bord opérationnel')
        .or(page.getByText('KPIs du jour'))
        .or(page.getByText('Demo Employé')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
