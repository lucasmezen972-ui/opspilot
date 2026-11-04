import { test, expect } from '@playwright/test';
import { loginAsLocalDemo } from './helpers';

test.use({ timezoneId: 'America/Martinique' });
for (const width of [375, 1440]) {
  test(`supervision : filtres compacts et liste visible à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await loginAsLocalDemo(page);
    await page.goto('./training');
    await page.getByRole('tab', { name: 'Supervision', exact: true }).click();
    const chip = page.getByTestId('training-supervision-filter-all');
    const box = await chip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeLessThanOrEqual(64);
    await expect(
      page.locator('[data-testid^="training-supervision-member-"]').first(),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/evidence/2026-11-03/accessibility-panels/supervision-fixed-${width}.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 80,
    });
  });
}
for (const [route, first, second] of [
  ['chat', 'Messages', 'Canaux'],
  ['training', 'Catalogue', 'Supervision'],
  ['manager', 'Cockpit', 'Détails'],
]) {
  test(`${route} : la barre mobile reste visible après focus du panneau`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await loginAsLocalDemo(page);
    await page.goto(`./${route}`);
    const tab = page.getByRole('tab', { name: first, exact: true });
    await tab.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('tabpanel', { name: second, exact: true }),
    ).toBeFocused();
    const home = page.getByRole('tab', { name: 'Accueil', exact: true });
    await expect(home).toBeInViewport();
    const bounds = await home.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    await page.screenshot({
      path: `docs/evidence/2026-11-03/accessibility-panels/panel-fixed-${route}-375.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 80,
    });
  });
}
