import { expect, test } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

test.describe('Réglages utilisateur', () => {
  test('modifie le profil et les notifications sans Supabase', async ({
    page,
  }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Profil', 'page-profile-title');

    await page.getByTestId('profile-settings-button').click();
    await expect(page.getByTestId('page-settings-title')).toHaveText(
      'Réglages',
    );

    await page.getByTestId('settings-full-name-input').fill('Demo Responsable');
    await page.getByTestId('settings-phone-input').fill('+596 696 12 34 56');
    await page.getByTestId('settings-profile-save').click();
    await expect(page.getByTestId('settings-feedback')).toHaveText(
      'Profil mis à jour.',
    );

    await page.getByTestId('settings-notification-weekly').click();
    await page.getByTestId('settings-notifications-save').click();
    await expect(page.getByTestId('settings-feedback')).toHaveText(
      'Préférences enregistrées.',
    );

    await page.getByTestId('settings-password-input').fill('motdepasse-demo');
    await page
      .getByTestId('settings-password-confirmation-input')
      .fill('motdepasse-demo');
    await page.getByTestId('settings-password-save').click();
    await expect(page.getByTestId('settings-feedback')).toContainText(
      'démo locale',
    );

    await page.getByTestId('settings-back-button').click();
    await expect(page.getByTestId('page-profile-title')).toBeVisible();
    await expect(
      page.getByText('Demo Responsable', { exact: true }),
    ).toBeVisible();
  });
});
