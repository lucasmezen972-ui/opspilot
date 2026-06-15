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

    // Le moteur anti-triche mélange l'ordre des questions ET des options.
    // On clique toujours sur la bonne réponse via le testID stable 'training-quiz-option-correct'.
    const questionCount = 8;
    for (let index = 0; index < questionCount; index += 1) {
      await page.getByTestId('training-quiz-option-correct').click();
      await expect(
        page.getByText('Bonne réponse.', { exact: true }),
      ).toBeVisible();
      await page
        .getByTestId(
          index === questionCount - 1
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
    for (let index = 0; index < questionCount; index += 1) {
      await page.getByTestId('training-quiz-option-correct').click();
      await page
        .getByTestId(
          index === questionCount - 1
            ? 'training-quiz-submit'
            : 'training-quiz-next',
        )
        .click();
    }
    await page.getByTestId('training-result-close').click();
    await expect(page.getByTestId('training-xp-value')).toHaveText('460 XP');
  });

  test('exige une identité confirmée avant de délivrer une attestation', async ({
    page,
    context,
  }) => {
    const courseId = 'demo-training-3';

    await page.getByTestId(`training-open-${courseId}`).click();
    await expect(page.getByTestId('training-course-modal')).toBeVisible();
    for (let chapter = 0; chapter < 4; chapter += 1) {
      await expect(page.getByTestId('training-chapter-title')).toBeVisible();
      await page.getByTestId('training-chapter-complete').click();
    }
    await expect(page.getByTestId('training-quiz-start')).toBeVisible();
    await page.getByTestId('training-quiz-start').click();
    const questionCount = 8;
    for (let index = 0; index < questionCount; index += 1) {
      await page.getByTestId('training-quiz-option-correct').click();
      await page
        .getByTestId(
          index === questionCount - 1
            ? 'training-quiz-submit'
            : 'training-quiz-next',
        )
        .click();
    }

    // Ouvre le formulaire d'identité quasi-certifiant.
    await page.getByTestId('training-certificate-btn').click();
    await expect(page.getByTestId('training-identity-form')).toBeVisible();

    // Sans matricule ni attestation sur l'honneur, la signature est refusée.
    await page.getByTestId('training-certificate-sign').click();
    await expect(page.getByTestId('training-identity-errors')).toBeVisible();

    // Complète l'identité puis signe : l'attestation s'ouvre dans un onglet.
    await page.getByTestId('training-identity-matricule').fill('M-1042');
    await page
      .getByTestId('training-identity-position')
      .fill('Responsable de rayon');
    await page
      .getByTestId('training-identity-store')
      .fill('Magasin Lyon Part-Dieu');
    await page.getByTestId('training-identity-honor').click();

    const popupPromise = context.waitForEvent('page');
    await page.getByTestId('training-certificate-sign').click();
    const certificate = await popupPromise;
    await expect(certificate.locator('body')).toContainText('M-1042');
    await expect(certificate.locator('body')).toContainText(
      'Attestation de formation professionnelle',
    );

    // La modale se referme après signature.
    await expect(page.getByTestId('training-course-modal')).toHaveCount(0);
  });
});
