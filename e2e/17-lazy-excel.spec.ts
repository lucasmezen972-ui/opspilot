import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';

import { loginAsLocalDemo, openTab } from './helpers';

test('le moteur Excel chargé à la demande produit un vrai classeur', async ({
  page,
}) => {
  await loginAsLocalDemo(page);
  await openTab(page, 'Rapports', 'page-reports-title');
  const download = page.waitForEvent('download');
  await page.getByTestId('direction-export-xlsx').click();
  const result = await download;
  expect(result.suggestedFilename()).toMatch(/^rapport-direction-.*\.xlsx$/);
  const path = await result.path();
  expect(path).toBeTruthy();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
  expect(bytes.length).toBeGreaterThan(1000);
});
