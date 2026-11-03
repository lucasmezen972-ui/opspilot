import { expect, test } from '@playwright/test';
import { loginAsLocalDemo } from './helpers';

test.use({ timezoneId: 'America/Martinique' });
const evidenceDir =
  process.env.OPSPILOT_DESIGN_EVIDENCE_DIR ?? 'docs/evidence/2026-11-03/design';

for (const [width, height] of [
  [375, 812],
  [812, 375],
  [1440, 900],
]) {
  test(`formulaires accessibles et défilables à ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await loginAsLocalDemo(page);
    await page.goto('./products');
    await page.getByTestId('product-add-button').click();
    await expect(
      page.getByRole('dialog', { name: 'Ajouter un produit', exact: true }),
    ).toBeVisible();
    const name = page.getByRole('textbox', {
      name: 'Nom du produit, obligatoire',
      exact: true,
    });
    await expect(name).toBeVisible();
    await name.fill('Produit fictif de contrôle visuel');
    const barcode = page.getByRole('textbox', {
      name: 'Code-barres, optionnel',
      exact: true,
    });
    await barcode.fill('0123456789012');
    await expect(barcode).toBeInViewport();
    await expect(page.getByTestId('product-add-submit')).toBeVisible();
    await page.getByTestId('product-add-modal-close').click();
    await expect(page.getByTestId('product-add-modal')).toHaveCount(0);
    await page.goto('./tasks');
    await page
      .getByRole('button', { name: 'Terminer la tâche', exact: true })
      .first()
      .click();
    await page.getByTestId('task-completion-name').fill('Personne fictive');
    await page
      .getByTestId('task-completion-comment')
      .fill('Contrôle de lisibilité, sans enregistrement.');
    await page.getByTestId('task-completion-submit').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('task-completion-submit')).toBeInViewport();
    await expect(page.getByTestId('task-completion-name')).toHaveAccessibleName(
      'Réalisé par *',
    );
    await page.screenshot({
      path: `${evidenceDir}/after-task-form-${width}.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 75,
    });
    await page.getByTestId('task-completion-modal-close').click();
    await expect(page.getByTestId('task-completion-modal')).toHaveCount(0);
  });
}

test('navigation clavier et lien vers le contenu sur ordinateur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await loginAsLocalDemo(page);
  await page.goto('./');
  await expect(page.getByTestId('page-home-title')).toBeVisible();
  await expect(page.getByTestId('desktop-navigation')).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', {
    name: 'Aller au contenu',
    exact: true,
  });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await skip.press('Enter');
  await expect(page.locator('#opspilot-main')).toBeFocused();
  const audits = page.getByRole('tab', { name: 'Audits', exact: true });
  await audits.focus();
  await audits.press('ArrowDown');
  await expect(
    page.getByRole('tab', { name: 'Tâches', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(audits).toBeFocused();
  await audits.press('Enter');
  await expect(page.getByTestId('page-audits-title')).toBeVisible();
  await expect(audits).toHaveAttribute('aria-selected', 'true');
  const focusColor = await audits.evaluate(
    (el) => getComputedStyle(el).outlineColor,
  );
  expect(focusColor).toBe('rgb(37, 99, 235)');
  const training = page.getByRole('tab', { name: 'Formation', exact: true });
  await training.focus();
  await training.press('Space');
  await expect(page.getByTestId('page-training-title')).toBeVisible();
  await expect(training).toHaveAttribute('aria-selected', 'true');
});
