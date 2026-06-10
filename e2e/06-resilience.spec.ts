import { test, expect } from '@playwright/test';

import { loginAsDemo } from './helpers';

test.describe('Résilience', () => {
  test('refresh page — pas de crash', async ({ page }) => {
    await loginAsDemo(page, 'employee');
    await page.reload();
    await page.waitForTimeout(3_000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('navigation rapide entre onglets — pas de crash', async ({ page }) => {
    await loginAsDemo(page, 'employee');

    const tabs = ['Audits', 'Produits', 'Actions', 'Formation'];
    for (const tab of tabs) {
      await page
        .locator(`text=${tab}`)
        .first()
        .click({ timeout: 5_000 })
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('erreur Supabase sur une page — fallback visible', async ({ page }) => {
    await loginAsDemo(page, 'employee');

    // Block Supabase after login
    await page.route('**supabase.co/rest/**', (route) => route.abort());

    // Navigate to a data page — should show loading or empty state, not crash
    await page
      .locator('text=Audits')
      .first()
      .click({ timeout: 5_000 })
      .catch(() => {});
    await page.waitForTimeout(3_000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('perte réseau totale — pas d\'écran blanc', async ({ page }) => {
    await loginAsDemo(page, 'employee');
    await page.route('**/**', (route) => {
      if (route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    await page.reload();
    await page.waitForTimeout(4_000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
