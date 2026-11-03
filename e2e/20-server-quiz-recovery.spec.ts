import { expect, test } from '@playwright/test';

import { signedInFixture } from './billingFixture';

for (const width of [375, 1440]) {
  test(`quiz connecté : choix multiples, reprise et résultat serveur à ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    const course = '91000000-0000-4000-a000-000000000001';
    const chapter = '91000000-0000-4000-a000-000000000002';
    const session = '91000000-0000-4000-a000-000000000003';
    const progress = {
      id: '91000000-0000-4000-a000-000000000004',
      training_id: course,
      status: 'in_progress',
      completed_chapter_ids: [chapter],
      progress_percentage: 90,
      server_verified_at: null,
    };
    const submissions: Record<string, unknown>[] = [];
    await signedInFixture(page, 'employee', (path, request) => {
      if (path.endsWith('/trainings'))
        return [
          {
            id: course,
            organization_id: '90000000-0000-4000-a000-000000000002',
            title: 'Évaluation — essai fictif',
            content: 'Scénario technique de test, sans formation publiée.',
            category: 'Contrôle technique',
            difficulty: 'beginner',
            duration_minutes: 1,
            xp_reward: 20,
            is_active: true,
            min_score: 70,
          },
        ];
      if (path.endsWith('/training_chapters'))
        return [
          {
            id: chapter,
            training_id: course,
            title: 'Chapitre technique',
            body: 'Fixture de navigateur.',
            sort_order: 0,
          },
        ];
      if (path.endsWith('/user_training_progress')) return [progress];
      if (path.endsWith('/rpc/start_training')) return progress;
      if (path.endsWith('/rpc/start_training_quiz'))
        return {
          id: session,
          bankSize: 1,
          drawn: 1,
          questions: [
            {
              id: 'fixture-question',
              question: 'Choisissez deux éléments pour ce contrôle technique.',
              options: ['Élément A', 'Élément B', 'Élément C'],
              question_type: 'qcm_multi',
              difficulty: 'easy',
              is_critical: false,
            },
          ],
        };
      if (path.endsWith('/rpc/submit_training_quiz')) {
        submissions.push(request.postDataJSON());
        // A lost/incomplete result must keep the same session and answers.
        // The authoritative result deliberately differs from the client threshold.
        return submissions.length === 1
          ? { score: 80, data: progress }
          : { score: 80, passed: false, failedCritical: false, data: progress };
      }
    });
    await page.goto('./training');
    await page
      .getByRole('button', {
        name: /: Évaluation — essai fictif/,
        exact: false,
      })
      .click();
    await page.getByTestId('training-quiz-start').click();
    await page
      .getByRole('checkbox', { name: 'Élément A', exact: true })
      .press('Space');
    await page
      .getByRole('checkbox', { name: 'Élément B', exact: true })
      .press('Enter');
    await expect(
      page.getByRole('checkbox', { name: 'Élément A', exact: true }),
    ).toBeChecked();
    await page
      .getByRole('button', { name: 'Valider (2 sélectionnées)', exact: true })
      .click();
    await page.getByTestId('training-quiz-submit').click();
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'résultat du serveur est incomplet' }),
    ).toBeVisible();
    await expect(page.getByTestId('training-quiz-result')).toHaveCount(0);
    await expect(
      page.getByRole('checkbox', { name: 'Élément A', exact: true }),
    ).toBeChecked();
    await page.getByTestId('training-quiz-submit').click();
    await expect(page.getByTestId('training-quiz-score')).toHaveText('80%');
    await expect(
      page.getByText('Évaluation à retravailler', { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('training-certificate-btn')).toHaveCount(0);
    expect(submissions).toEqual([
      { p_session_id: session, p_answers: [[0, 1]] },
      { p_session_id: session, p_answers: [[0, 1]] },
    ]);
    await page.getByTestId('training-quiz-result').screenshot({
      path: `docs/evidence/2026-11-03/server-quiz-result-${width}.jpg`,
      animations: 'disabled',
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
