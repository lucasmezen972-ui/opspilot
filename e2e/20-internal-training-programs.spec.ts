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
  const progress = {
    id: '90000000-0000-4000-a000-000000000087',
    user_id: '90000000-0000-4000-a000-000000000001',
    training_id: id,
    status: 'in_progress',
    progress_percentage: 0,
    completed_chapter_ids: [] as string[],
    video_progress: {} as Record<string, unknown>,
    server_verified_at: null as string | null,
  };
  const state = {
    copies: 0,
    calls: 0,
    signs: 0,
    installed: false,
    completedVideoOnServer: false,
    submissions: [] as unknown[],
    certificates: [] as Record<string, unknown>[],
  };
  const sessionId = '90000000-0000-4000-a000-000000000089';
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
    if (path.endsWith('/rpc/start_training')) return progress;
    if (path.endsWith('/user_training_progress'))
      return state.installed ? [progress] : [];
    if (path.endsWith('/training_certificates')) return state.certificates;
    if (path.endsWith('/rpc/mark_training_chapter')) {
      const body = request.postDataJSON();
      expect(body.p_training_id).toBe(id);
      if (!progress.completed_chapter_ids.includes(body.p_chapter_id))
        progress.completed_chapter_ids.push(body.p_chapter_id);
      progress.progress_percentage = progress.completed_chapter_ids.length * 30;
      return progress;
    }
    if (path.endsWith('/rpc/start_training_quiz')) {
      expect(progress.completed_chapter_ids).toHaveLength(3);
      return {
        id: sessionId,
        bankSize: 6,
        drawn: 6,
        questions: source.quiz.map(
          (
            q: {
              question: string;
              options: string[];
              question_type: string;
              is_critical: boolean;
            },
            i: number,
          ) => ({
            ...q,
            id: `fixture-question-${i}`,
            difficulty: 'easy',
          }),
        ),
      };
    }
    if (path.endsWith('/rpc/submit_training_quiz')) {
      const body = request.postDataJSON();
      expect(body).toEqual({
        p_session_id: sessionId,
        p_answers: [0, 0, 0, 0, 0, 0],
      });
      state.submissions.push(body);
      progress.status = 'completed';
      progress.progress_percentage = 100;
      progress.server_verified_at = new Date().toISOString();
      return {
        score: 100,
        passed: true,
        failedCritical: false,
        data: progress,
      };
    }
    if (path.endsWith('/rpc/issue_training_certificate')) {
      const body = request.postDataJSON();
      expect(progress.server_verified_at).not.toBeNull();
      expect(body.p_training_id).toBe(id);
      expect(body.p_identity.employeeId).toBe('TEST-INTERNE-01');
      const certificate = {
        id: '90000000-0000-4000-a000-000000000090',
        user_id: progress.user_id,
        training_id: id,
        full_name: body.p_identity.fullName,
        training_title: program.title,
        score: 100,
        issued_at: new Date().toISOString(),
        certificate_number: 'OPS-TEST-INTERNE-01',
        employee_id: body.p_identity.employeeId,
        status: 'validé',
      };
      state.certificates.push(certificate);
      return certificate;
    }
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
    if (path.endsWith('/rpc/record_training_video')) {
      const result = {
        position: request.postDataJSON().p_position,
        watched: state.completedVideoOnServer ? program.video_seconds : 0,
        last_seen: new Date().toISOString(),
      };
      progress.video_progress[chapterId] = result;
      return result;
    }
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
    context,
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
      async (route) => {
        const range = route
          .request()
          .headers()
          .range?.match(/^bytes=(\d+)-(\d*)$/);
        if (!range) {
          await route.fulfill({
            body: bytes,
            contentType: 'video/mp4',
            headers: {
              'Accept-Ranges': 'bytes',
              'Content-Length': String(bytes.length),
            },
          });
          return;
        }
        const start = Number(range[1]);
        const end = Math.min(
          range[2] ? Number(range[2]) : bytes.length - 1,
          bytes.length - 1,
        );
        if (start > end) {
          await route.fulfill({
            status: 416,
            headers: { 'Content-Range': `bytes */${bytes.length}` },
          });
          return;
        }
        await route.fulfill({
          status: 206,
          body: bytes.subarray(start, end + 1),
          contentType: 'video/mp4',
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
            'Content-Length': String(end - start + 1),
          },
        });
      },
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

    // The fixture now models a server-confirmed completion. This tests the UI
    // contract only; the real playback threshold is covered by SQL checks.
    state.completedVideoOnServer = true;
    await video.evaluate(async (v: HTMLVideoElement) => {
      await v.play();
      v.pause();
    });
    await expect(page.getByTestId('training-chapter-complete')).toBeEnabled();
    for (let i = 0; i < 3; i++)
      await page.getByTestId('training-chapter-complete').click();
    await page.getByTestId('training-quiz-start').click();
    for (let i = 0; i < 6; i++) {
      await page.getByRole('radio').first().click();
      await page
        .getByTestId(i === 5 ? 'training-quiz-submit' : 'training-quiz-next')
        .click();
    }
    await expect(page.getByTestId('training-quiz-score')).toHaveText('100%');
    await expect(
      page.getByText('Formation validée !', { exact: true }),
    ).toBeVisible();
    expect(state.submissions).toHaveLength(1);
    await page.getByTestId('training-quiz-result').screenshot({
      path: `docs/evidence/2026-11-03/internal-result-${width}.jpg`,
      type: 'jpeg',
      quality: 80,
    });
    await page.getByTestId('training-certificate-btn').click();
    await page.getByTestId('training-certificate-sign').click();
    await expect(page.getByTestId('training-identity-errors')).toBeVisible();
    expect(state.certificates).toHaveLength(0);
    await page
      .getByTestId('training-identity-matricule')
      .fill('TEST-INTERNE-01');
    await page.getByTestId('training-identity-position').fill('Poste fictif');
    await page
      .getByTestId('training-identity-store')
      .fill('Établissement fictif');
    await page.getByTestId('training-identity-honor').click();
    const popupPromise = context.waitForEvent('page');
    await page.getByTestId('training-certificate-sign').click();
    const certificate = await popupPromise;
    await expect(certificate.locator('body')).toContainText(
      'OPS-TEST-INTERNE-01',
    );
    await expect(certificate.locator('body')).toContainText(
      'Attestation interne OpsPilot',
    );
    expect(state.certificates).toHaveLength(1);
    await expect(page.getByTestId('training-course-modal')).toHaveCount(0);
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
