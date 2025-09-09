import { supabase } from './supabase'
import { Platform } from 'react-native'
import CryptoJS from 'crypto-js'

// Dynamic imports to avoid issues in non-native environments (like tests)
let SQLite: any
let NetInfo: any
let SecureStore: any
let Crypto: any
try {
  if (Platform.OS !== 'web') {
    SQLite = require('expo-sqlite')
    SecureStore = require('expo-secure-store')
    Crypto = require('expo-crypto')
  }
} catch {
  // Modules natifs non disponibles (tests ou environnement web)
}
try {
  NetInfo = require('@react-native-community/netinfo').default
} catch {
  // NetInfo n'est pas disponible
}

const db = SQLite && Platform.OS !== 'web' ? SQLite.openDatabase('opspilot.db') : null

const ENCRYPTION_KEY_STORAGE = 'offline_db_key'
let encryptionKey: string | null = null

const getEncryptionKey = async (): Promise<string> => {
  if (Platform.OS === 'web' || !SecureStore || !Crypto) return ''
  if (encryptionKey) return encryptionKey
  encryptionKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE)
  if (!encryptionKey) {
    const bytes = await Crypto.getRandomBytesAsync(32)
    encryptionKey = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE, encryptionKey)
  }
  return encryptionKey
}

const encrypt = (text: string, key: string) =>
  CryptoJS.AES.encrypt(text, key).toString()
const decrypt = (cipher: string, key: string) =>
  CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8)

export const initOfflineDatabase = async () => {
  if (!db || Platform.OS === 'web') return
  await getEncryptionKey()
  db.transaction((tx: any) => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, synced INTEGER DEFAULT 0)'
    )
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS audits (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, synced INTEGER DEFAULT 0)'
    )
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT NOT NULL, audit_id TEXT, synced INTEGER DEFAULT 0)'
    )
  })
}

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
  if (!db || Platform.OS === 'web') return
  const key = await getEncryptionKey()
  db.transaction((tx: any) => {
    tx.executeSql('DELETE FROM tasks')
    tasks.forEach((t) => {
      const data = key ? encrypt(JSON.stringify(t), key) : JSON.stringify(t)
      tx.executeSql('INSERT INTO tasks (data, synced) VALUES (?, 1)', [data])
    })
  })
}

export const loadOfflineTasks = async (): Promise<any[]> => {
  const key = await getEncryptionKey()
  const rows = await runQuery('SELECT data FROM tasks')
  return rows.map((r) => JSON.parse(key ? decrypt(r.data, key) : r.data))
}

export const queueTask = async (task: any) => {
  if (!db || Platform.OS === 'web') return
  const key = await getEncryptionKey()
  const data = key ? encrypt(JSON.stringify(task), key) : JSON.stringify(task)
  db.transaction((tx: any) => {
    tx.executeSql('INSERT INTO tasks (data, synced) VALUES (?, 0)', [data])
  })
}

// ----- Helpers pour les audits -----
export const setOfflineAudits = async (audits: any[]) => {
  if (!db || Platform.OS === 'web') return
  const key = await getEncryptionKey()
  db.transaction((tx: any) => {
    tx.executeSql('DELETE FROM audits')
    audits.forEach((a) => {
      const data = key ? encrypt(JSON.stringify(a), key) : JSON.stringify(a)
      tx.executeSql('INSERT INTO audits (data, synced) VALUES (?, 1)', [data])
    })
  })
}

export const loadOfflineAudits = async (): Promise<any[]> => {
  const key = await getEncryptionKey()
  const rows = await runQuery('SELECT data FROM audits')
  return rows.map((r) => JSON.parse(key ? decrypt(r.data, key) : r.data))
}

export const queueAudit = async (audit: any) => {
  if (!db || Platform.OS === 'web') return
  const key = await getEncryptionKey()
  const data = key ? encrypt(JSON.stringify(audit), key) : JSON.stringify(audit)
  db.transaction((tx: any) => {
    tx.executeSql('INSERT INTO audits (data, synced) VALUES (?, 0)', [data])
  })
}

// ----- Photos -----
export const queuePhoto = async (auditId: string, uri: string) => {
  if (!db || Platform.OS === 'web') return
  const key = await getEncryptionKey()
  const storedUri = key ? encrypt(uri, key) : uri
  db.transaction((tx: any) => {
    tx.executeSql('INSERT INTO photos (uri, audit_id, synced) VALUES (?, ?, 0)', [storedUri, auditId])
  })
}

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

const getUnsynced = async (table: string): Promise<any[]> => {
  const rows = await runQuery(`SELECT * FROM ${table} WHERE synced = 0`)
  const key = await getEncryptionKey()
  if (!key) return rows
  return rows.map((r) => {
    if (r.data) {
      return { ...r, data: decrypt(r.data, key) }
    }
    if (r.uri) {
      return { ...r, uri: decrypt(r.uri, key) }
    }
    return r
  })
}

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
