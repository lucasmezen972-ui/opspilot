import { type Page, expect } from '@playwright/test';

/**
 * Bloque tout trafic vers Supabase : force le mode démo 100 % local
 * (lib/demoStore.ts), donc des données déterministes pour les tests.
 */
export async function blockSupabase(page: Page) {
  await page.route('**/supabase.co/**', (route) => route.abort());
}

/**
 * Connexion via le bouton « ⚡ Connexion Démo » (testID demo-login-button).
 * Attente STRICTE : si le dashboard n'apparaît pas, le test échoue ici.
 */
export async function loginAsDemo(page: Page) {
  await page.goto('./');
  const demoBtn = page.getByTestId('demo-login-button');
  await expect(demoBtn).toBeVisible({ timeout: 15_000 });
  await demoBtn.click();
  await expect(
    page.getByText('Tableau de bord opérationnel', { exact: true }),
  ).toBeVisible({ timeout: 20_000 });
}

/** Connexion démo avec Supabase bloqué : données locales déterministes. */
export async function loginAsLocalDemo(page: Page) {
  await blockSupabase(page);
  await loginAsDemo(page);
}

/**
 * Ouvre un onglet de la barre de navigation et attend le titre de la page
 * (testID) : échec immédiat si l'écran ne se charge pas.
 */
export async function openTab(page: Page, name: string, titleTestId: string) {
  await page.getByRole('tab', { name }).click();
  await expect(page.getByTestId(titleTestId)).toBeVisible({ timeout: 10_000 });
}

/** Lit un compteur numérique affiché dans un testID. */
export async function readCount(page: Page, testId: string): Promise<number> {
  const raw = await page.getByTestId(testId).innerText();
  const value = parseInt(raw.trim(), 10);
  expect(Number.isNaN(value), `compteur ${testId} illisible: "${raw}"`).toBe(
    false,
  );
  return value;
}
