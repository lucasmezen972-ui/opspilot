import { expect, test } from '@playwright/test';
import { loginAsLocalDemo, waitForVisualLayout } from './helpers';
import { signedInFixture } from './billingFixture';

const evidence = 'docs/evidence/2026-11-03/accessibility-journeys';
test.use({ timezoneId: 'America/Martinique' });

test('salarié : catalogue sans onglet ni arrêt clavier de supervision', async ({
  page,
}) => {
  await signedInFixture(page, 'employee');
  await page.goto('./training');
  await expect(page.getByTestId('page-training-title')).toBeVisible();
  await expect(
    page.getByRole('tablist', { name: 'Vues de la formation' }),
  ).toHaveCount(0);
  await expect(page.locator('#training-views-panel')).not.toHaveAttribute(
    'tabindex',
    '0',
  );
});

for (const width of [375, 1440]) {
  test(`tâche : saisie nommée, choix au clavier, fermeture et retour à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await loginAsLocalDemo(page);
    await page.goto('./tasks');
    const trigger = page.getByRole('button', {
      name: 'Nouvelle tâche',
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', {
      name: 'Nouvelle tâche',
      exact: true,
    });
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole('textbox', { name: /Titre de la tâche/ });
    await expect(title).toHaveAttribute('aria-required', 'true');
    await expect(title).toBeFocused();
    await title.fill('Vérification clavier sans enregistrement');
    await expect(
      dialog.getByText('Titre de la tâche *', { exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('textbox', {
        name: 'Description (optionnel)',
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    const priority = dialog.getByRole('radiogroup', {
      name: 'Priorité',
      exact: true,
    });
    await expect(
      priority.getByRole('radio', { name: 'Moyenne' }),
    ).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(priority.getByRole('radio', { name: 'Haute' })).toBeChecked();
    await expect(priority.getByRole('radio', { name: 'Haute' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(
      priority.getByRole('radio', { name: 'Urgente' }),
    ).toBeChecked();
    await page.keyboard.press('Home');
    await expect(priority.getByRole('radio', { name: 'Basse' })).toBeChecked();
    await page.keyboard.press('Tab');
    const recurrence = dialog.getByRole('radiogroup', {
      name: 'Récurrence',
      exact: true,
    });
    await expect(
      recurrence.getByRole('radio', { name: 'Aucune' }),
    ).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(
      recurrence.getByRole('radio', { name: 'Quotidienne' }),
    ).toBeChecked();
    await page.keyboard.press('Space');
    await expect(
      recurrence.getByRole('radio', { name: 'Quotidienne' }),
    ).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Annuler', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Créer', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Fermer la création de tâche' }),
    ).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('button', { name: 'Créer', exact: true }),
    ).toBeFocused();
    await page.screenshot({
      path: `${evidence}/task-keyboard-${width}.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 80,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

for (const [route, first, second, label] of [
  ['manager', 'Cockpit', 'Détails', 'Vues du cockpit'],
  ['chat', 'Messages', 'Canaux', 'Vues de la communication'],
  ['training', 'Catalogue', 'Supervision', 'Vues de la formation'],
]) {
  test(`${route} : onglets, panneau nommé et sortie clavier`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await loginAsLocalDemo(page);
    await page.goto(`./${route}`);
    const tabs = page.getByRole('tablist', { name: label, exact: true });
    const a = tabs.getByRole('tab', { name: first, exact: true });
    const b = tabs.getByRole('tab', { name: second, exact: true });
    await a.focus();
    await page.keyboard.press('ArrowRight');
    await expect(b).toBeFocused();
    await expect(a).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Space');
    await expect(b).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel', { name: second, exact: true });
    await expect(panel).toBeVisible();
    await expect(b).toHaveAttribute(
      'aria-controls',
      (await panel.getAttribute('id')) as string,
    );
    await page.keyboard.press('Tab');
    await expect(panel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(b).toBeFocused();
    await page.keyboard.press('Home');
    await expect(a).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(a).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('tabpanel', { name: first, exact: true }),
    ).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(b).toBeFocused();
    await page.screenshot({
      path: `${evidence}/tabs-${route}-1440.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 75,
    });
  });
}

test('audit : nom du formulaire, label persistant, Échap et retour au déclencheur', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAsLocalDemo(page);
  await page.goto('./audits');
  const trigger = page.getByTestId('audit-create-button');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Nouvel audit',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const title = dialog.getByRole('textbox', { name: /Titre de l’audit/ });
  await expect(title).toHaveAttribute('aria-required', 'true');
  await expect(dialog.getByTestId('audit-create-submit')).toBeDisabled();
  await title.fill('Audit fictif sans enregistrement');
  await expect(
    dialog.getByText('Titre de l’audit *', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByTestId('audit-create-submit')).toBeEnabled();
  await page.screenshot({
    path: `${evidence}/audit-375.jpg`,
    animations: 'disabled',
    type: 'jpeg',
    quality: 80,
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const [width, height, resize] of [
  [320, 812, false],
  [812, 375, false],
  [375, 900, true],
] as const) {
  test(`tâche : reflow ${width}px, texte doublé=${resize}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await loginAsLocalDemo(page);
    await page.goto('./tasks');
    await page
      .getByRole('button', { name: 'Nouvelle tâche', exact: true })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Nouvelle tâche',
      exact: true,
    });
    await expect(dialog).toBeVisible();
    if (resize)
      await dialog.evaluate((root) => {
        for (const el of root.querySelectorAll<HTMLElement>(
          '[dir="auto"],input,textarea',
        )) {
          const style = getComputedStyle(el);
          const font = parseFloat(style.fontSize),
            line = parseFloat(style.lineHeight);
          el.style.fontSize = `${font * 2}px`;
          if (Number.isFinite(line)) el.style.lineHeight = `${line * 2}px`;
        }
      });
    await waitForVisualLayout(page);
    const submit = dialog.getByTestId('task-create-submit');
    await submit.scrollIntoViewIfNeeded();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(16);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height - 15);
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(
      await dialog.getByRole('radio').evaluateAll((radios) =>
        radios.every((radio) => {
          const label = radio.querySelector<HTMLElement>('[dir="auto"]');
          if (!label) return false;
          const parent = radio.getBoundingClientRect(),
            text = label.getBoundingClientRect();
          return (
            text.left >= parent.left &&
            text.right <= parent.right + 1 &&
            label.scrollWidth <= label.clientWidth + 1
          );
        }),
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${evidence}/task-${width}${resize ? '-text200' : ''}.jpg`,
      animations: 'disabled',
      type: 'jpeg',
      quality: 80,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
}

test('orientation : titre de page, navigation vers Produits puis retour navigateur', async ({
  page,
}) => {
  await loginAsLocalDemo(page);
  await page.goto('./more');
  await expect(page).toHaveTitle('Tous les outils · OpsPilot');
  await page.getByTestId('more-link-products').click();
  await expect(page.getByTestId('page-products-title')).toBeVisible();
  await expect(page).toHaveTitle('Produits · OpsPilot');
  await page.goBack();
  await expect(page.getByTestId('page-more-title')).toBeVisible();
  await expect(page).toHaveTitle('Tous les outils · OpsPilot');
  await page.goForward();
  await expect(page.getByTestId('page-products-title')).toBeVisible();
  await expect(page).toHaveTitle('Produits · OpsPilot');
  await page.getByRole('tab', { name: 'Plus', exact: true }).click();
  await page.getByTestId('more-link-products').click();
  await expect(page.getByTestId('page-products-title')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('page-more-title')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('page-products-title')).toBeVisible();
});
