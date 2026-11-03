import { Platform, Share } from 'react-native';

import { csvCell } from './csv';

export function dataToCSV(data: Record<string, unknown>[]): string {
  const first = data[0];
  if (!first) return '';
  const headers = Object.keys(first);
  const csv = [headers.map(csvCell).join(',')];
  for (const row of data) {
    const values = headers.map((h) => csvCell(row[h]));
    csv.push(values.join(','));
  }
  return csv.join('\n');
}

export async function dataToExcelBuffer(
  data: Record<string, unknown>[],
): Promise<ArrayBuffer> {
  // Keep the spreadsheet engine out of the initial web application bundle.
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  const first = data[0];
  if (first) {
    worksheet.columns = Object.keys(first).map((key) => ({
      header: key,
      key,
    }));
    data.forEach((item) => {
      worksheet.addRow(item);
    });
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  // The browser has no Node Buffer global; normalize either SDK output shape.
  return new Uint8Array(buffer).buffer;
}

function triggerWebDownload(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge un jeu de données au format CSV ou Excel (web : téléchargement de
 * fichier ; natif : partage CSV, faute de partage binaire simple).
 */
export async function downloadDataset(
  rows: Record<string, unknown>[],
  filename: string,
  format: 'csv' | 'xlsx',
): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `${filename}-${stamp}.${format}`;

  if (format === 'csv') {
    const csv = dataToCSV(rows);
    if (Platform.OS === 'web') {
      triggerWebDownload(
        new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }),
        name,
      );
    } else {
      await Share.share({ title: name, message: csv });
    }
    return;
  }

  if (Platform.OS === 'web') {
    const buffer = await dataToExcelBuffer(rows);
    triggerWebDownload(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      name,
    );
  } else {
    // Natif : repli sur le CSV (partage texte).
    await Share.share({ title: name, message: dataToCSV(rows) });
  }
}
