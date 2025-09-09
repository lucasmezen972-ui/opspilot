import { useEffect } from 'react'
import { Platform } from 'react-native'
import { initOfflineDatabase, syncPendingData } from '../lib/offline'

let NetInfo: any
try {
  NetInfo = require('@react-native-community/netinfo').default
} catch {
  // NetInfo non disponible (tests/web)
}

export function useOfflineSync() {
  useEffect(() => {
    // Skip offline sync on web platform
    if (Platform.OS === 'web') return
    
    initOfflineDatabase()

    const unsubscribe = NetInfo?.addEventListener
      ? NetInfo.addEventListener((state: any) => {
          if (state.isConnected) {
            syncPendingData()
          }
        })
      : () => {}

    return () => {
      unsubscribe && unsubscribe()
    }
  }, [])
}
