import { type Page } from '@playwright/test';

export const DEMO_EMPLOYEE = {
  email: 'demo@opspilot.com',
  password: 'demo123',
};

export const DEMO_MANAGER = {
  email: 'marie.dupont@opspilot.com',
  password: 'marie123',
};

/**
 * Connexion via le bouton « ⚡ Connexion Démo » (testID demo-login-button).
 * Le paramètre `role` est conservé pour compatibilité ; le mode démo
 * utilise toujours le compte employé (fallback local garanti hors-ligne).
 */
export async function loginAsDemo(
  page: Page,
  _role: 'employee' | 'manager' = 'employee',
) {
  await page.goto('/');

  const demoBtn = page
    .getByTestId('demo-login-button')
    .or(page.getByText('⚡ Connexion Démo'))
    .first();
  await demoBtn.waitFor({ timeout: 15_000 });
  await demoBtn.click();

  // Attendre que le dashboard soit visible (réseau ou fallback local)
  // Attente STRICTE : si le dashboard n'apparaît pas, le test échoue ici.
  await page
    .getByText('Tableau de bord opérationnel', { exact: true })
    .waitFor({ timeout: 20_000 });
}

export async function waitForApp(page: Page) {
  await page.waitForSelector('text=Bonjour', { timeout: 20_000 }).catch(async () => {
    // Might be on auth screen — that's fine, app loaded
    await page.waitForSelector('text=OpsPilot', { timeout: 5_000 });
  });
}
