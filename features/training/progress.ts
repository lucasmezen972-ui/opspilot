export function uniqueChapterIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function calculateReadingProgress(
  completedChapterIds: string[],
  totalChapters: number,
): number {
  if (totalChapters <= 0) return 0;
  return Math.min(
    100,
    Math.round(
      (uniqueChapterIds(completedChapterIds).length / totalChapters) * 100,
    ),
  );
}

export function calculateQuizScore(
  correctIndexes: number[],
  answers: number[],
): number {
  if (correctIndexes.length === 0) return 0;
  const correct = correctIndexes.reduce(
    (total, correctIndex, index) =>
      total + (answers[index] === correctIndex ? 1 : 0),
    0,
  );
  return Math.round((correct / correctIndexes.length) * 100);
}
