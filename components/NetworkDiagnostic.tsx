import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Wifi, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw } from 'lucide-react-native'

export default function NetworkDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const runDiagnostic = async () => {
    setTesting(true)
    const results: any = {}

    // 1. Vérifier les variables d'environnement
    results.env = {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      keyLength: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    }

    // 2. Test de connectivité basique
    try {
      const response = await fetch('https://httpbin.org/status/200')
      results.internetConnection = response.status === 200
    } catch (error) {
      results.internetConnection = false
      results.internetError = error
    }

    // 3. Test Supabase
    if (results.env.supabaseUrl && results.env.supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const supabaseResponse = await fetch(`${results.env.supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`
          }
        })
        results.supabaseConnection = {
          status: supabaseResponse.status,
          ok: supabaseResponse.ok,
          headers: Object.fromEntries(supabaseResponse.headers.entries())
        }
      } catch (error) {
        results.supabaseConnection = { error: error.toString() }
      }
    }

    setDiagnosticResults(results)
    setTesting(false)
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle size={16} color="#10B981" />
    if (status === false) return <AlertTriangle size={16} color="#EF4444" />
    return <Wifi size={16} color="#6B7280" />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={24} color="#EF4444" />
        <Text style={styles.title}>Diagnostic Réseau 502</Text>
        <TouchableOpacity onPress={runDiagnostic} disabled={testing}>
          <RefreshCw size={20} color={testing ? "#9CA3AF" : "#2563EB"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Configuration</Text>
          <View style={styles.resultItem}>
            {getStatusIcon(!!diagnosticResults.env?.supabaseUrl)}
            <Text>URL Supabase: {diagnosticResults.env?.supabaseUrl || 'NON DÉFINIE'}</Text>
          </View>
          <View style={styles.resultItem}>
            {getStatusIcon(diagnosticResults.env?.hasAnonKey)}
            <Text>Clé API: {diagnosticResults.env?.hasAnonKey ? 'PRÉSENTE' : 'MANQUANTE'} ({diagnosticResults.env?.keyLength || 0} chars)</Text>
          </View>
        </View>

        {/* Connectivité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Connectivité</Text>
          <View style={styles.resultItem}>
            {getStatusIcon(diagnosticResults.internetConnection)}
            <Text>Internet: {diagnosticResults.internetConnection ? 'CONNECTÉ' : 'PROBLÈME'}</Text>
          </View>
          {diagnosticResults.internetError && (
            <Text style={styles.errorText}>{diagnosticResults.internetError.toString()}</Text>
          )}
        </View>

        {/* Supabase */}
        {diagnosticResults.supabaseConnection && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗄️ Supabase</Text>
            {diagnosticResults.supabaseConnection.error ? (
              <View style={styles.errorContainer}>
                <AlertTriangle size={16} color="#EF4444" />
                <Text style={styles.errorText}>ERREUR: {diagnosticResults.supabaseConnection.error}</Text>
              </View>
            ) : (
              <>
                <View style={styles.resultItem}>
                  {getStatusIcon(diagnosticResults.supabaseConnection.ok)}
                  <Text>Status: {diagnosticResults.supabaseConnection.status}</Text>
                </View>
                <View style={styles.resultItem}>
                  {getStatusIcon(diagnosticResults.supabaseConnection.ok)}
                  <Text>Connexion: {diagnosticResults.supabaseConnection.ok ? 'OK' : 'ÉCHEC'}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Solutions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Solutions</Text>
          <Text style={styles.solution}>1. Vérifiez votre connexion internet</Text>
          <Text style={styles.solution}>2. Cliquez "Connect to Supabase" en haut à droite</Text>
          <Text style={styles.solution}>3. Redémarrez Expo Go</Text>
          <Text style={styles.solution}>4. Essayez en mode simulateur iOS/Android</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
    marginLeft: 8,
  },
  results: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
  },
  solution: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
})