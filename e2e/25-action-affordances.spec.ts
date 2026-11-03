import { expect, test } from '@playwright/test';

import { loginAsLocalDemo, waitForVisualLayout } from './helpers';

const evidence = 'docs/evidence/2026-11-03/action-affordances';
test.use({ timezoneId: 'America/Martinique', reducedMotion: 'reduce' });

for (const width of [320, 1440]) {
  test(`les liens terrain et les outils ouvrent leur destination à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await loginAsLocalDemo(page);
    await waitForVisualLayout(page);
    const kpi = page.getByTestId('kpi-audits-done-value');
    // A displayed measure is information, not a disguised button.
    await expect(kpi).toBeVisible();
    expect(
      await kpi.evaluate((el) =>
        el.closest('button, a, [role="button"], [role="link"]'),
      ),
    ).toBeNull();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${evidence}/after-home-${width}.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
    const product = page.getByRole('link', {
      name: /Jambon blanc.*Ouvrir les produits/,
    });
    await product.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${evidence}/after-product-links-${width}.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
    await product.click();
    await expect(page.getByTestId('page-products-title')).toBeVisible();
    await page.goto('./');
    const audit = page.getByRole('link', {
      name: /Tournée propreté parking.*Ouvrir les audits/,
    });
    await audit.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${evidence}/after-audit-links-${width}.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
    await expect(audit).toHaveAttribute('href', /\/audits$/);
    await audit.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('page-audits-title')).toBeVisible();
    await page.goto('./more');
    await expect(page.getByTestId('page-more-title')).toBeVisible();
    await waitForVisualLayout(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${evidence}/after-more-${width}.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
    await page.getByTestId('more-link-products').click();
    await expect(page.getByTestId('page-products-title')).toBeVisible();
    await page.goto('./profile');
    const notifications = page.getByRole('button', {
      name: 'Notifications',
      exact: true,
    });
    await notifications.scrollIntoViewIfNeeded();
    await waitForVisualLayout(page);
    await page.screenshot({
      path: `${evidence}/after-profile-menu-${width}.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
    await notifications.click();
    await expect(page.getByTestId('page-settings-title')).toBeVisible();
  });
}

test('survol, focus et activation Espace/Entrée de la traçabilité', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await loginAsLocalDemo(page);
  const toggle = page.getByRole('button', {
    name: 'Preuves et traçabilité',
    exact: true,
  });
  const rest = await toggle.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await toggle.hover();
  await expect
    .poll(() => toggle.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(rest);
  await page.keyboard.press('Tab');
  await toggle.focus();
  await expect
    .poll(() => toggle.evaluate((el) => getComputedStyle(el).outlineStyle))
    .toBe('solid');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('dashboard-field-evidence')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('dashboard-field-evidence')).toHaveCount(0);
  await page.screenshot({
    path: `${evidence}/after-keyboard-focus.jpg`,
    type: 'jpeg',
    animations: 'disabled',
    quality: 80,
  });
});

test('la commande Ajouter est inactive sans nom, puis devient disponible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await loginAsLocalDemo(page);
  await page.goto('./products');
  await page.getByTestId('product-add-button').click();
  const submit = page.getByTestId('product-add-submit');
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute('aria-disabled', 'true');
  await expect(
    page.getByText('Le nom du produit est obligatoire.', { exact: true }),
  ).toBeVisible();
  const disabledColor = await submit.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  const box = await submit.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page.getByTestId('product-add-modal')).toBeVisible();
  await page.screenshot({
    path: `${evidence}/after-disabled-375.jpg`,
    type: 'jpeg',
    animations: 'disabled',
    quality: 80,
  });
  await page
    .getByTestId('product-add-name')
    .fill('Produit fictif, ne pas enregistrer');
  await expect(submit).toBeEnabled();
  expect(
    await submit.evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(disabledColor);
  await page.screenshot({
    path: `${evidence}/after-enabled-375.jpg`,
    type: 'jpeg',
    animations: 'disabled',
    quality: 80,
  });
  await page.getByTestId('product-add-modal-close').click();
  await expect(page.getByTestId('product-add-modal')).toHaveCount(0);
});

test('pendant une connexion interceptée, le bouton indique son attente et se bloque', async ({
  page,
}) => {
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route(/supabase\.co/, async (route) => {
    if (
      route.request().url().includes('/auth/v1/token') &&
      route.request().method() === 'POST'
    ) {
      started();
      await held;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Échec fictif du contrôle navigateur',
        }),
      });
    } else await route.abort();
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('./');
  await page
    .getByTestId('email-input')
    .fill('controle-interface@example.invalid');
  await page.getByTestId('password-input').fill('Fixture-interface-seulement');
  const submit = page.getByTestId('auth-submit-button');
  try {
    await submit.click();
    await requested;
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await expect(submit).toContainText('Connexion...');
    await page.screenshot({
      path: `${evidence}/after-loading-375.jpg`,
      type: 'jpeg',
      animations: 'disabled',
      quality: 80,
    });
  } finally {
    release();
  }
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveAttribute('aria-busy', 'false');
});

for (const [width, height] of [
  [375, 812],
  [812, 375],
]) {
  test(`création de tâche : commandes accessibles à ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await loginAsLocalDemo(page);
    await page.goto('./tasks');
    await page
      .getByRole('button', { name: 'Nouvelle tâche', exact: true })
      .click();
    const submit = page.getByTestId('task-create-submit');
    await expect(submit).toBeDisabled();
    await submit.scrollIntoViewIfNeeded();
    const bounds = await submit.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(16);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height - 15);
    await page.screenshot({
      path: `${evidence}/after-task-create-${width}.jpg`,
      type: 'jpeg',
      quality: 80,
      animations: 'disabled',
    });
    await page
      .getByPlaceholder('Titre de la tâche', { exact: true })
      .fill('Contrôle fictif sans enregistrement');
    await expect(submit).toBeEnabled();
    await page
      .getByRole('button', { name: 'Fermer la création de tâche', exact: true })
      .click();
    await expect(page.getByTestId('task-create-modal')).toHaveCount(0);
  });
}
