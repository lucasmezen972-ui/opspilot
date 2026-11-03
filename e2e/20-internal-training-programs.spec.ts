import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { signedInFixture } from './billingFixture';
import { internalProgramCatalogue } from '../features/training/internalPrograms';

const id = '90000000-0000-4000-a000-000000000080';
const chapterId = '90000000-0000-4000-a000-000000000081';
const mediaDirectory = process.env.OPSPILOT_TRAINING_MEDIA;

async function prepareLibrary(page: Page, failRefresh = false) {
  const program = internalProgramCatalogue.find(
    (p) => p.key === 'accueil-securite',
  )!;
  const source = JSON.parse(
    await readFile(
      resolve('content/training-programs/accueil-securite.json'),
      'utf8',
    ),
  );
  const state = { copies: 0, calls: 0, signs: 0, installed: false };
  await signedInFixture(page, 'admin', (path, request) => {
    if (path.endsWith('/rpc/list_internal_training_programs'))
      return internalProgramCatalogue;
    if (path.endsWith('/rpc/install_internal_training_program')) {
      expect(request.postDataJSON()).toEqual({
        p_key: program.key,
        p_version: program.version,
      });
      state.calls++;
      if (!state.installed) {
        state.installed = true;
        state.copies++;
      }
      return id;
    }
    if (path.endsWith('/rpc/start_training'))
      return {
        id: '90000000-0000-4000-a000-000000000087',
        user_id: '90000000-0000-4000-a000-000000000001',
        training_id: id,
        status: 'in_progress',
        progress_percentage: 0,
        completed_chapter_ids: [],
        video_progress: {},
      };
    if (path.endsWith('/trainings'))
      return state.installed
        ? [
            {
              id,
              organization_id: '90000000-0000-4000-a000-000000000002',
              title: program.title,
              content: program.summary,
              category: program.category,
              difficulty: 'beginner',
              duration_minutes: 23,
              xp_reward: 30,
              ai_generated: true,
              is_active: true,
              min_score: 80,
              program_key: program.key,
              program_version: program.version,
              program_metadata: program,
            },
          ]
        : [];
    if (path.endsWith('/training_chapters'))
      return source.chapters.map(
        (c: { title: string; body: string }, i: number) => ({
          ...c,
          id:
            i === 0 ? chapterId : `90000000-0000-4000-a000-00000000008${i + 1}`,
          training_id: id,
          sort_order: i + 1,
          video_storage_path:
            i === 0 ? 'library/2026-11-03/accueil-securite/fixture.mp4' : null,
          video_duration_seconds:
            i === 0 ? Math.ceil(program.video_seconds) : null,
        }),
      );
    if (
      path.includes('/storage/v1/object/sign/training-library/') &&
      request.method() === 'POST'
    ) {
      state.signs++;
      return {
        signedURL: '/object/sign/training-library/fixture.mp4?token=fixture',
      };
    }
    if (path.endsWith('/rpc/record_training_video'))
      return {
        position: request.postDataJSON().p_position,
        watched: 0,
        last_seen: new Date().toISOString(),
      };
  });
  if (failRefresh) {
    let failed = false;
    await page.route('**/rest/v1/training_chapters?**', async (route) => {
      if (state.installed && !failed) {
        failed = true;
        await route.fulfill({
          status: 503,
          json: { message: 'Échec de lecture fictif' },
        });
      } else await route.fallback();
    });
  }
  return state;
}

for (const width of [375, 1440])
  test(`parcours mixte privé : catalogue, ajout et ${mediaDirectory ? 'capsule réelle' : 'fixture technique'} à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await prepareLibrary(page);
    const media = mediaDirectory;
    const bytes = await readFile(
      media
        ? resolve(media, 'accueil-securite/accueil-securite.mp4')
        : resolve('e2e/fixtures/video-fixture.mp4'),
    );
    await page.route(
      '**/storage/v1/object/sign/training-library/fixture.mp4?token=fixture',
      (route) => route.fulfill({ body: bytes, contentType: 'video/mp4' }),
    );
    await page.goto('./training');
    await page.getByTestId('training-program-library-open').click();
    await page.getByRole('button', { name: 'Sécurité', exact: true }).click();
    await expect(
      page.getByTestId('training-program-preview-accueil-client'),
    ).toHaveCount(0);
    await page.getByTestId('training-program-preview-accueil-securite').click();
    await expect(
      page.getByText('Mise en pratique à organiser', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Ce que vous saurez faire', { exact: true }),
    ).toBeVisible();
    await page.getByTestId('training-program-install').click();
    await expect(page.getByTestId('training-course-modal')).toBeVisible();
    await expect(page.getByTestId('training-program-overview')).toContainText(
      'lecture env.',
    );
    const video = page.locator('video');
    await expect(video).toHaveCount(1);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBeGreaterThanOrEqual(2);
    if (media)
      expect(
        await video.evaluate((v: HTMLVideoElement) => v.duration),
      ).toBeGreaterThan(60);
    await video.evaluate(async (v: HTMLVideoElement) => {
      v.muted = true;
      await v.play();
    });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(1);
    await video.evaluate((v: HTMLVideoElement) => v.pause());
    await video.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/evidence/2026-11-03/internal-video-${width}.jpg`,
      type: 'jpeg',
      quality: 80,
    });
    const bookmark = page.getByRole('button', { name: /Aller à Cas fictif/ });
    const requestedPosition = internalProgramCatalogue
      .find((p) => p.key === 'accueil-securite')!
      .video_chapters.find((c) => c.title.startsWith('Cas fictif'))!.seconds;
    const duration = await video.evaluate((v: HTMLVideoElement) => v.duration);
    await bookmark.click();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeCloseTo(Math.min(requestedPosition, duration), 0);
    // Seeking alone cannot manufacture watched progress or unlock the chapter.
    await expect(page.getByTestId('training-chapter-complete')).toBeDisabled();
    expect(state.copies).toBe(1);
    expect(state.calls).toBe(1);
    expect(state.signs).toBe(1);
  });

test('un ajout confirmé reste récupérable après un échec de relecture', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const state = await prepareLibrary(page, true);
  await page.goto('./training');
  await page.getByTestId('training-program-library-open').click();
  await page.getByTestId('training-program-preview-accueil-securite').click();
  await page.getByTestId('training-program-install').click();
  await expect(page.getByRole('alert')).toContainText(
    'un ajout déjà enregistré ne sera pas dupliqué',
  );
  await expect(
    page.getByTestId('training-program-library-modal'),
  ).toBeVisible();
  await page.getByTestId('training-program-install').click();
  await expect(page.getByTestId('training-course-modal')).toBeVisible();
  expect(state.copies).toBe(1);
  expect(state.calls).toBe(2);
});
