import { describe, it, expect } from 'vitest';

import { getDemoTrainingQuizQuestions } from '../../../lib/demoData';
import {
  createQuizSession,
  scoreQuizSession,
  isQuizPassed,
  type QuizQuestion,
} from '../../../features/training/quizEngine';

const makeQuestion = (
  id: string,
  overrides: Partial<QuizQuestion> = {},
): QuizQuestion => ({
  id,
  training_id: 'train-1',
  question: `Question ${id}`,
  options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
  correct_index: 0,
  sort_order: 0,
  ...overrides,
});

describe('createQuizSession', () => {
  it('renvoie une session vide pour un tableau vide', () => {
    const session = createQuizSession([]);
    expect(session.questions).toHaveLength(0);
    expect(session.bankSize).toBe(0);
    expect(session.drawn).toBe(0);
  });

  it('conserve toutes les questions quand la banque est petite', () => {
    const questions = [
      makeQuestion('q1'),
      makeQuestion('q2'),
      makeQuestion('q3'),
    ];
    const session = createQuizSession(questions);
    expect(session.questions).toHaveLength(3);
    expect(session.bankSize).toBe(3);
  });

  it('mélange les options et la bonne réponse suit', () => {
    const q = makeQuestion('q1', {
      options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      correct_index: 2,
    });
    const results = Array.from({ length: 20 }, () => createQuizSession([q]));
    results.forEach(({ questions }) => {
      const sq = questions[0]!;
      expect(sq.options).toHaveLength(4);
      expect(sq.options[sq.correctAnswerIndex]).toBe('Gamma');
    });
  });

  it('la bonne réponse ne reste pas toujours en position 0', () => {
    const q = makeQuestion('q1', {
      options: ['Bonne', 'Mauvaise A', 'Mauvaise B', 'Mauvaise C'],
      correct_index: 0,
    });
    const positions = new Set(
      Array.from({ length: 40 }, () => {
        const { questions } = createQuizSession([q]);
        return questions[0]!.correctAnswerIndex;
      }),
    );
    expect(positions.size).toBeGreaterThan(1);
  });

  it('sélectionne au plus N questions depuis une grande banque', () => {
    const questions = Array.from({ length: 20 }, (_, i) =>
      makeQuestion(`q${i}`),
    );
    const session = createQuizSession(questions);
    expect(session.drawn).toBeLessThanOrEqual(15);
    expect(session.drawn).toBeGreaterThanOrEqual(1);
  });

  it('respecte overrideDraw', () => {
    const questions = Array.from({ length: 20 }, (_, i) =>
      makeQuestion(`q${i}`),
    );
    const session = createQuizSession(questions, 5);
    expect(session.questions).toHaveLength(5);
  });

  it('respecte la distribution de difficulté', () => {
    const questions = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeQuestion(`e${i}`, { difficulty: 'easy' }),
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeQuestion(`m${i}`, { difficulty: 'medium' }),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeQuestion(`h${i}`, { difficulty: 'hard' }),
      ),
    ];
    const session = createQuizSession(questions, 10);
    const hard = session.questions.filter(
      (q) => q.difficulty === 'hard',
    ).length;
    expect(hard).toBeGreaterThanOrEqual(1);
  });

  it('is_critical hérite de question_type critical', () => {
    const q = makeQuestion('q1', { question_type: 'critical' });
    const { questions } = createQuizSession([q]);
    expect(questions[0]?.is_critical).toBe(true);
  });
});

describe('banques de quiz démo', () => {
  const bank: QuizQuestion[] = getDemoTrainingQuizQuestions().map((q) => ({
    ...q,
    question_type: q.question_type ?? undefined,
    difficulty: q.difficulty ?? undefined,
    is_critical: q.is_critical ?? undefined,
  }));
  const trainingIds = [...new Set(bank.map((q) => q.training_id))];
  const enrichedIds = [
    'demo-training-1',
    'demo-training-2',
    'demo-training-3',
    'demo-training-4',
  ];

  it('expose au moins six modules avec une banque non vide', () => {
    expect(trainingIds.length).toBeGreaterThanOrEqual(6);
    trainingIds.forEach((id) => {
      const count = bank.filter((q) => q.training_id === id).length;
      expect(count).toBeGreaterThanOrEqual(6);
    });
  });

  it('tire exactement 8 questions par tentative pour les modules enrichis', () => {
    enrichedIds.forEach((id) => {
      const questions = bank.filter((q) => q.training_id === id);
      expect(questions.length).toBeGreaterThanOrEqual(12);
      for (let i = 0; i < 10; i += 1) {
        expect(createQuizSession(questions).drawn).toBe(8);
      }
    });
  });

  it('chaque question tirée possède une bonne réponse identifiable', () => {
    const t1 = bank.filter((q) => q.training_id === 'demo-training-1');
    const { questions } = createQuizSession(t1);
    questions.forEach((q) => {
      expect(q.options[q.correctAnswerIndex]).toBeTruthy();
    });
  });
});

describe('scoreQuizSession', () => {
  it('renvoie 0 pour une session vide', () => {
    const result = scoreQuizSession([], []);
    expect(result.score).toBe(0);
    expect(result.failedCritical).toBe(false);
  });

  it('calcule le score correctement', () => {
    const { questions } = createQuizSession([
      makeQuestion('q1', { options: ['A', 'B', 'C'], correct_index: 0 }),
      makeQuestion('q2', { options: ['A', 'B', 'C'], correct_index: 0 }),
    ]);
    const answers = questions.map((q) => q.correctAnswerIndex);
    const result = scoreQuizSession(questions, answers);
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(2);
  });

  it("détecte l'échec d'une question critique", () => {
    const { questions } = createQuizSession([
      makeQuestion('q1', {
        question_type: 'critical',
        options: ['A', 'B', 'C'],
        correct_index: 0,
      }),
      makeQuestion('q2', { options: ['A', 'B', 'C'], correct_index: 0 }),
    ]);
    const critIdx = questions.findIndex((q) => q.is_critical);
    const answers = questions.map((q) => q.correctAnswerIndex);
    // Rater la question critique
    const critQ = questions[critIdx];
    if (critIdx >= 0 && critQ) {
      answers[critIdx] = (answers[critIdx]! + 1) % critQ.options.length;
    }
    const result = scoreQuizSession(questions, answers);
    expect(result.failedCritical).toBe(true);
  });
});

describe('isQuizPassed', () => {
  it('valide si score suffisant et aucune critique ratée', () => {
    expect(isQuizPassed(80, false, 70)).toBe(true);
  });

  it('refuse si score insuffisant', () => {
    expect(isQuizPassed(60, false, 70)).toBe(false);
  });

  it('refuse si question critique ratée même avec score suffisant', () => {
    expect(isQuizPassed(90, true, 70)).toBe(false);
  });

  it('seuil par défaut 70 %', () => {
    expect(isQuizPassed(70, false)).toBe(true);
    expect(isQuizPassed(69, false)).toBe(false);
  });
});
