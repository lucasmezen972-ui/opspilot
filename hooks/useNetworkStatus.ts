import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true)
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true)

  useEffect(() => {
    // État initial
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected)
      setIsInternetReachable(state.isInternetReachable)
    })

    // Écouter les changements
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected)
      setIsInternetReachable(state.isInternetReachable)
      
      if (__DEV__) {
        console.log('🌐 Network state:', {
          connected: state.isConnected,
          internet: state.isInternetReachable,
          type: state.type
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
  }
}