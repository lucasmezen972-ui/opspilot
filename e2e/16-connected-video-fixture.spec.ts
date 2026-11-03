import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { signedInFixture } from './billingFixture';

test('import privé connecté : fichier, publication et URL signée passent par les API attendues', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const fixture = resolve(process.cwd(), 'e2e/fixtures/video-fixture.mp4');
  const uploads: string[] = [];
  const lessons: Record<string, unknown>[] = [];
  const courses: Record<string, unknown>[] = [];
  let published: Record<string, any> | null = null;
  let signs = 0;
  await signedInFixture(page, 'admin', (path, request) => {
    if (path.endsWith('/trainings')) return courses;
    if (path.endsWith('/training_chapters')) return lessons;
    if (
      path.startsWith('/storage/v1/object/training-videos/') &&
      request.method() === 'POST'
    ) {
      uploads.push(path);
      return { Key: path, Id: '90000000-0000-4000-a000-000000000007' };
    }
    if (path.endsWith('/rpc/save_training_video_lesson')) {
      published = request.postDataJSON();
      const p = published!.p_payload;
      courses.push({
        id: published!.p_course_id,
        organization_id: '90000000-0000-4000-a000-000000000002',
        title: p.course_title,
        content: p.body,
        category: 'Formation vidéo',
        difficulty: 'beginner',
        duration_minutes: 1,
        xp_reward: 20,
        is_active: true,
        min_score: 70,
      });
      lessons.push({
        id: published!.p_chapter_id,
        training_id: published!.p_course_id,
        title: p.title,
        body: p.body,
        sort_order: 0,
        video_storage_path: p.video_storage_path,
        video_duration_seconds: p.video_duration_seconds,
      });
      return published!.p_chapter_id;
    }
    if (path.endsWith('/rpc/start_training'))
      return {
        id: '90000000-0000-4000-a000-000000000008',
        user_id: '90000000-0000-4000-a000-000000000001',
        training_id: published!.p_course_id,
        status: 'in_progress',
        completed_chapter_ids: [],
        progress_percentage: 0,
        video_progress: {},
      };
    if (
      path.startsWith('/storage/v1/object/sign/training-videos/') &&
      request.method() === 'POST'
    ) {
      signs++;
      return { signedURL: path.replace('/storage/v1', '') + '?token=fixture' };
    }
    if (path.endsWith('/rpc/record_training_video'))
      return {
        position: request.postDataJSON().p_position,
        watched: 0,
        last_seen: new Date().toISOString(),
      };
  });
  await page.goto('./training');
  await page.getByTestId('training-video-add').click();
  await page
    .getByLabel('Titre de la formation', { exact: true })
    .fill('Import privé — essai fictif');
  await page
    .getByLabel('Titre du chapitre vidéo', { exact: true })
    .fill('Chapitre technique de test');
  await page.getByLabel('Fichier vidéo MP4').setInputFiles(fixture);
  await expect(
    page.getByText('video-fixture.mp4', { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Question finale', { exact: true })
    .fill('Contrôle technique, sans contenu pédagogique publié ?');
  await page.getByLabel('Réponse A', { exact: true }).fill('Oui');
  await page.getByLabel('Réponse B', { exact: true }).fill('Non');
  await page.getByTestId('training-video-save').click();
  await expect(page.getByTestId('training-video-editor')).toHaveCount(0);
  expect(uploads).toHaveLength(1);
  expect(published!.p_payload.video_url).toBeNull();
  expect(uploads[0]).toContain(
    `/90000000-0000-4000-a000-000000000002/${published!.p_course_id}/${published!.p_chapter_id}/`,
  );
  const bytes = await readFile(fixture);
  await page.route(
    /storage\/v1\/object\/sign\/training-videos\/.*\?token=fixture/,
    (route) => route.fulfill({ body: bytes, contentType: 'video/mp4' }),
  );
  await page
    .getByRole('button', {
      name: 'Commencer : Import privé — essai fictif',
      exact: true,
    })
    .click();
  await expect(page.locator('video')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('video').evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBeGreaterThan(0);
  expect(signs).toBe(1);
  await expect(page.getByTestId('training-chapter-complete')).toBeDisabled();
});

test('préparation SEPA en back-office : données exactes de facture et absence de débit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const actions: Record<string, unknown>[] = [];
  const request = {
    id: '90000000-0000-4000-a000-000000000004',
    organization_id: '90000000-0000-4000-a000-000000000002',
    plan: 'essential',
    status: 'requested',
    payment_provider: 'qonto',
    payment_url: null,
    created_at: '2026-11-03T00:00:00Z',
  };
  let quoted = false;
  await signedInFixture(page, 'superadmin', (path, req) => {
    if (path.endsWith('/billing_requests')) return [request];
    if (path.endsWith('/rpc/superadmin_organizations'))
      return [
        { id: request.organization_id, name: 'Entreprise fictive de contrôle' },
      ];
    if (path.endsWith('/rpc/get_sepa_agreements'))
      return quoted
        ? [
            {
              id: '90000000-0000-4000-a000-000000000003',
              request_id: request.id,
              organization_name: 'Entreprise fictive de contrôle',
              status: 'draft',
              plan: 'essential',
              amount_cents: 19900,
              interval_months: 1,
              first_paid_until: '2027-02-01T23:59:59Z',
              next_charge_date: '2027-02-02',
              mandate_ready: false,
              invoice_reference: 'TEST-UI-QUOTE',
              payments: [],
            },
          ]
        : [];
    if (path.endsWith('/functions/v1/mollie-recurring')) {
      const body = req.postDataJSON();
      if (body.action === 'status') return { configured: false, ready: false };
      actions.push(body);
      quoted = true;
      return {
        agreement_id: '90000000-0000-4000-a000-000000000003',
        status: 'draft',
      };
    }
  });
  await page.goto('./billing');
  await page
    .getByRole('button', {
      name: /Entreprise fictive de contrôle.*facture à préparer/,
    })
    .click();
  await page
    .getByLabel('Référence de facture Qonto', { exact: true })
    .fill('TEST-UI-QUOTE');
  const until = new Date(Date.now() + 31 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Fin de période réglée', { exact: true }).fill(until);
  await page
    .getByLabel('Montant TTC de chaque échéance SEPA', { exact: true })
    .fill('199,00');
  await page
    .getByRole('button', {
      name: 'Préparer le calendrier à faire accepter',
      exact: true,
    })
    .click();
  await expect(page.getByTestId('sepa-panel')).toContainText(
    'Accord client attendu',
  );
  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({
    action: 'quote',
    amount_cents: 19900,
    request_id: request.id,
    invoice_reference: 'TEST-UI-QUOTE',
    interval_months: 1,
  });
  expect(actions[0]!.paid_until).toBe(`${until}T23:59:59.000Z`);
  await page
    .getByRole('button', {
      name: /Entreprise fictive de contrôle.*facture à préparer/,
    })
    .click();
  await expect(
    page.getByText('Cette facture appartient à un calendrier SEPA.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Créer le lien de règlement de cette facture',
      exact: true,
    }),
  ).toHaveCount(0);
});
