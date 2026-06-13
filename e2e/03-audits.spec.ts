import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab, readCount } from './helpers';

/**
 * Test 3 — Gestion des audits (mode démo local).
 * Couvre le parcours complet : démarrage, questionnaire de clôture,
 * création automatique d'action corrective visible dans l'écran Actions
 * (store démo partagé entre écrans).
 */

test.describe('Gestion des audits', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Audits', 'page-audits-title');
  });

  test('liste des audits démo affichée', async ({ page }) => {
    await expect(
      page.getByText('Contrôle hygiène rayon frais').first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Audit sécurité incendie').first(),
    ).toBeVisible();
  });

  test('bouton créer un audit et bibliothèque de modèles visibles', async ({
    page,
  }) => {
    await expect(page.getByText('Créer un audit', { exact: true })).toBeVisible(
      { timeout: 8_000 },
    );
    await expect(
      page.getByText('Bibliothèque de modèles', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId('audit-template-demo-template-haccp'),
    ).toContainText('HACCP alimentaire');
  });

  test('créer un audit depuis un modèle puis le démarrer', async ({ page }) => {
    const title = 'Audit HACCP équipe matin';
    await page.getByTestId('audit-template-demo-template-haccp').click();
    await expect(page.getByTestId('audit-create-title-input')).toHaveValue(
      'HACCP alimentaire',
    );
    await page.getByTestId('audit-create-title-input').fill(title);
    await page.getByTestId('audit-create-submit').click();

    const card = page
      .locator('[data-testid^="audit-card-"]')
      .filter({ hasText: title });
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.getByText('Démarrer', { exact: true }).click();
    await expect(card.getByText('En cours', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('démarrer un audit en attente le passe en cours', async ({ page }) => {
    await page.getByTestId('audit-start-demo-audit-5').click();
    await expect(page.getByTestId('audit-finish-demo-audit-5')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('clôture avec non-conformité → action corrective visible dans Actions', async ({
    page,
  }) => {
    // Terminer l'audit en cours (demo-audit-4) via le questionnaire.
    await page.getByTestId('audit-finish-demo-audit-4').click();
    await expect(page.getByTestId('audit-questionnaire')).toBeVisible({
      timeout: 10_000,
    });

    // 1re question non conforme, les autres restent conformes.
    await page.getByTestId('question-0-ko').click();
    await page.getByTestId('questionnaire-submit').click();

    // L'audit est clôturé : son bouton « Terminer » disparaît.
    await expect(page.getByTestId('audit-finish-demo-audit-4')).toHaveCount(0, {
      timeout: 10_000,
    });

    // L'action corrective générée est visible dans l'écran Actions
    // et comptée dans « À traiter » (2 actions démo open + 1 générée).
    await openTab(page, 'Actions', 'page-actions-title');
    await expect(
      page
        .getByText(
          'Non-conformité : Les zones de stockage sont propres et rangées',
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 });
    expect(await readCount(page, 'actions-count-open')).toBe(3);
  });

  test('audit structuré : score pondéré, preuve photo et action liée', async ({
    page,
  }) => {
    await page.evaluate(() => localStorage.setItem('opspilot_e2e_camera', '1'));
    await page.getByTestId('audit-finish-demo-audit-7').click();
    await expect(
      page.getByTestId('audit-professional-questionnaire'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Réception', { exact: true })).toBeVisible();
    await expect(page.getByText('Stockage', { exact: true })).toBeVisible();

    await page.getByTestId('audit-item-demo-haccp-item-1-ko').click();
    await page.getByTestId('audit-item-demo-haccp-item-1-photo').click();
    await expect(page.getByTestId('camera-e2e-photo-button')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('camera-e2e-photo-button').click();
    await expect(
      page.getByTestId('audit-item-demo-haccp-item-1-photo'),
    ).toContainText('Preuve jointe');

    await page.getByTestId('audit-professional-submit').click();
    await expect(page.getByTestId('audit-finish-demo-audit-7')).toHaveCount(0, {
      timeout: 10_000,
    });

    await openTab(page, 'Actions', 'page-actions-title');
    await expect(
      page.getByText(
        'Non-conformité : La température des produits frais est-elle conforme ?',
      ),
    ).toBeVisible({ timeout: 10_000 });
    expect(await readCount(page, 'actions-count-open')).toBe(3);
  });
});
