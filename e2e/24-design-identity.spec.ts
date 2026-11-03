import { expect, test } from '@playwright/test';

import { loginAsLocalDemo, waitForVisualLayout } from './helpers';
import { signedInFixture } from './billingFixture';

test.use({ timezoneId: 'America/Martinique' });

for (const [width, height] of [
  [320, 812],
  [1920, 1080],
]) {
  test(`identité et redistribution à ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loginAsLocalDemo(page);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('600 16px "OpsPilot Sans"');
    });
    expect(loaded).toBe(true);
    const title = page.getByTestId('page-home-title');
    await expect(title).toBeVisible();
    expect(
      await title.evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain('OpsPilot Sans');
    for (const route of ['home', 'manager', 'more', 'profile']) {
      await page.goto(route === 'home' ? './' : `./${route}`);
      await expect(
        route === 'manager'
          ? page.getByRole('heading', { name: 'Cockpit Manager', exact: true })
          : page.getByTestId(`page-${route}-title`),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        route,
      ).toBe(true);
      await waitForVisualLayout(page);
      await page.screenshot({
        path: `docs/evidence/2026-11-03/identity/after-${route}-${width}.jpg`,
        animations: 'disabled',
        type: 'jpeg',
        quality: 80,
      });
    }
    await page.getByTestId('profile-settings-button').click();
    await expect(page.getByTestId('page-settings-title')).toBeVisible();
  });
}

test('texte agrandi : navigation et actions restent accessibles', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loginAsLocalDemo(page);
  // Double actual rendered text metrics without changing the layout viewport.
  await page.evaluate(() => {
    const metrics = Array.from(
      document.querySelectorAll<HTMLElement>('[dir="auto"]'),
    )
      .filter((el) => !el.style.fontFamily)
      .map((el) => {
        const style = getComputedStyle(el);
        return {
          el,
          size: parseFloat(style.fontSize),
          line: parseFloat(style.lineHeight),
        };
      });
    for (const { el, size, line } of metrics) {
      el.style.setProperty('font-size', `${size * 2}px`, 'important');
      el.style.setProperty(
        'line-height',
        `${Number.isFinite(line) ? line * 2 : size * 2.8}px`,
        'important',
      );
    }
  });
  await expect(page.getByTestId('page-home-title')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  const nav = page.getByTestId('desktop-navigation');
  expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
    true,
  );
  await page.screenshot({
    path: 'docs/evidence/2026-11-03/identity/after-home-text200.jpg',
    animations: 'disabled',
    type: 'jpeg',
    quality: 80,
  });
  const action = page.getByTestId('dashboard-field-brief-action');
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport();
  await action.click();
  await expect(page.getByTestId('page-actions-title')).toBeVisible();
});

test('priorité mobile et traçabilité dépliable au clavier', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loginAsLocalDemo(page);
  await expect(page.getByTestId('dashboard-field-brief-action')).toBeInViewport(
    { ratio: 1 },
  );
  const toggle = page.getByRole('button', {
    name: 'Preuves et traçabilité',
    exact: true,
  });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('dashboard-field-evidence')).toContainText(
    'Preuve attendue',
  );
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('dashboard-field-evidence')).toHaveCount(0);
});

test('chargement et erreur ne donnent pas de faux bilan terrain', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signedInFixture(page);
  let unavailable = true;
  let releaseFirst!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  await page.route(/\/rest\/v1\/audits(?:\?|$)/, async (route) => {
    if (unavailable) {
      await gate;
      await route.fulfill({
        status: 500,
        json: { message: 'fixture unavailable' },
      });
    } else {
      await route.fulfill({ json: [] });
    }
  });
  try {
    await page.goto('./');
    await expect(page.getByTestId('home-data-loading')).toBeVisible();
    await expect(page.getByTestId('dashboard-field-brief')).toHaveCount(0);
    releaseFirst();
    await expect(page.getByTestId('home-data-error')).toBeVisible();
    await expect(page.getByTestId('dashboard-field-brief')).toHaveCount(0);
    await expect(page.locator('[data-testid^="kpi-"]')).toHaveCount(0);
    await waitForVisualLayout(page);
    await page.screenshot({
      path: 'docs/evidence/2026-11-03/identity/after-home-error-375.jpg',
      animations: 'disabled',
      type: 'jpeg',
      quality: 80,
    });
    unavailable = false;
    await page.getByTestId('home-data-error-retry').click();
    await expect(page.getByTestId('home-data-error')).toHaveCount(0);
    await expect(page.getByTestId('dashboard-field-brief')).toBeVisible();
    await expect(page.getByTestId('kpi-audits-overdue-value')).toHaveText('0');
  } finally {
    releaseFirst();
  }
});

test('cockpit ordinateur : les signaux restent groupés et les risques remontent', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await loginAsLocalDemo(page);
  await page.goto('./manager');
  await expect(page.getByTestId('cockpit-kpi-overdue-audits')).toBeVisible();
  await waitForVisualLayout(page);
  const boxes = await Promise.all(
    ['overdue-audits', 'critical-actions', 'open-actions'].map((id) =>
      page.getByTestId(`cockpit-kpi-${id}`).boundingBox(),
    ),
  );
  expect(boxes.every(Boolean)).toBe(true);
  expect(Math.abs(boxes[0]!.y - boxes[2]!.y)).toBeLessThan(1);
  const risks = await page
    .getByText('Risques prioritaires', { exact: true })
    .boundingBox();
  expect(risks!.y).toBeLessThan(460);
});
