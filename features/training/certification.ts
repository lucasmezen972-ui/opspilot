import type { ShuffledQuestion } from './quizEngine';

/** Identité du candidat à confirmer avant la délivrance d'une attestation. */
export interface CandidateIdentity {
  fullName: string;
  /** Matricule / identifiant salarié. */
  employeeId: string;
  /** Poste occupé. */
  position: string;
  /** Magasin / établissement de rattachement. */
  store: string;
}

export interface IdentityValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Valide l'identité d'un candidat et sa confirmation sur l'honneur. Une
 * attestation quasi-certifiante n'est délivrée que si chaque champ est renseigné
 * et que le candidat a explicitement confirmé son identité.
 */
export function validateCandidateIdentity(
  identity: Partial<CandidateIdentity>,
  honorConfirmed: boolean,
): IdentityValidation {
  const errors: string[] = [];
  if (!identity.fullName?.trim()) errors.push('Le nom complet est requis.');
  if (!identity.employeeId?.trim()) errors.push('Le matricule est requis.');
  if (!identity.position?.trim()) errors.push('Le poste est requis.');
  if (!identity.store?.trim()) errors.push('Le magasin est requis.');
  if (!honorConfirmed) {
    errors.push('La confirmation sur l’honneur est requise.');
  }
  return { valid: errors.length === 0, errors };
}

/** Réponse tracée à une question du quiz (audit / preuve anti-triche). */
export interface AnsweredQuestion {
  questionId: string;
  question: string;
  /** Index de la réponse donnée (null si non répondue). */
  givenAnswerIndex: number | null;
  givenAnswer: string | null;
  correctAnswerIndex: number;
  correctAnswer: string;
  isCorrect: boolean;
  isCritical: boolean;
}

/** Trace complète et reproductible d'une tentative de quiz. */
export interface QuizAttemptTrace {
  /** Version du référentiel de questions (déterministe). */
  version: string;
  attemptNumber: number;
  /** Horodatage de la tentative (ISO). */
  date: string;
  score: number;
  failedCritical: boolean;
  totalQuestions: number;
  correctCount: number;
  answers: AnsweredQuestion[];
}

/**
 * Calcule une version déterministe du référentiel de questions tiré, à partir
 * des identifiants des questions. Permet de retrouver exactement quelle version
 * d'un quiz un candidat a passée.
 */
export function quizVersion(questions: { id: string }[]): string {
  const source = questions
    .map((q) => q.id)
    .sort()
    .join('|');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return `Q-${String(hash).padStart(5, '0')}`;
}

/**
 * Construit la trace d'une tentative de quiz : questions posées dans l'ordre,
 * réponse donnée, bonne réponse, question critique ratée, score, version et
 * numéro de tentative. Sert de preuve d'évaluation pour la certification.
 */
export function buildQuizAttemptTrace(params: {
  questions: ShuffledQuestion[];
  answers: number[];
  attemptNumber?: number;
  now?: Date;
}): QuizAttemptTrace {
  const { questions, answers, attemptNumber = 1, now = new Date() } = params;

  let correctCount = 0;
  let failedCritical = false;

  const tracedAnswers: AnsweredQuestion[] = questions.map((q, index) => {
    const given = answers[index];
    const hasAnswer = typeof given === 'number';
    const isCorrect = hasAnswer && given === q.correctAnswerIndex;
    if (isCorrect) correctCount += 1;
    else if (q.is_critical) failedCritical = true;

    return {
      questionId: q.id,
      question: q.question,
      givenAnswerIndex: hasAnswer ? given : null,
      givenAnswer: hasAnswer ? (q.options[given] ?? null) : null,
      correctAnswerIndex: q.correctAnswerIndex,
      correctAnswer: q.options[q.correctAnswerIndex] ?? '',
      isCorrect,
      isCritical: q.is_critical,
    };
  });

  const score =
    questions.length === 0
      ? 0
      : Math.round((correctCount / questions.length) * 100);

  return {
    version: quizVersion(questions),
    attemptNumber,
    date: now.toISOString(),
    score,
    failedCritical,
    totalQuestions: questions.length,
    correctCount,
    answers: tracedAnswers,
  };
}
