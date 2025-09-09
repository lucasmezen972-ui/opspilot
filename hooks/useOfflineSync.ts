import { useEffect } from 'react'
import { initOfflineDatabase, syncPendingData } from '../lib/offline'

let NetInfo: any
try {
  NetInfo = require('@react-native-community/netinfo').default
} catch {
  // NetInfo non disponible (tests/web)
}

export function useOfflineSync() {
  useEffect(() => {
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
