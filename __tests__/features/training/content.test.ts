import { describe, it, expect } from 'vitest';

import {
  getDemoTrainings,
  getDemoTrainingChapters,
  getDemoTrainingQuizQuestions,
} from '../../../lib/demoData';

/**
 * Garantit la crédibilité « quasi-certifiante » des formations démo :
 * un volume minimal de chapitres, des quiz suffisamment fournis, des cas
 * pratiques (situations) et des durées cohérentes.
 */

const PRIORITY_TRAININGS = [
  'demo-training-1',
  'demo-training-2',
  'demo-training-3',
  'demo-training-4',
  'demo-training-5',
  'demo-training-6',
];

describe('densité et crédibilité des formations démo', () => {
  const trainings = getDemoTrainings();
  const chapters = getDemoTrainingChapters();
  const questions = getDemoTrainingQuizQuestions();

  const chaptersOf = (id: string) =>
    chapters.filter((c) => c.training_id === id);
  const questionsOf = (id: string) =>
    questions.filter((q) => q.training_id === id);

  it('couvre les 6 modules prioritaires', () => {
    for (const id of PRIORITY_TRAININGS) {
      expect(trainings.some((t) => t.id === id)).toBe(true);
    }
  });

  it('chaque module prioritaire compte au moins 6 chapitres', () => {
    for (const id of PRIORITY_TRAININGS) {
      expect(
        chaptersOf(id).length,
        `${id} doit avoir ≥ 6 chapitres`,
      ).toBeGreaterThanOrEqual(6);
    }
  });

  it('chaque chapitre a un contenu substantiel', () => {
    for (const chapter of chapters) {
      expect(
        chapter.body.length,
        `Chapitre trop court : ${chapter.title}`,
      ).toBeGreaterThanOrEqual(200);
    }
  });

  it('chaque module prioritaire propose au moins 8 questions de quiz', () => {
    for (const id of PRIORITY_TRAININGS) {
      expect(
        questionsOf(id).length,
        `${id} doit avoir ≥ 8 questions`,
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it('chaque module prioritaire contient au moins 2 cas pratiques (situations)', () => {
    for (const id of PRIORITY_TRAININGS) {
      const situations = questionsOf(id).filter(
        (q) => q.question_type === 'situation',
      );
      expect(
        situations.length,
        `${id} doit avoir ≥ 2 cas pratiques`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('chaque module prioritaire contient au moins une question critique', () => {
    for (const id of PRIORITY_TRAININGS) {
      const critical = questionsOf(id).filter((q) => q.is_critical);
      expect(
        critical.length,
        `${id} doit avoir ≥ 1 question critique`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('affiche des durées cohérentes (45 à 90 minutes)', () => {
    for (const id of PRIORITY_TRAININGS) {
      const training = trainings.find((t) => t.id === id);
      expect(training?.duration_minutes).toBeGreaterThanOrEqual(45);
      expect(training?.duration_minutes).toBeLessThanOrEqual(90);
    }
  });

  it('conserve la banque « courte » de la chaîne du froid (contrat E2E : tirage de 8)', () => {
    // L'E2E répond dynamiquement, mais on garde la banque < 15 pour rester sur
    // un tirage de 8 questions et une durée de test maîtrisée.
    expect(questionsOf('demo-training-3').length).toBeLessThan(15);
  });
});
