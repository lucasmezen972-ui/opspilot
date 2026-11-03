import { describe, expect, it } from 'vitest';

import { csvCell } from '../../utils/csv';
import { dataToCSV } from '../../utils/export';

describe('spreadsheet export boundaries', () => {
  it('preserves quotes, commas and newlines using CSV escaping', () => {
    expect(dataToCSV([{ name: 'A "B", C\nD' }])).toBe(
      '"name"\n"A ""B"", C\nD"',
    );
  });
  it.each([
    '=1+1',
    '+SUM(A1:A2)',
    '@SUM(A1)',
    '-1+2',
    ' \t=HYPERLINK("https://example.invalid")',
  ])('neutralizes user-entered formula %s', (value) => {
    expect(csvCell(value)).toMatch(/^"'/);
  });
  it('keeps actual numeric amounts numeric and exports empty fields', () => {
    expect(csvCell(-19.9)).toBe('-19.9');
    expect(csvCell(null)).toBe('""');
    expect(csvCell('Texte')).toBe('"Texte"');
  });
});
