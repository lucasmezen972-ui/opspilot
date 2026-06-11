import { describe, expect, it } from 'vitest';

import {
  calculateQuizScore,
  calculateReadingProgress,
  uniqueChapterIds,
} from '../../../features/training/progress';

describe('training progress', () => {
  it('déduplique les chapitres lus', () => {
    expect(uniqueChapterIds(['a', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('calcule la progression réelle de lecture', () => {
    expect(calculateReadingProgress(['a', 'b'], 4)).toBe(50);
    expect(calculateReadingProgress([], 0)).toBe(0);
  });

  it('calcule le score du quiz', () => {
    expect(calculateQuizScore([1, 0, 2, 1], [1, 0, 0, 1])).toBe(75);
    expect(calculateQuizScore([], [])).toBe(0);
  });
});
