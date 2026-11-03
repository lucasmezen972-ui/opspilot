import { expect, test } from '@playwright/test';

import { signedInFixture } from './billingFixture';

for (const width of [375, 1440]) {
  test(`facturation : erreur, reprise et demande confirmée à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    let readFails = true;
    let writes = 0;
    const invoice = {
      id: '90000000-0000-4000-a000-000000000004',
      organization_id: '90000000-0000-4000-a000-000000000002',
      status: 'requested',
      plan: 'essential',
      payment_url: null,
      qonto_reference: null,
    };
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });
    await signedInFixture(page, 'admin', (path) => {
      if (path.endsWith('/rpc/request_qonto_billing')) {
        writes++;
        readFails = true;
        return invoice;
      }
    });
    await page.route(/\/rest\/v1\/billing_requests(?:\?|$)/, (route) =>
      route.fulfill(
        readFails
          ? {
              status: 403,
              json: { code: '42501', message: 'Fictitious read failure' },
            }
          : { json: [] },
      ),
    );
    await page.goto('./billing');
    const status = page.getByTestId('billing-invoice-status');
    await expect(status.getByRole('alert')).toContainText(
      'ne peuvent pas être actualisées',
    );
    await expect(status).not.toContainText('Aucune demande');
    const upgrade = page.getByRole('button', {
      name: 'Passer à Essential',
      exact: true,
    });
    await expect(upgrade).toBeDisabled();
    readFails = false;
    await status
      .getByRole('button', { name: 'Réessayer le chargement des factures' })
      .click();
    await expect(upgrade).toBeEnabled();
    await upgrade.click();
    await expect
      .poll(() =>
        dialogs.some((message) => message.includes('Demande enregistrée')),
      )
      .toBe(true);
    expect(
      dialogs.some((message) => message.includes('Demande impossible')),
    ).toBe(false);
    expect(writes).toBe(1);
    await expect(
      page.getByText('Facture Qonto — essential : préparation en cours'),
    ).toBeVisible();
    await expect(upgrade).toBeDisabled();
    await status.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/evidence/2026-11-03/billing-recovery-${width}.jpg`,
      fullPage: false,
      animations: 'disabled',
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test(`abonnement : pas d’essai inventé après erreur à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    let fails = true;
    await signedInFixture(page);
    await page.route(/\/rest\/v1\/subscriptions(?:\?|$)/, (route) =>
      route.fulfill(
        fails
          ? {
              status: 403,
              json: {
                code: '42501',
                message: 'Fictitious subscription failure',
              },
            }
          : {
              json: {
                id: 'fixture-sub',
                plan: 'essential',
                status: 'active',
                current_period_end: '2026-12-01T23:59:59Z',
              },
            },
      ),
    );
    await page.goto('./billing');
    await expect(page.getByTestId('billing-subscription-error')).toContainText(
      'Abonnement non vérifié',
    );
    await expect(page.getByText('jours restants', { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole('button', { name: 'Passer à Essential' }),
    ).toBeDisabled();
    fails = false;
    await page
      .getByRole('button', { name: 'Réessayer le chargement de l’abonnement' })
      .click();
    await expect(page.getByText(/Accès réglé jusqu’au/)).toBeVisible();
    await expect(page.getByText(/Renouvelle le/)).toHaveCount(0);
  });
}

test('back-office : une erreur de calendrier SEPA bloque les contrôles de facture', async ({
  page,
}) => {
  let fails = true;
  await signedInFixture(page, 'superadmin', (path) => {
    if (path.endsWith('/billing_requests'))
      return [
        {
          id: '90000000-0000-4000-a000-000000000004',
          organization_id: '90000000-0000-4000-a000-000000000002',
          plan: 'essential',
          status: 'requested',
        },
      ];
    if (path.endsWith('/rpc/superadmin_organizations'))
      return [
        {
          id: '90000000-0000-4000-a000-000000000002',
          name: 'Entreprise fictive de contrôle',
        },
      ];
  });
  await page.route(/\/rpc\/get_sepa_agreements$/, (route) =>
    route.fulfill(
      fails
        ? {
            status: 403,
            json: { code: '42501', message: 'Fictitious calendar failure' },
          }
        : { json: [] },
    ),
  );
  await page.goto('./billing');
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Les factures et leurs calendriers' }),
  ).toBeVisible();
  await expect(
    page.getByText('Aucune demande en attente.', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('Lien de paiement Qonto', { exact: true }),
  ).toHaveCount(0);
  fails = false;
  await page
    .getByRole('button', {
      name: 'Actualiser les demandes de facturation',
      exact: true,
    })
    .click();
  const request = page.getByRole('button', {
    name: /Entreprise fictive de contrôle.*facture à préparer/,
  });
  await expect(request).toBeEnabled();
  await request.click();
  await expect(
    page.getByLabel('Lien de paiement Qonto', { exact: true }),
  ).toBeVisible();
});
