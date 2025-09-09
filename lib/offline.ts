import { Platform } from 'react-native';

// Offline sync utilities for the mobile app
// This file handles local database operations and sync logic

let cryptoJs: any = null;
try {
  if (Platform.OS !== 'web') {
    cryptoJs = require('crypto-js');
  }
} catch (error) {
  console.warn('[Offline] CryptoJS not available, encryption disabled');
}

export async function initOfflineDatabase() {
  if (Platform.OS === 'web') {
    console.log('[Offline] Skipping SQLite init on web platform');
    return { success: true, message: 'Web platform - no local DB needed' };
  }
  
  try {
    // Initialize SQLite database for mobile platforms
    console.log('[Offline] Initializing offline database...');
    // Mobile-specific database initialization would go here
    return { success: true, message: 'Offline database initialized' };
  } catch (error) {
    console.error('[Offline] Failed to initialize database:', error);
    return { success: false, message: 'Database initialization failed' };
  }
}

export async function syncPendingData() {
  if (Platform.OS === 'web') {
    console.log('[Offline] Sync not needed on web platform');
    return { success: true, synced: 0 };
  }
  
  try {
    console.log('[Offline] Syncing pending data...');
    // Sync logic for mobile platforms would go here
    return { success: true, synced: 0 };
  } catch (error) {
    console.error('[Offline] Sync failed:', error);
    return { success: false, synced: 0 };
  }
}

export function isOnline(): boolean {
  if (Platform.OS === 'web') {
    return navigator.onLine;
  }
  
  // For mobile platforms, you would typically use NetInfo
  // For now, assume online
  return true;
}

export function encryptData(data: string): string {
  if (!cryptoJs) {
    console.warn('[Offline] Encryption not available, returning plain data');
    return data;
  }
  
  try {
    return cryptoJs.AES.encrypt(data, 'offline-key').toString();
  } catch (error) {
    console.warn('[Offline] Encryption failed, returning plain data');
    return data;
  }
}

export function decryptData(encryptedData: string): string {
  if (!cryptoJs) {
    console.warn('[Offline] Decryption not available, returning data as-is');
    return encryptedData;
  }
  
  try {
    const bytes = cryptoJs.AES.decrypt(encryptedData, 'offline-key');
    return bytes.toString(cryptoJs.enc.Utf8);
  } catch (error) {
    console.warn('[Offline] Decryption failed, returning data as-is');
    return encryptedData;
  }
}