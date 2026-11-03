import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { signedInFixture } from './billingFixture';

for (const width of [375, 1440]) {
  test(`R2 private import and retry preserve one object at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    const courses: any[] = [],
      chapters: any[] = [],
      reservations: any[] = [],
      uploads: any[] = [];
    const media = await readFile(resolve('e2e/fixtures/video-fixture.mp4'));
    const origin = `https://${'a'.repeat(32)}.r2.cloudflarestorage.com`;
    let completes = 0,
      reads = 0;
    await signedInFixture(page, 'admin', (path, request) => {
      if (path.endsWith('/trainings')) return courses;
      if (path.endsWith('/training_chapters')) return chapters;
      if (path.endsWith('/functions/v1/training-media')) {
        const input = request.postDataJSON();
        if (input.action === 'status')
          return { r2: true, max_bytes: 262144000 };
        if (input.action === 'reserve') {
          reservations.push(input);
          return {
            path: `r2/90000000-0000-4000-a000-000000000002/${input.course_id}/${input.chapter_id}/${input.upload_id}.mp4`,
            ready: false,
            upload_url: `${origin}/fixture/video.mp4?signature=fictional`,
          };
        }
        if (input.action === 'complete') {
          completes++;
          if (completes === 1)
            return {
              ready: false,
              error: 'Vérification temporairement indisponible',
            };
          const r = reservations[0];
          return {
            ready: true,
            path: `r2/90000000-0000-4000-a000-000000000002/${r.course_id}/${r.chapter_id}/${r.upload_id}.mp4`,
          };
        }
        if (input.action === 'playback') {
          reads++;
          return {
            signed_url: `${origin}/fixture/play.mp4?signature=fictional`,
          };
        }
      }
      if (path.endsWith('/rpc/save_training_video_lesson')) {
        const input = request.postDataJSON(),
          p = input.p_payload;
        courses.push({
          id: input.p_course_id,
          organization_id: '90000000-0000-4000-a000-000000000002',
          title: p.course_title,
          is_active: true,
          category: 'Vidéo',
          duration_minutes: 1,
          min_score: 70,
        });
        chapters.push({
          id: input.p_chapter_id,
          training_id: input.p_course_id,
          title: p.title,
          video_storage_path: p.video_storage_path,
          video_duration_seconds: 6,
          body: '',
          sort_order: 0,
        });
        return input.p_chapter_id;
      }
      if (path.endsWith('/rpc/start_training'))
        return {
          training_id: courses[0].id,
          status: 'in_progress',
          completed_chapter_ids: [],
          video_progress: {},
        };
      if (path.endsWith('/rpc/record_training_video'))
        return { position: request.postDataJSON().p_position, watched: 0 };
    });
    await page.route(`${origin}/**`, async (route) => {
      const request = route.request();
      if (request.method() === 'PUT') {
        uploads.push({
          ...(await request.allHeaders()),
          payloadBytes: request.postDataBuffer()?.length,
        });
        await route.fulfill({
          status: uploads.length === 1 ? 200 : 412,
          body: '',
        });
      } else await route.fulfill({ body: media, contentType: 'video/mp4' });
    });
    await page.goto('./training');
    await page.getByTestId('training-video-add').click();
    await expect(
      page.getByText('Stockage vidéo étendu activé.', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('250 Mo maximum.', { exact: false }),
    ).toBeVisible();
    await page
      .getByLabel('Titre de la formation', { exact: true })
      .fill('Import R2 — test fictif');
    await page
      .getByLabel('Titre du chapitre vidéo', { exact: true })
      .fill('Vidéo technique privée');
    await page
      .getByLabel('Fichier vidéo MP4')
      .setInputFiles(resolve('e2e/fixtures/video-fixture.mp4'));
    await expect(
      page.getByText('video-fixture.mp4', { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel('Question finale', { exact: true })
      .fill('Test technique ?');
    await page.getByLabel('Réponse A', { exact: true }).fill('Oui');
    await page.getByLabel('Réponse B', { exact: true }).fill('Non');
    if (width === 375)
      await page.screenshot({
        path: `docs/evidence/2026-11-03/r2-video-${width}.jpg`,
        type: 'jpeg',
        quality: 75,
        animations: 'disabled',
      });
    await page.getByTestId('training-video-save').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByTestId('training-video-save').click();
    await expect(page.getByTestId('training-video-editor')).toHaveCount(0);
    expect(reservations).toHaveLength(2);
    expect(reservations[1]).toEqual(reservations[0]);
    expect(uploads).toHaveLength(2);
    expect(uploads[0].authorization).toBeUndefined();
    expect(uploads[0]['if-none-match']).toBe('*');
    // Request interception occurs before Chromium adds transport headers.
    // Check the actual File body here; signed Content-Length is covered in Deno
    // and must also be verified against R2 before activation.
    expect(uploads[0].payloadBytes).toBe(media.length);
    expect(chapters[0].video_storage_path).toContain(
      `/${reservations[0].upload_id}.mp4`,
    );
    await page
      .getByRole('button', {
        name: 'Commencer : Import R2 — test fictif',
        exact: true,
      })
      .click();
    await expect(page.locator('video')).toBeVisible();
    await expect
      .poll(() =>
        page.locator('video').evaluate((v: HTMLVideoElement) => v.readyState),
      )
      .toBeGreaterThan(0);
    expect(reads).toBe(1);
    await expect(page.getByTestId('training-chapter-complete')).toBeDisabled();
    if (width === 1440)
      await page.screenshot({
        path: `docs/evidence/2026-11-03/r2-video-${width}.jpg`,
        type: 'jpeg',
        quality: 75,
        animations: 'disabled',
      });
  });
}
