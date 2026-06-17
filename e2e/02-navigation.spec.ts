import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

/**
 * Test 2 — Navigation principale
 * Chaque onglet doit afficher le titre de sa page (testID dédié).
 */

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
  });

  const tabs = [
    { name: 'Audits', titleTestId: 'page-audits-title' },
    { name: 'Produits', titleTestId: 'page-products-title' },
    { name: 'Actions', titleTestId: 'page-actions-title' },
    { name: 'Tâches', titleTestId: 'page-tasks-title' },
    { name: 'Rapports', titleTestId: 'page-reports-title' },
    { name: 'Formation', titleTestId: 'page-training-title' },
    { name: 'Messages', titleTestId: 'page-messages-title' },
    { name: 'Profil', titleTestId: 'page-profile-title' },
  ];

  for (const tab of tabs) {
    test(`onglet ${tab.name} affiche sa page`, async ({ page }) => {
      await openTab(page, tab.name, tab.titleTestId);
    });
  }

  test('refresh navigateur — session démo conservée', async ({ page }) => {
    await page.reload();
    await expect(
      page.getByText('Carnet de bord terrain', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
