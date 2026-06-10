import { expect, test } from '@playwright/test';

test('la politique de confidentialité est publique', async ({ page }) => {
  await page.goto('legal/confidentialite');

  await expect(
    page.getByText('Politique de confidentialité', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Qui traite vos données ?')).toBeVisible();
  await expect(page.getByText('Connexion Démo')).not.toBeVisible();
});
