import { Platform, Share } from 'react-native';

import type { Audit } from '../lib/supabase';
import { dataToCSV } from './export';

function auditToRow(a: Audit) {
  return {
    Titre: a.title,
    Statut: a.status,
    Score: a.score ?? '',
    'Score max': a.max_score,
    Problèmes: a.issues_count,
    Localisation: a.location ?? '',
    'Créé le': a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '',
    'Terminé le': a.completed_at ? new Date(a.completed_at).toLocaleDateString('fr-FR') : '',
  };
}

export async function exportAuditsAsCSV(audits: Audit[], filename = 'audits') {
  const rows = audits.map(auditToRow);
  const csv = dataToCSV(rows);
  const name = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ title: name, message: csv });
  }
}
