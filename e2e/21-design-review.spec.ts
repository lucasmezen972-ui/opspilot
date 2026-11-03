import { expect, test } from '@playwright/test';
import { loginAsLocalDemo } from './helpers';
import { signedInFixture } from './billingFixture';

test.use({ timezoneId: 'America/Martinique' });

const stage = process.env.OPSPILOT_DESIGN_STAGE ?? 'after';
for (const [width, height] of [
  [375, 812],
  [768, 1024],
  [812, 375],
  [1440, 960],
]) {
  test(`lecture et navigation des modules à ${width}x${height}`, async ({
    page,
  }) => {
    test.setTimeout(100_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAsLocalDemo(page);
    for (const route of [
      'home',
      'audits',
      'tasks',
      'training',
      'products',
      'actions',
      'reports',
      'chat',
      'team',
      'manager',
      'profile',
      'more',
      'commercial',
      'backoffice',
    ]) {
      await page.goto(route === 'home' ? './' : `./${route}`);
      await expect(
        page.getByRole('tab', { name: 'Accueil', exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId('demo-login-button')).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} déborde horizontalement`,
      ).toBe(true);
      await page.screenshot({
        path: `docs/evidence/2026-11-03/design/${stage}-${route}-${width}.jpg`,
        type: 'jpeg',
        quality: 75,
      });
    }
    await page.getByRole('tab', { name: 'Plus', exact: true }).click();
    await expect(page.getByTestId('page-more-title')).toBeVisible();
    await page.getByTestId('more-link-products').click();
    await expect(page.getByTestId('page-products-title')).toBeVisible();
    if (stage === 'after' && width >= 1024) {
      await expect(page.getByTestId('desktop-navigation')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Produits', exact: true }),
      ).toHaveAttribute('aria-current', 'page');
      const target = await page
        .getByRole('link', { name: 'Produits', exact: true })
        .boundingBox();
      expect(target?.height).toBeGreaterThanOrEqual(44);
    }
  });
  test(`connexion lisible à ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route(/supabase\.co/, (route) => route.abort());
    await page.goto('./');
    await expect(
      page.getByRole('textbox', { name: 'Adresse e-mail', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Adresse e-mail', { exact: true }),
    ).toBeVisible();
    await page.getByTestId('auth-submit-button').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('auth-submit-button')).toBeInViewport();
    await page.screenshot({
      path: `docs/evidence/2026-11-03/design/${stage}-auth-${width}.jpg`,
      type: 'jpeg',
      quality: 75,
    });
  });
  test(`facturation lisible à ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await signedInFixture(page);
    await page.goto('./billing');
    await expect(
      page.getByText('Abonnement', { exact: true }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/evidence/2026-11-03/design/${stage}-billing-${width}.jpg`,
      type: 'jpeg',
      quality: 75,
    });
  });
}
