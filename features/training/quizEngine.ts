export type QuestionType =
  | 'qcm_single'
  | 'qcm_multi'
  | 'true_false'
  | 'situation'
  | 'chronological'
  | 'association'
  | 'critical';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  training_id: string;
  question: string;
  options: string[];
  correct_index: number;
  correct_indexes?: number[];
  sort_order: number;
  question_type?: QuestionType;
  difficulty?: QuestionDifficulty;
  is_critical?: boolean;
}

export interface ShuffledQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  correctAnswerIndexes?: number[];
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  is_critical: boolean;
}

export interface QuizSession {
  questions: ShuffledQuestion[];
  bankSize: number;
  drawn: number;
}

type BankSize = 'short' | 'medium' | 'advanced';

const BANK_CONFIG: Record<BankSize, { draw: number }> = {
  short: { draw: 8 },
  medium: { draw: 15 },
  advanced: { draw: 25 },
};

const DIFFICULTY_RATIOS = { easy: 0.4, medium: 0.4, hard: 0.2 };

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = tmp;
  }
  return result;
}

function shuffleOptions(
  options: string[],
  correctIndex: number,
  correctIndexes?: number[],
): {
  options: string[];
  correctAnswerIndex: number;
  correctAnswerIndexes?: number[];
} {
  const permutation = shuffleArray(options.map((_, i) => i));
  const shuffled = permutation.map((i) => options[i] as string);
  const invertedMap = new Map<number, number>();
  permutation.forEach((origIdx, newIdx) => invertedMap.set(origIdx, newIdx));
  return {
    options: shuffled,
    correctAnswerIndex: invertedMap.get(correctIndex) ?? 0,
    correctAnswerIndexes: correctIndexes?.map((i) => invertedMap.get(i) ?? 0),
  };
}

function detectBankSize(count: number): BankSize {
  if (count >= 50) return 'advanced';
  if (count >= 15) return 'medium';
  return 'short';
}

function selectFromBank(
  questions: QuizQuestion[],
  drawCount: number,
): QuizQuestion[] {
  if (questions.length <= drawCount) return shuffleArray(questions);

  const byDiff = {
    easy: questions.filter((q) => !q.difficulty || q.difficulty === 'easy'),
    medium: questions.filter((q) => q.difficulty === 'medium'),
    hard: questions.filter((q) => q.difficulty === 'hard' || q.is_critical),
  };

  const hardCount = Math.round(drawCount * DIFFICULTY_RATIOS.hard);
  const easyCount = Math.round(drawCount * DIFFICULTY_RATIOS.easy);
  const mediumCount = drawCount - easyCount - hardCount;

  // Les buckets peuvent se chevaucher (une question medium/easy marquée
  // is_critical figure aussi dans le bucket hard) : on déduplique par id pour
  // ne jamais tirer deux fois la même question.
  const picked = [
    ...shuffleArray(byDiff.easy).slice(0, easyCount),
    ...shuffleArray(byDiff.medium).slice(0, mediumCount),
    ...shuffleArray(byDiff.hard).slice(0, hardCount),
  ];
  const selected: QuizQuestion[] = [];
  const selectedIds = new Set<string>();
  for (const q of picked) {
    if (!selectedIds.has(q.id)) {
      selected.push(q);
      selectedIds.add(q.id);
    }
  }

  const remaining = shuffleArray(
    questions.filter((q) => !selectedIds.has(q.id)),
  );
  let ri = 0;
  while (selected.length < drawCount && ri < remaining.length) {
    const next = remaining[ri++];
    if (next && !selectedIds.has(next.id)) {
      selected.push(next);
      selectedIds.add(next.id);
    }
  }

  return shuffleArray(selected);
}

/**
 * Crée une session de quiz anti-triche à partir d'une banque de questions :
 * sélectionne N questions selon la distribution de difficulté,
 * mélange l'ordre des questions et des options de réponse.
 * La bonne réponse suit le mélange — le score est indépendant de l'ordre d'affichage.
 */
export function createQuizSession(
  questions: QuizQuestion[],
  overrideDraw?: number,
): QuizSession {
  if (questions.length === 0) return { questions: [], bankSize: 0, drawn: 0 };

  const bankSize = detectBankSize(questions.length);
  const drawCount = overrideDraw ?? BANK_CONFIG[bankSize].draw;
  const selected = selectFromBank(
    questions,
    Math.min(drawCount, questions.length),
  );

  const shuffledQuestions: ShuffledQuestion[] = selected.map((q) => {
    const { options, correctAnswerIndex, correctAnswerIndexes } =
      shuffleOptions(q.options, q.correct_index, q.correct_indexes);
    return {
      id: q.id,
      question: q.question,
      options,
      correctAnswerIndex,
      correctAnswerIndexes,
      question_type: q.question_type ?? 'qcm_single',
      difficulty: q.difficulty ?? 'easy',
      is_critical: q.is_critical ?? q.question_type === 'critical',
    };
  });

  return {
    questions: shuffledQuestions,
    bankSize: questions.length,
    drawn: shuffledQuestions.length,
  };
}

/**
 * Calcule le score d'une session de quiz.
 * Une question critique ratée peut faire échouer même si le score global est suffisant.
 */
export function scoreQuizSession(
  questions: ShuffledQuestion[],
  answers: number[],
): { score: number; failedCritical: boolean; correctCount: number } {
  if (questions.length === 0)
    return { score: 0, failedCritical: false, correctCount: 0 };

  let correct = 0;
  let failedCritical = false;

  questions.forEach((q, i) => {
    if (answers[i] === q.correctAnswerIndex) {
      correct++;
    } else if (q.is_critical) {
      failedCritical = true;
    }
  });

  return {
    score: Math.round((correct / questions.length) * 100),
    failedCritical,
    correctCount: correct,
  };
}

/** Détermine si une tentative de quiz est validée. */
export function isQuizPassed(
  score: number,
  failedCritical: boolean,
  minScore = 70,
): boolean {
  return score >= minScore && !failedCritical;
}
