import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab, readCount } from './helpers';

/**
 * Test 4 — Actions correctives (mode démo local, données déterministes :
 * 2 actions « open », 1 « in_progress », 2 « done »).
 */

test.describe('Actions correctives', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Actions', 'page-actions-title');
  });

  test('compteurs initiaux cohérents avec les données démo', async ({
    page,
  }) => {
    expect(await readCount(page, 'actions-count-open')).toBe(2);
    expect(await readCount(page, 'actions-count-inprogress')).toBe(1);
    await expect(
      page.getByTestId('action-card-demo-action-1'),
    ).toBeVisible();
  });

  test('créer une action met à jour la liste et les compteurs', async ({
    page,
  }) => {
    const openBefore = await readCount(page, 'actions-count-open');

    await page.getByTestId('action-create-button').click();
    await page
      .getByTestId('action-create-title')
      .fill('Vérifier la signalétique allergènes');
    await page.getByTestId('action-create-submit').click();

    await expect(
      page.getByText('Vérifier la signalétique allergènes').first(),
    ).toBeVisible({ timeout: 10_000 });
    expect(await readCount(page, 'actions-count-open')).toBe(openBefore + 1);
  });

  test('avancer une action : open → in_progress → done', async ({ page }) => {
    const openBefore = await readCount(page, 'actions-count-open');
    const inProgressBefore = await readCount(page, 'actions-count-inprogress');

    // Démarrer (open → in_progress)
    await page.getByTestId('action-advance-demo-action-1').click();
    await expect(page.getByTestId('actions-count-open')).toHaveText(
      String(openBefore - 1),
    );
    await expect(page.getByTestId('actions-count-inprogress')).toHaveText(
      String(inProgressBefore + 1),
    );

    // Résoudre (in_progress → done)
    await page.getByTestId('action-advance-demo-action-1').click();
    await expect(page.getByTestId('actions-count-inprogress')).toHaveText(
      String(inProgressBefore),
    );
    await expect(page.getByTestId('action-advance-demo-action-1')).toHaveCount(
      0,
    );
  });

  test('vue Kanban affiche les trois colonnes', async ({ page }) => {
    await page.getByTestId('actions-view-kanban').click();
    await expect(
      page.getByText('À traiter', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('En cours', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('Résolues', { exact: true }).first(),
    ).toBeVisible();
  });
});
