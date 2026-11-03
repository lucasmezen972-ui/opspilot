import { expect, test } from '@playwright/test';

import { signedInFixture } from './billingFixture';

for (const viewport of [
  { width: 375, height: 812 },
  { width: 1440, height: 1000 },
])
  test(`SEPA : accord, disponibilité et résiliation à ${viewport.width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize(viewport);
    let ready = false;
    const calls: Record<string, unknown>[] = [];
    const agreement = {
      id: '90000000-0000-4000-a000-000000000003',
      request_id: '90000000-0000-4000-a000-000000000004',
      organization_name: 'Entreprise fictive de contrôle',
      plan: 'essential',
      status: 'draft',
      amount_cents: 19900,
      interval_months: 1,
      first_paid_until: '2026-12-02T23:59:59Z',
      next_charge_date: '2026-12-03',
      provider_next_charge_date: null,
      consented_at: null,
      mandate_ready: false,
      invoice_reference: 'TEST-UI-ONLY',
      payments: [],
    };
    await signedInFixture(page, 'admin', (path, request) => {
      if (path.endsWith('/rpc/get_sepa_agreements')) return [agreement];
      if (path.endsWith('/functions/v1/mollie-recurring')) {
        const body = request.postDataJSON();
        if (body.action === 'status') return { configured: true, ready };
        calls.push(body);
        if (body.action === 'authorize') {
          agreement.status = 'awaiting_first_payment';
          return {
            payment_url: 'https://checkout.mollie.com/checkout/test-ui-only',
          };
        }
        if (body.action === 'cancel') {
          agreement.status = 'canceled';
          return { canceled: true };
        }
        return { refreshed: true };
      }
    });
    await context.route('https://checkout.mollie.com/**', (route) =>
      route.fulfill({
        body: 'Fictitious checkout — no provider request',
        contentType: 'text/plain',
      }),
    );
    await page.goto('./billing');
    const panel = page.getByTestId('sepa-panel');
    const authorize = panel.getByRole('button', {
      name: 'Accepter et ouvrir ma banque avec Mollie',
      exact: true,
    });
    await expect(authorize).toBeDisabled();
    await expect(panel).toContainText(
      'Activation Mollie et configuration en attente',
    );
    ready = true;
    await panel
      .getByRole('button', {
        name: 'Actualiser le calendrier SEPA',
        exact: true,
      })
      .click();
    await expect(panel).toContainText(
      'Le service peut recevoir les autorisations',
    );
    await expect(authorize).toBeDisabled();
    await panel.getByRole('checkbox').click();
    await expect(authorize).toBeEnabled();
    const popup = context.waitForEvent('page');
    await authorize.click();
    await (await popup).close();
    await expect(panel).toContainText('Premier règlement attendu');
    expect(calls[0]).toEqual({
      action: 'authorize',
      agreement_id: agreement.id,
      accepted: true,
    });
    await panel.scrollIntoViewIfNeeded();
    await panel.screenshot({
      path: `test-results/design-sepa-${viewport.width}.jpg`,
      type: 'jpeg',
      quality: 80,
    });
    page.once('dialog', (dialog) => dialog.accept());
    await panel
      .getByRole('button', {
        name: 'Arrêter les prochaines échéances',
        exact: true,
      })
      .click();
    await expect(panel).toContainText('Prélèvements arrêtés');
    expect(calls.at(-1)?.action).toBe('cancel');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
