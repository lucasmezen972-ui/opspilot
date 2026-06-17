import { type Page, expect } from '@playwright/test';

/**
 * Bloque tout trafic vers Supabase : force le mode démo 100 % local
 * (lib/demoStore.ts), donc des données déterministes pour les tests.
 *
 * On filtre par expression régulière sur l'hôte : le glob précédent
 * `**​/supabase.co/**` n'a jamais rien bloqué car l'URL réelle est
 * `xxx.supabase.co` (point avant « supabase.co », pas un slash). Tant que
 * le login démo échouait (compte cassé), l'app retombait quand même en
 * local ; depuis que le login fonctionne, un blocage réel est indispensable
 * pour garder ces tests déterministes.
 */
export async function blockSupabase(page: Page) {
  await page.route(/supabase\.co/, (route) => route.abort());
}

/**
 * Connexion via le bouton démo (testID demo-login-button).
 * Attente STRICTE : si le dashboard n'apparaît pas, le test échoue ici.
 */
export async function loginAsDemo(page: Page) {
  await page.goto('./');
  const demoBtn = page.getByTestId('demo-login-button');
  await expect(demoBtn).toBeVisible({ timeout: 15_000 });
  await demoBtn.click();
  await expect(
    page.getByText('Carnet de bord terrain', { exact: true }),
  ).toBeVisible({ timeout: 20_000 });
}

/** Connexion démo avec Supabase bloqué : données locales déterministes. */
export async function loginAsLocalDemo(page: Page) {
  await blockSupabase(page);
  await loginAsDemo(page);
}

// Onglets principaux (barre basse). Les autres modules sont accessibles via
// le hub « Plus ».
const PRIMARY_TABS = new Set([
  'Accueil',
  'Audits',
  'Tâches',
  'Formation',
  'Plus',
]);
const MORE_SLUG: Record<string, string> = {
  Produits: 'products',
  Actions: 'actions',
  Messages: 'chat',
  Profil: 'profile',
  Rapports: 'reports',
  Équipe: 'team',
};

/**
 * Ouvre une destination et attend le titre de la page (testID). Les onglets
 * principaux sont cliqués directement ; les modules secondaires passent par le
 * hub « Plus ».
 */
export async function openTab(page: Page, name: string, titleTestId: string) {
  if (PRIMARY_TABS.has(name)) {
    await page.getByRole('tab', { name }).click();
  } else {
    await page.getByRole('tab', { name: 'Plus' }).click();
    await expect(page.getByTestId('page-more-title')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId(`more-link-${MORE_SLUG[name]}`).click();
  }
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
