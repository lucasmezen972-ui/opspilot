import { expect, test } from '@playwright/test';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { loginAsLocalDemo, openTab } from './helpers';

const fixture = resolve(process.cwd(), 'e2e/fixtures/video-fixture.mp4');

for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 812, height: 375 },
  { width: 1440, height: 1000 },
]) {
  test(`catalogue et lecteur vidéo utilisables à ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await loginAsLocalDemo(page);
    await openTab(page, 'Formation', 'page-training-title');
    await page.screenshot({
      path: `test-results/design-training-${viewport.width}.jpg`,
      type: 'jpeg',
      quality: 80,
    });
    await page.getByTestId('training-video-add').click();
    const editor = page.getByTestId('training-video-editor');
    await expect(editor).toBeVisible();
    await page.getByTestId('training-video-save').click();
    await expect(editor.getByRole('alert')).toContainText('Indiquez un titre');
    await page
      .getByLabel('Titre de la formation', { exact: true })
      .fill('Banc d’essai vidéo — données locales');
    await page
      .getByLabel('Titre du chapitre vidéo', { exact: true })
      .fill('Lecture technique de contrôle');
    await page
      .getByLabel('Ou lien direct MP4 (https)', { exact: true })
      .fill('https://example.invalid/opspilot-fixture.mp4');
    await page
      .getByLabel('Durée de la vidéo en minutes', { exact: true })
      .fill('0.1');
    await page
      .getByLabel('Question finale', { exact: true })
      .fill('Ce contenu est-il un test technique ?');
    await page.getByLabel('Réponse A', { exact: true }).fill('Oui');
    await page.getByLabel('Réponse B', { exact: true }).fill('Non');
    await page.getByTestId('training-video-save').click();
    await expect(editor).toHaveCount(0);
    await page
      .getByLabel('Rechercher une formation')
      .fill('Banc d’essai vidéo');
    const bytes = await readFile(fixture);
    await page.route(
      'https://example.invalid/opspilot-fixture.mp4',
      (route) => {
        const range = route
          .request()
          .headers()
          .range?.match(/^bytes=(\d+)-(\d*)$/);
        const start = range ? Number(range[1]) : 0,
          end = range?.[2] ? Number(range[2]) : bytes.length - 1;
        return route.fulfill({
          status: range ? 206 : 200,
          body: bytes.subarray(start, end + 1),
          contentType: 'video/mp4',
          headers: {
            'Accept-Ranges': 'bytes',
            ...(range
              ? { 'Content-Range': `bytes ${start}-${end}/${bytes.length}` }
              : {}),
          },
        });
      },
    );
    await page
      .getByRole('button', {
        name: 'Commencer : Banc d’essai vidéo — données locales',
        exact: true,
      })
      .click();
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(page.getByTestId('training-chapter-complete')).toBeDisabled();
    await video.evaluate((v: HTMLVideoElement) => v.play());
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), {
        timeout: 10_000,
      })
      .toBeGreaterThan(1.4);
    await video.evaluate((v: HTMLVideoElement) => v.pause());
    const paused = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    await expect(page.getByTestId('training-video-position')).not.toHaveText(
      'Position enregistrée : 0 s',
    );
    await page
      .getByRole('button', { name: 'Fermer la formation', exact: true })
      .click();
    await page
      .getByRole('button', {
        name: 'Continuer : Banc d’essai vidéo — données locales',
        exact: true,
      })
      .click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(paused - 0.5);
    await video.evaluate((v: HTMLVideoElement) => v.play());
    await expect(page.getByTestId('training-chapter-complete')).toBeEnabled({
      timeout: 12_000,
    });
    await page.screenshot({
      path: `test-results/design-video-${viewport.width}.jpg`,
      type: 'jpeg',
      quality: 80,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  });
}

test('import MP4 : métadonnées contrôlées et aucun téléversement en démo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAsLocalDemo(page);
  await openTab(page, 'Formation', 'page-training-title');
  await page.getByTestId('training-video-add').click();
  await page
    .getByLabel('Titre de la formation', { exact: true })
    .fill('Test import local');
  await page
    .getByLabel('Titre du chapitre vidéo', { exact: true })
    .fill('Contrôle MP4');
  await page.getByLabel('Fichier vidéo MP4').setInputFiles(fixture);
  await expect(
    page.getByText('video-fixture.mp4', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Durée de la vidéo en minutes', { exact: true }),
  ).toHaveValue('0.1');
  await page
    .getByLabel('Question finale', { exact: true })
    .fill('Question de test');
  await page.getByLabel('Réponse A', { exact: true }).fill('Réponse de test A');
  await page.getByLabel('Réponse B', { exact: true }).fill('Réponse de test B');
  await page.getByTestId('training-video-save').click();
  await expect(page.getByRole('alert')).toContainText(
    'Les fichiers privés s’importent dans un compte connecté',
  );
  await page.screenshot({
    path: 'test-results/design-video-import-375.jpg',
    type: 'jpeg',
    quality: 80,
  });
});
