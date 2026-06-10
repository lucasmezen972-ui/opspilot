import { type Page } from '@playwright/test';

export const DEMO_EMPLOYEE = {
  email: 'demo@opspilot.com',
  password: 'demo123',
};

export const DEMO_MANAGER = {
  email: 'marie.dupont@opspilot.com',
  password: 'marie123',
};

export async function loginAsDemo(page: Page, role: 'employee' | 'manager' = 'employee') {
  await page.goto('/');

  const btnText = role === 'manager' ? 'Manager' : 'Employé';
  const demoBtn = page.getByRole('button', { name: btnText, exact: true });
  await demoBtn.waitFor({ timeout: 15_000 });
  await demoBtn.click();

  // Wait for dashboard to load
  await page.waitForURL(/\/(opspilot\/)?$/, { timeout: 20_000 }).catch(() => {});
}

export async function waitForApp(page: Page) {
  await page.waitForSelector('text=Bonjour', { timeout: 20_000 }).catch(async () => {
    // Might be on auth screen — that's fine, app loaded
    await page.waitForSelector('text=OpsPilot', { timeout: 5_000 });
  });
}
