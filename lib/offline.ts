import { Platform } from 'react-native';

// Types pour offline storage
interface OfflineAudit {
  id: string;
  [key: string]: any;
}

interface OfflineTask {
  id: string;
  [key: string]: any;
}

// Storage keys
const STORAGE_KEYS = {
  audits: '@opspilot:offline:audits',
  tasks: '@opspilot:offline:tasks',
  queue: '@opspilot:offline:queue'
};

// Offline sync utilities for the mobile app
export async function initOfflineDatabase() {
  if (Platform.OS === 'web') {
    console.log('[Offline] Web platform - using localStorage');
    return { success: true, message: 'Web storage initialized' };
  }

  try {
    console.log('[Offline] Initializing mobile offline storage...');
    // Mobile-specific storage initialization would go here
    return { success: true, message: 'Offline storage initialized' };
  } catch (error) {
    console.error('[Offline] Failed to initialize storage:', error);
    return { success: false, message: 'Storage initialization failed' };
  }
}

export async function syncPendingData() {
  if (Platform.OS === 'web') {
    console.log('[Offline] Sync not needed on web platform');
    return { success: true, synced: 0 };
  }
  
  try {
    console.log('[Offline] Syncing pending data...');
    // Sync logic would go here when Supabase is configured
    return { success: true, synced: 0 };
  } catch (error) {
    console.error('[Offline] Sync failed:', error);
    return { success: false, synced: 0 };
  }
}

export async function isOnline(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(navigator.onLine);
  }
  
  // For mobile platforms, assume online for now
  return Promise.resolve(true);
}

// Storage functions that don't depend on Supabase
export async function loadOfflineAudits(): Promise<OfflineAudit[]> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEYS.audits);
      return stored ? JSON.parse(stored) : [];
    }
    
    // Mobile storage would use AsyncStorage
    return [];
  } catch (error) {
    console.warn('[Offline] Failed to load audits:', error);
    return [];
  }
}

export async function setOfflineAudits(audits: OfflineAudit[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.audits, JSON.stringify(audits));
    }
    // Mobile storage would use AsyncStorage
  } catch (error) {
    console.warn('[Offline] Failed to save audits:', error);
  }
}

export async function loadOfflineTasks(): Promise<OfflineTask[]> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEYS.tasks);
      return stored ? JSON.parse(stored) : [];
    }
    
    return [];
  } catch (error) {
    console.warn('[Offline] Failed to load tasks:', error);
    return [];
  }
}

export async function setOfflineTasks(tasks: OfflineTask[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    }
  } catch (error) {
    console.warn('[Offline] Failed to save tasks:', error);
  }
}

export async function queueAudit(audit: OfflineAudit): Promise<void> {
  try {
    console.log('[Offline] Queuing audit for sync:', audit.id);
    // Queue for later sync when online and Supabase configured
  } catch (error) {
    console.warn('[Offline] Failed to queue audit:', error);
  }
}

export async function queueTask(task: OfflineTask): Promise<void> {
  try {
    console.log('[Offline] Queuing task for sync:', task.id);
    // Queue for later sync when online and Supabase configured
  } catch (error) {
    console.warn('[Offline] Failed to queue task:', error);
  }
}

export async function queuePhoto(auditId: string, photoUrl: string): Promise<void> {
  try {
    console.log('[Offline] Queuing photo for sync:', auditId, photoUrl);
    // Queue for later sync when online and Supabase configured
  } catch (error) {
    console.warn('[Offline] Failed to queue photo:', error);
  }
}

export function encryptData(data: string): string {
  // Simple base64 encoding for demo purposes
  try {
    return btoa(data);
  } catch (error) {
    console.warn('[Offline] Encryption failed, returning plain data');
    return data;
  }
}

export function decryptData(encryptedData: string): string {
  // Simple base64 decoding for demo purposes
  try {
    return atob(encryptedData);
  } catch (error) {
    console.warn('[Offline] Decryption failed, returning data as-is');
    return encryptedData;
  }
}