import { test, expect, type Page } from '@playwright/test';

import { loginAsLocalDemo, openTab } from './helpers';

/**
 * Lit tous les chapitres d'une formation ouverte jusqu'à ce que le bouton de
 * démarrage du quiz apparaisse. Robuste au nombre de chapitres (les formations
 * démo sont scénarisées et peuvent compter 6 à 8 chapitres).
 */
async function readAllChapters(page: Page) {
  for (let guard = 0; guard < 16; guard += 1) {
    if (
      await page
        .getByTestId('training-quiz-start')
        .isVisible()
        .catch(() => false)
    ) {
      break;
    }
    await expect(page.getByTestId('training-chapter-title')).toBeVisible();
    await page.getByTestId('training-chapter-complete').click();
  }
  await expect(page.getByTestId('training-quiz-start')).toBeVisible();
}

/**
 * Répond correctement à chaque question du quiz jusqu'à la soumission finale.
 * Le moteur anti-triche mélange l'ordre des questions ET des options : on clique
 * toujours sur la bonne réponse via le testID stable 'training-quiz-option-correct'.
 * Robuste au nombre de questions tirées (8, 15 ou 25 selon la banque).
 */
async function answerQuizCorrectly(page: Page, assertFeedback = false) {
  for (let guard = 0; guard < 40; guard += 1) {
    await page.getByTestId('training-quiz-option-correct').click();
    if (assertFeedback) {
      await expect(
        page.getByText('Bonne réponse.', { exact: true }),
      ).toBeVisible();
    }
    const submit = page.getByTestId('training-quiz-submit');
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      return;
    }
    await page.getByTestId('training-quiz-next').click();
  }
  throw new Error('Quiz non terminé après 40 questions');
}

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

    await readAllChapters(page);
    await page.getByTestId('training-quiz-start').click();
    await answerQuizCorrectly(page, true);

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
    await answerQuizCorrectly(page);
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
    await readAllChapters(page);
    await page.getByTestId('training-quiz-start').click();
    await answerQuizCorrectly(page);

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
