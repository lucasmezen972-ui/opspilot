import { expect, test } from '@playwright/test';

import { loginAsLocalDemo } from './helpers';

test.use({ timezoneId: 'America/Martinique' });

test.describe('Modales des actions en paysage', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Supabase is intercepted by the helper; these checks never submit a form.
    await loginAsLocalDemo(page);
    await page.goto('./actions');
    await expect(page.getByTestId('page-actions-title')).toBeVisible();
  });

  test('création : échéance et bouton final accessibles sans enregistrer', async ({
    page,
  }) => {
    const initialCount = await page
      .getByTestId('actions-count-open')
      .innerText();
    await page.getByTestId('action-create-button').click();
    const dialog = page.getByRole('dialog', {
      name: 'Nouvelle action corrective',
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('textbox', { name: "Titre de l'action *" })
      .fill('Action fictive de contrôle visuel');
    const description = dialog.getByRole('textbox', {
      name: 'Description',
      exact: true,
    });
    await description.fill('Contrôle en paysage, sans enregistrement.');
    const priority = dialog.getByRole('button', { name: 'Haute', exact: true });
    await priority.scrollIntoViewIfNeeded();
    await priority.click();
    await expect(priority).toHaveAttribute('aria-pressed', 'true');
    const priorityBox = await priority.boundingBox();
    expect(priorityBox?.height).toBeGreaterThanOrEqual(44);
    const dueDate = dialog.getByRole('textbox', { name: 'Échéance (jours)' });
    await dueDate.scrollIntoViewIfNeeded();
    await expect(dueDate).toBeInViewport({ ratio: 1 });
    const submit = page.getByTestId('action-create-submit');
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport({ ratio: 1 });
    await expect(submit).toBeEnabled();
    await dialog.getByRole('button', { name: 'Fermer', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('actions-count-open')).toHaveText(
      initialCount,
    );
  });

  test('clôture : fin du formulaire et commandes restent accessibles', async ({
    page,
  }) => {
    const initialCount = await page
      .getByTestId('actions-count-inprogress')
      .innerText();
    // This seeded action is already in progress; opening it changes no status.
    await page.getByTestId('action-advance-demo-action-2').click();
    const modal = page.getByTestId('action-resolution-modal');
    await expect(modal).toBeVisible();
    const lastControl = modal.getByText('Validation manager obtenue', {
      exact: true,
    });
    await lastControl.scrollIntoViewIfNeeded();
    await expect(lastControl).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId('action-resolution-confirm')).toBeInViewport({
      ratio: 1,
    });
    await expect(page.getByTestId('action-resolution-confirm')).toBeDisabled();
    await expect(page.getByTestId('action-resolution-close')).toBeInViewport({
      ratio: 1,
    });
    await page.getByTestId('action-resolution-close').click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId('actions-count-inprogress')).toHaveText(
      initialCount,
    );
  });

  test('plan : dernière procédure lisible et fermeture toujours accessible', async ({
    page,
  }) => {
    await page.getByTestId('action-plan-demo-action-2').click();
    const modal = page.getByTestId('action-plan-modal');
    await expect(modal).toBeVisible();
    const lastParagraph = modal.getByText('Procédure chaîne du froid', {
      exact: true,
    });
    await lastParagraph.scrollIntoViewIfNeeded();
    await expect(lastParagraph).toBeInViewport({ ratio: 1 });
    await expect(page.getByTestId('action-plan-close')).toBeInViewport({
      ratio: 1,
    });
    await page.getByTestId('action-plan-close').click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId('action-advance-demo-action-2')).toHaveText(
      'Résoudre',
    );
  });
});
