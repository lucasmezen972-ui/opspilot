import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

test.describe('Assistant IA OpsPilot', () => {
  test('répond avec les KPIs démo même lorsque Supabase est bloqué', async ({
    page,
  }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Messages', 'page-messages-title');

    await page.getByTestId('conversation-demo-ai').click();
    await expect(page.getByText('Assistant IA disponible')).toBeVisible();

    await page
      .getByTestId('chat-message-input')
      .fill('Quels audits sont en retard ?');
    await page.getByTestId('chat-send-button').click();

    await expect(page.getByTestId('chat-user-message')).toHaveText(
      'Quels audits sont en retard ?',
    );
    await expect(page.getByTestId('chat-assistant-message')).toContainText(
      'en retard',
      { timeout: 10_000 },
    );
    await expect(page.getByTestId('chat-assistant-message')).toContainText(
      'Commencez par le plus ancien',
    );
    await expect(page.getByTestId('chat-assistant-loading')).toHaveCount(0);
  });
});
