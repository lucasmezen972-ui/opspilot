import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface OfflineAudit {
  id: string;
  [key: string]: any;
}

interface OfflineTask {
  id: string;
  [key: string]: any;
}

interface QueueItem {
  id: string;
  table: string;
  action: 'insert' | 'update';
  data: Record<string, any>;
  timestamp: number;
}

const STORAGE_KEYS = {
  audits: '@opspilot:offline:audits',
  tasks: '@opspilot:offline:tasks',
  queue: '@opspilot:offline:queue',
};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function initOfflineDatabase() {
  try {
    const existing = await getItem(STORAGE_KEYS.queue);
    if (!existing) {
      await setItem(STORAGE_KEYS.queue, JSON.stringify([]));
    }
    return { success: true, message: 'Offline storage initialized' };
  } catch (error) {
    console.error('[Offline] Failed to initialize storage:', error);
    return { success: false, message: 'Storage initialization failed' };
  }
}

export async function syncPendingData() {
  try {
    const raw = await getItem(STORAGE_KEYS.queue);
    const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
    if (queue.length === 0) {
      return { success: true, synced: 0 };
    }
    // Items will be synced when the app has connectivity and Supabase is reachable.
    // For now return the count of pending items.
    return { success: true, synced: 0, pending: queue.length };
  } catch (error) {
    console.error('[Offline] Sync failed:', error);
    return { success: false, synced: 0 };
  }
}

export async function isOnline(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  return true;
}

export async function loadOfflineAudits(): Promise<OfflineAudit[]> {
  try {
    const stored = await getItem(STORAGE_KEYS.audits);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('[Offline] Failed to load audits:', error);
    return [];
  }
}

export async function setOfflineAudits(audits: OfflineAudit[]): Promise<void> {
  try {
    await setItem(STORAGE_KEYS.audits, JSON.stringify(audits));
  } catch (error) {
    console.warn('[Offline] Failed to save audits:', error);
  }
}

export async function loadOfflineTasks(): Promise<OfflineTask[]> {
  try {
    const stored = await getItem(STORAGE_KEYS.tasks);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('[Offline] Failed to load tasks:', error);
    return [];
  }
}

export async function setOfflineTasks(tasks: OfflineTask[]): Promise<void> {
  try {
    await setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  } catch (error) {
    console.warn('[Offline] Failed to save tasks:', error);
  }
}

export async function queueAudit(audit: OfflineAudit): Promise<void> {
  try {
    const raw = await getItem(STORAGE_KEYS.queue);
    const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push({ id: audit.id, table: 'audits', action: 'insert', data: audit, timestamp: Date.now() });
    await setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch (error) {
    console.warn('[Offline] Failed to queue audit:', error);
  }
}

export async function queueTask(task: OfflineTask): Promise<void> {
  try {
    const raw = await getItem(STORAGE_KEYS.queue);
    const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push({ id: task.id, table: 'tasks', action: 'insert', data: task, timestamp: Date.now() });
    await setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch (error) {
    console.warn('[Offline] Failed to queue task:', error);
  }
}

export async function queuePhoto(auditId: string, photoUrl: string): Promise<void> {
  try {
    const raw = await getItem(STORAGE_KEYS.queue);
    const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `photo-${Date.now()}`,
      table: 'audit_photos',
      action: 'insert',
      data: { audit_id: auditId, image_url: photoUrl },
      timestamp: Date.now(),
    });
    await setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch (error) {
    console.warn('[Offline] Failed to queue photo:', error);
  }
}

export function encryptData(data: string): string {
  try {
    return btoa(data);
  } catch {
    return data;
  }
}

export function decryptData(encryptedData: string): string {
  try {
    return atob(encryptedData);
  } catch {
    return encryptedData;
  }
}
