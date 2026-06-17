import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

/**
 * Test 5 — Produits (mode démo local, 12 produits déterministes).
 * Couvre la modification de stock et l'ajout d'un produit à DLC critique
 * visible dans les alertes DLC du dashboard (store démo partagé).
 */

test.describe('Produits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Produits', 'page-products-title');
  });

  test('liste des produits démo affichée avec stats', async ({ page }) => {
    await expect(page.getByTestId('product-card-demo-prod-1')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('product-stock-demo-prod-1')).toHaveText(
      'Stock: 24',
    );
    await expect(page.getByTestId('products-count-ok')).toBeVisible();
  });

  test('modifier le stock d’un produit persiste dans la liste', async ({
    page,
  }) => {
    await page.getByTestId('product-card-demo-prod-1').click();
    const input = page.getByTestId('product-stock-input');
    await expect(input).toBeVisible({ timeout: 8_000 });
    await input.fill('31');
    await page.getByTestId('product-stock-confirm').click();

    await expect(page.getByTestId('product-stock-demo-prod-1')).toHaveText(
      'Stock: 31',
      { timeout: 10_000 },
    );
  });

  test('scanner un code connu ouvre la fiche de stock du produit', async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem('opspilot_e2e_barcode', '3000000000001'),
    );
    await page.getByTestId('product-scan-button').click();
    await expect(page.getByTestId('barcode-scanner-modal')).toBeVisible();
    await page.getByTestId('barcode-e2e-scan').click();

    await expect(page.getByText('Modifier le stock')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByTestId('product-stock-name')).toHaveText(
      'Yaourt nature x8',
    );
    await expect(page.getByTestId('product-stock-input')).toHaveValue('24');
  });

  test('scanner un code inconnu ouvre l’ajout avec le code prérempli', async ({
    page,
  }) => {
    await page.evaluate(() =>
      localStorage.setItem('opspilot_e2e_barcode', '9999999999999'),
    );
    await page.getByTestId('product-scan-button').click();
    await page.getByTestId('barcode-e2e-scan').click();

    await expect(page.getByTestId('product-add-modal')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByTestId('product-add-barcode')).toHaveValue(
      '9999999999999',
    );
    await page.getByTestId('product-add-name').fill('Produit scanné inconnu');
    await page.getByTestId('product-add-submit').click();
    await expect(page.getByText('Produit scanné inconnu').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('ajouter un produit DLC critique → visible dans la liste et le dashboard', async ({
    page,
  }) => {
    await page.getByTestId('product-add-button').click();
    await expect(page.getByTestId('product-add-modal')).toBeVisible({
      timeout: 8_000,
    });
    await page.getByTestId('product-add-name').fill('Tartare de saumon');
    await page.getByPlaceholder('DLC dans X jours (vide = sans DLC)').fill('1');
    await page.getByTestId('product-add-submit').click();

    // Visible dans la liste produits…
    await expect(page.getByText('Tartare de saumon').first()).toBeVisible({
      timeout: 10_000,
    });

    // …et dans les alertes DLC du dashboard (DLC ≤ 7 jours, tri croissant).
    await page.getByRole('tab', { name: 'Accueil' }).click();
    await expect(
      page.getByText('Carnet de bord terrain', { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('dlc-alerts')).toContainText(
      'Tartare de saumon',
      { timeout: 10_000 },
    );
  });
});
