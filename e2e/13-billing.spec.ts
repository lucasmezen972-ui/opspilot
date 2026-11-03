import { expect, test } from '@playwright/test';

import { loginAsLocalDemo } from './helpers';

test('la facturation refuse le manager démo et ne crée aucun paiement', async ({
  page,
}) => {
  await loginAsLocalDemo(page);
  const calls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/functions/v1/mollie-'))
      calls.push(request.url());
  });
  await page.goto('./billing');
  await expect(page.getByTestId('access-denied-screen')).toBeVisible();
  await expect(
    page.getByText('Passer à Essential', { exact: true }),
  ).toHaveCount(0);
  expect(calls).toEqual([]);
});
