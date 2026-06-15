import { describe, it, expect } from 'vitest';

import {
  validateCandidateIdentity,
  buildQuizAttemptTrace,
  quizVersion,
} from '../../../features/training/certification';
import type { ShuffledQuestion } from '../../../features/training/quizEngine';

function q(p: Partial<ShuffledQuestion>): ShuffledQuestion {
  return {
    id: 'q1',
    question: 'Question ?',
    options: ['A', 'B', 'C'],
    correctAnswerIndex: 0,
    question_type: 'qcm_single',
    difficulty: 'easy',
    is_critical: false,
    ...p,
  };
}

describe('validateCandidateIdentity', () => {
  const complete = {
    fullName: 'Marie Dupont',
    employeeId: 'M-1042',
    position: 'Responsable de rayon',
    store: 'Magasin Lyon Part-Dieu',
  };

  it('valide une identité complète avec confirmation sur l’honneur', () => {
    expect(validateCandidateIdentity(complete, true).valid).toBe(true);
  });

  it('refuse sans confirmation sur l’honneur', () => {
    const result = validateCandidateIdentity(complete, false);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/honneur/i);
  });

  it('liste chaque champ manquant', () => {
    const result = validateCandidateIdentity(
      { fullName: '', employeeId: '', position: '', store: '' },
      false,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(5);
  });
});

describe('quizVersion', () => {
  it('est déterministe et indépendant de l’ordre', () => {
    const a = quizVersion([{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]);
    const b = quizVersion([{ id: 'q3' }, { id: 'q1' }, { id: 'q2' }]);
    expect(a).toBe(b);
    expect(a).toMatch(/^Q-\d{5}$/);
  });

  it('change si le référentiel change', () => {
    expect(quizVersion([{ id: 'q1' }])).not.toBe(quizVersion([{ id: 'q9' }]));
  });
});

describe('buildQuizAttemptTrace', () => {
  const questions: ShuffledQuestion[] = [
    q({ id: 'a', correctAnswerIndex: 1, options: ['x', 'bonne', 'y'] }),
    q({
      id: 'b',
      correctAnswerIndex: 0,
      is_critical: true,
      options: ['critique', 'z', 'w'],
    }),
  ];

  it('trace chaque question, réponse donnée et bonne réponse', () => {
    const trace = buildQuizAttemptTrace({
      questions,
      answers: [1, 0],
      attemptNumber: 2,
      now: new Date('2026-06-15T10:00:00.000Z'),
    });
    expect(trace.score).toBe(100);
    expect(trace.failedCritical).toBe(false);
    expect(trace.totalQuestions).toBe(2);
    expect(trace.correctCount).toBe(2);
    expect(trace.attemptNumber).toBe(2);
    expect(trace.date).toBe('2026-06-15T10:00:00.000Z');
    expect(trace.answers[0]?.givenAnswer).toBe('bonne');
    expect(trace.answers[0]?.isCorrect).toBe(true);
    expect(trace.version).toMatch(/^Q-\d{5}$/);
  });

  it('signale une question critique ratée', () => {
    const trace = buildQuizAttemptTrace({
      questions,
      answers: [1, 2],
    });
    expect(trace.failedCritical).toBe(true);
    expect(trace.score).toBe(50);
    expect(trace.answers[1]?.isCorrect).toBe(false);
    expect(trace.answers[1]?.isCritical).toBe(true);
  });

  it('gère une question non répondue', () => {
    const trace = buildQuizAttemptTrace({
      questions,
      answers: [1],
    });
    expect(trace.answers[1]?.givenAnswerIndex).toBe(null);
    expect(trace.answers[1]?.givenAnswer).toBe(null);
    expect(trace.failedCritical).toBe(true);
  });
});
