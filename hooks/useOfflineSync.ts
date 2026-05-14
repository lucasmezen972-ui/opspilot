import { useEffect } from 'react';
import { Platform } from 'react-native';

import { initOfflineDatabase, syncPendingData, isOnline } from '../lib/offline';

interface NetInfoState {
  isConnected: boolean;
}

interface NetInfoModule {
  addEventListener: (callback: (state: NetInfoState) => void) => () => void;
}

function getNetInfo(): NetInfoModule | undefined {
  if (Platform.OS === 'web') {
    console.log('[OfflineSync] Web platform - offline sync disabled');
    return undefined;
  }

  try {
    const NetInfo = require('@react-native-community/netinfo') as {
      default: NetInfoModule;
    };
    return NetInfo.default;
  } catch (error) {
    console.log('[OfflineSync] NetInfo not available:', error);
    return undefined;
  }
}

export function useOfflineSync() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log(
        '[OfflineSync] Web platform detected - skipping offline features',
      );
      return;
    }

    // Initialize offline database
    try {
      initOfflineDatabase();
      console.log('[OfflineSync] Offline database initialized');
    } catch (error) {
      console.error('[OfflineSync] Database initialization failed:', error);
      return;
    }

    const NetInfo = getNetInfo();
    if (!NetInfo) {
      console.log('[OfflineSync] NetInfo not available - sync disabled');
      return;
    }

    // Set up network listener for auto-sync
    const unsubscribe = NetInfo.addEventListener(
      async (state: NetInfoState) => {
        console.log('[OfflineSync] Network state changed:', state.isConnected);

        if (state.isConnected) {
          try {
            await syncPendingData();
            console.log('[OfflineSync] Data synchronized successfully');
          } catch (error) {
            console.error('[OfflineSync] Sync failed:', error);
          }
        }
      },
    );

    // Initial sync check
    isOnline().then((online) => {
      if (online) {
        syncPendingData().catch((error) => {
          console.error('[OfflineSync] Initial sync failed:', error);
        });
      }
    });

    return unsubscribe;
  }, []);
}
