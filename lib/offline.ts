import { supabase } from './supabase'
import { Platform } from 'react-native'

// Dynamic imports to avoid issues in non-native environments (like tests)
let SQLite: any;
let NetInfo: any;
try {
  if (Platform.OS !== 'web') {
    SQLite = require('expo-sqlite');
  }
} catch {
  // SQLite n'est pas disponible (tests ou environnement web)
}
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  // NetInfo n'est pas disponible
}

const db = SQLite && Platform.OS !== 'web' ? SQLite.openDatabase('opspilot.db') : null;

export const initOfflineDatabase = () => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, synced INTEGER DEFAULT 0)',
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS audits (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, synced INTEGER DEFAULT 0)',
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT NOT NULL, audit_id TEXT, synced INTEGER DEFAULT 0)',
    );
  });
};

const runQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve) => {
    if (!db || Platform.OS === 'web') return resolve([]);
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => {
          const items: any[] = [];
          for (let i = 0; i < result.rows.length; i++) {
            items.push(result.rows.item(i));
          }
          resolve(items);
        },
        (_: any, error: any) => {
          console.warn('SQLite error', error);
          resolve([]);
          return false;
        },
      );
    });
  });
};

export const isOnline = async (): Promise<boolean> => {
  try {
    if (!NetInfo) return true;
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  } catch {
    return true;
  }
};

// ----- Helpers pour les tâches -----
export const setOfflineTasks = async (tasks: any[]) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql('DELETE FROM tasks');
    tasks.forEach((t) => {
      tx.executeSql('INSERT INTO tasks (data, synced) VALUES (?, 1)', [
        JSON.stringify(t),
      ]);
    });
  });
};

export const loadOfflineTasks = async (): Promise<any[]> => {
  const rows = await runQuery('SELECT data FROM tasks');
  return rows.map((r) => JSON.parse(r.data));
};

export const queueTask = async (task: any) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql('INSERT INTO tasks (data, synced) VALUES (?, 0)', [
      JSON.stringify(task),
    ]);
  });
};

// ----- Helpers pour les audits -----
export const setOfflineAudits = async (audits: any[]) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql('DELETE FROM audits');
    audits.forEach((a) => {
      tx.executeSql('INSERT INTO audits (data, synced) VALUES (?, 1)', [
        JSON.stringify(a),
      ]);
    });
  });
};

export const loadOfflineAudits = async (): Promise<any[]> => {
  const rows = await runQuery('SELECT data FROM audits');
  return rows.map((r) => JSON.parse(r.data));
};

export const queueAudit = async (audit: any) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql('INSERT INTO audits (data, synced) VALUES (?, 0)', [
      JSON.stringify(audit),
    ]);
  });
};

// ----- Photos -----
export const queuePhoto = async (auditId: string, uri: string) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql(
      'INSERT INTO photos (uri, audit_id, synced) VALUES (?, ?, 0)',
      [uri, auditId],
    );
  });
};

const updatePhotoAuditIds = (oldId: string, newId: string) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql('UPDATE photos SET audit_id = ? WHERE audit_id = ?', [
      newId,
      oldId,
    ]);
  });
};

const markSynced = (table: string, id: number) => {
  if (!db || Platform.OS === 'web') return;
  db.transaction((tx: any) => {
    tx.executeSql(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [id]);
  });
};

const getUnsynced = (table: string): Promise<any[]> =>
  runQuery(`SELECT * FROM ${table} WHERE synced = 0`);

export const syncPendingData = async () => {
  if (!(await isOnline()) || !db || Platform.OS === 'web') return;

  // Tâches
  const tasks = await getUnsynced('tasks');
  for (const t of tasks) {
    const data = JSON.parse(t.data);
    const { local_id: _localId, ...payload } = data;
    let error;
    if (payload.id && !String(payload.id).startsWith('offline-')) {
      ({ error } = await supabase.from('tasks').upsert(payload));
    } else {
      const { id: _id, ...insertPayload } = payload;
      ({ error } = await supabase.from('tasks').insert(insertPayload));
    }
    if (!error) markSynced('tasks', t.id);
  }

  // Audits
  const audits = await getUnsynced('audits');
  for (const a of audits) {
    const data = JSON.parse(a.data);
    const { local_id, ...payload } = data;
    if (payload.id && !String(payload.id).startsWith('offline-')) {
      const { error } = await supabase.from('audits').upsert(payload);
      if (!error) markSynced('audits', a.id);
    } else {
      const { id: _id, ...insertPayload } = payload;
      const { data: created, error } = await supabase
        .from('audits')
        .insert(insertPayload)
        .select()
        .single();
      if (!error && created) {
        markSynced('audits', a.id);
        if (local_id) updatePhotoAuditIds(local_id, created.id);
      }
    }
  }

  // Photos
  const photos = await getUnsynced('photos');
  for (const p of photos) {
    try {
      const fileName = `offline-${Date.now()}.jpg`;
      const response = await fetch(p.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('audit-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage
          .from('audit-photos')
          .getPublicUrl(fileName);
        if (publicUrl?.publicUrl) {
          const { data: auditData } = await supabase
            .from('audits')
            .select('photos')
            .eq('id', p.audit_id)
            .single();
          const updatedPhotos = auditData?.photos
            ? [...auditData.photos, publicUrl.publicUrl]
            : [publicUrl.publicUrl];
          await supabase
            .from('audits')
            .update({
              photos: updatedPhotos,
              updated_at: new Date().toISOString(),
            })
            .eq('id', p.audit_id);
          markSynced('photos', p.id);
        }
      }
    } catch (err) {
      console.warn('Erreur sync photo', err);
    }
  }
};

export const offlineHelpers = {
  initOfflineDatabase,
  isOnline,
  setOfflineTasks,
  loadOfflineTasks,
  queueTask,
  setOfflineAudits,
  loadOfflineAudits,
  queueAudit,
  queuePhoto,
  syncPendingData,
};

export type {};
