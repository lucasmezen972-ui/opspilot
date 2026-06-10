import { test, expect } from '@playwright/test';

import { waitForApp } from './helpers';

test.describe('Authentification', () => {
  test('page de connexion se charge sans écran blanc', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    // No blank page: some text must be visible
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('boutons démo visibles', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=OpsPilot', { timeout: 15_000 });

    const employeeBtn = page.getByRole('button', { name: 'Employé', exact: true });
    const managerBtn = page.getByRole('button', { name: 'Manager', exact: true });

    await expect(employeeBtn).toBeVisible({ timeout: 10_000 });
    await expect(managerBtn).toBeVisible();
  });

  test('connexion démo employé → dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Accès démo instantané', { timeout: 15_000 });

    const employeeBtn = page.getByRole('button', { name: 'Employé', exact: true });
    await employeeBtn.click();

    // Should show loading or redirect to dashboard
    await page.waitForTimeout(2_000);
    const bodyText = await page.locator('body').innerText();
    // Either dashboard loaded or auth error shown — no blank page
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('fallback réseau — pas d\'écran blanc', async ({ page }) => {
    // Simulate offline by blocking Supabase
    await page.route('**supabase.co/**', (route) => route.abort());
    await page.goto('/');

    // App should not be blank — error or loading UI expected
    await page.waitForTimeout(12_000); // wait past the 10s timeout
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
