import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CircleCheck as CheckCircle, Wifi } from 'lucide-react-native'

interface ConnectedStatusProps {
  isConnected: boolean
  dataCount?: number
  databaseHealth?: any
}

export default function ConnectedStatus({ isConnected, dataCount, databaseHealth }: ConnectedStatusProps) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  const hasValidConfig = supabaseUrl && 
                        supabaseUrl !== 'https://placeholder.supabase.co' &&
                        supabaseKey && 
                        supabaseKey !== 'placeholder-anon-key'

  const getHealthStatus = () => {
    if (!databaseHealth) return 'Vérification'
    
    if (databaseHealth.connection && databaseHealth.tables && databaseHealth.data) {
      return '🟢 Backend opérationnel'
    } else if (databaseHealth.connection && databaseHealth.tables) {
      return '🟡 Tables OK, données manquantes'
    } else if (databaseHealth.connection) {
      return '🟠 Connexion OK, tables manquantes'
    } else {
      return '🔴 Problème de connexion'
    }
  }
  return (
    <View style={[styles.container, hasValidConfig ? styles.connected : styles.disconnected]}>
      {hasValidConfig ? (
        <CheckCircle size={16} color="#10B981" />
      ) : (
        <Wifi size={16} color="#6B7280" />
      )}
      <Text style={[styles.text, hasValidConfig ? styles.connectedText : styles.disconnectedText]}>
        {hasValidConfig ? 
          `${getHealthStatus()}${dataCount ? ` ${dataCount} enregistrements` : ''}` :
          '⚠️ Cliquez "Connect to Supabase" en haut à droite'
        }
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  connected: {
    backgroundColor: '#DCFCE7',
  },
  disconnected: {
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontSize: 12,
    marginLeft: 6,
  },
  connectedText: {
    color: '#16A34A',
    fontWeight: '500',
  },
  disconnectedText: {
    color: '#6B7280',
  },
})