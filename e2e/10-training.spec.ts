import { test, expect } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

test.describe('Formations réelles', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLocalDemo(page);
    await openTab(page, 'Formation', 'page-training-title');
  });

  test('lit les chapitres, corrige le quiz et attribue les XP une seule fois', async ({
    page,
  }) => {
    const courseId = 'demo-training-3';

    await expect(page.getByTestId(`training-card-${courseId}`)).toContainText(
      'Chaîne du froid',
    );
    await page.getByTestId(`training-open-${courseId}`).click();
    await expect(page.getByTestId('training-course-modal')).toBeVisible();

    for (let chapter = 0; chapter < 4; chapter += 1) {
      await expect(page.getByTestId('training-chapter-title')).toBeVisible();
      await page.getByTestId('training-chapter-complete').click();
    }

    await expect(page.getByTestId('training-quiz-start')).toBeVisible();
    await page.getByTestId('training-quiz-start').click();

    const correctAnswers = [1, 0, 0, 0, 0];
    for (let index = 0; index < correctAnswers.length; index += 1) {
      await page
        .getByTestId(
          `training-quiz-${courseId}-quiz-${index + 1}-option-${correctAnswers[index]}`,
        )
        .click();
      await expect(
        page.getByText('Bonne réponse.', { exact: true }),
      ).toBeVisible();
      await page
        .getByTestId(
          index === correctAnswers.length - 1
            ? 'training-quiz-submit'
            : 'training-quiz-next',
        )
        .click();
    }

    await expect(page.getByTestId('training-quiz-score')).toHaveText('100%');
    await expect(page.getByText('Formation validée !')).toBeVisible();
    await page.getByTestId('training-result-close').click();

    await expect(page.getByTestId(`training-status-${courseId}`)).toHaveText(
      'Terminé',
    );
    await expect(page.getByTestId('training-xp-value')).toHaveText('460 XP');

    // Une révision réussie ne doit jamais recréditer la récompense.
    await page.getByTestId(`training-open-${courseId}`).click();
    await page.getByTestId('training-quiz-start').click();
    for (let index = 0; index < correctAnswers.length; index += 1) {
      await page
        .getByTestId(
          `training-quiz-${courseId}-quiz-${index + 1}-option-${correctAnswers[index]}`,
        )
        .click();
      await page
        .getByTestId(
          index === correctAnswers.length - 1
            ? 'training-quiz-submit'
            : 'training-quiz-next',
        )
        .click();
    }
    await page.getByTestId('training-result-close').click();
    await expect(page.getByTestId('training-xp-value')).toHaveText('460 XP');
  });
});
