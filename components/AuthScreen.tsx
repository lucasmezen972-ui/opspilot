import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { LogIn, UserPlus } from 'lucide-react-native'
import { useAuth } from '../hooks/useAuth'
import ConnectedStatus from './ConnectedStatus'
import NetworkDiagnostic from './NetworkDiagnostic'

export default function AuthScreen() {
  const { signIn, signUp, error: authError } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testing, setTesting] = useState(false)

  // Pré-remplir avec les identifiants de démo
  const fillDemoCredentials = () => {
    setEmail('marie.dupont@opspilot.com')
    setPassword('demo123')
    setLocalError('')
  }

  // Test automatique de connexion
  const runConnectionTest = async () => {
    setTesting(true)
    setTestResult('🔄 Test en cours...')
    setLocalError('')

    try {
      console.log('🧪 Test automatique de connexion...')
      
      // Tester avec marie.dupont@opspilot.com
      const result1 = await signIn('marie.dupont@opspilot.com', 'demo123')
      
      if (!result1.error) {
        setTestResult('✅ SUCCÈS: marie.dupont@opspilot.com fonctionne !')
        return
      }

      // Tester avec demo@opspilot.com si le premier échoue
      const result2 = await signIn('demo@opspilot.com', 'demo123')
      
      if (!result2.error) {
        setTestResult('✅ SUCCÈS: demo@opspilot.com fonctionne !')
        return
      }

      // Aucun ne marche
      setTestResult('❌ ÉCHEC: Aucun utilisateur démo trouvé')
      setLocalError(`Test 1: ${result1.error?.message}\nTest 2: ${result2.error?.message}`)
      
    } catch (error: any) {
      setTestResult('❌ ERREUR: ' + error.message)
      setLocalError(error.toString())
    } finally {
      setTesting(false)
    }
  }

  const handleAuth = async () => {
    setLocalError('')
    
    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs')
      return
    }

    if (!isLogin && !fullName) {
      setLocalError('Veuillez entrer votre nom complet')
      return
    }

    setLoading(true)

    try {
      let result
      if (isLogin) {
        console.log('🔑 Connexion avec:', email)
        result = await signIn(email, password)
      } else {
        console.log('📝 Inscription avec:', email)
        result = await signUp(email, password, fullName)
      }

      if (result.error) {
        console.error('❌ Erreur auth:', result.error)
        setLocalError(result.error.message || 'Erreur de connexion')
      } else if (!isLogin) {
        console.log('✅ Inscription réussie')
        setLocalError('')
        setIsLogin(true)
      }
    } catch (error) {
      console.error('❌ Erreur inattendue:', error)
      setLocalError('Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  // Afficher l'erreur la plus récente
  const displayError = localError || authError
  const hasNetworkError = displayError?.includes('502') || displayError?.includes('network') || displayError?.includes('fetch')
  const hasInvalidCredentials = displayError?.includes('Invalid login credentials')

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>OP</Text>
        </View>
        <Text style={styles.title}>OpsPilot</Text>
        <Text style={styles.subtitle}>Votre copilote pour des opérations terrain efficaces</Text>
      </View>

      {/* Indicateur de statut Supabase */}
      <View style={styles.statusContainer}>
        <ConnectedStatus isConnected={true} />
      </View>

      {/* Erreurs */}
      {displayError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {displayError}</Text>
          {hasInvalidCredentials && (
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>🔧 L'utilisateur démo n'existe pas encore !</Text>
              <Text style={styles.instructionText}>
                1. Ouvrez Supabase → SQL Editor{'\n'}2. Copiez le script "create_demo_user_final.sql"{'\n'}3. Exécutez-le pour créer l'utilisateur démo{'\n'}4. Puis allez dans Authentication → Users{'\n'}5. Cliquez "Add user" → "Create new user"{'\n'}6. Email: demo@opspilot.com, Password: demo123
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Diagnostic réseau si erreur 502 */}
      {hasNetworkError && <NetworkDiagnostic />}

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {isLogin ? (
            <LogIn size={20} color="#FFFFFF" />
          ) : (
            <UserPlus size={20} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'S\'inscrire'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demoInfo}>
        <Text style={styles.demoTitle}>🎯 Compte de démonstration</Text>
        
        <TouchableOpacity onPress={fillDemoCredentials} style={styles.demoButton}>
          <LogIn size={16} color="#1E40AF" />
          <View style={styles.demoButtonContent}>
            <Text style={styles.demoButtonMainText}>CONNEXION DÉMO</Text>
            <Text style={styles.demoButtonSubText}>Email: marie.dupont@opspilot.com</Text>
            <Text style={styles.demoButtonSubText}>Mot de passe: demo123</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={runConnectionTest} 
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          disabled={testing}
        >
          <Text style={styles.testButtonText}>
            {testing ? '🔄 Test en cours...' : '🧪 Test automatique'}
          </Text>
        </TouchableOpacity>
        
        {testResult && (
          <View style={styles.testResult}>
            <Text style={styles.testResultText}>{testResult}</Text>
          </View>
        )}
        
        {displayError && !hasNetworkError && (
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>💡 L'utilisateur démo n'existe pas</Text>
            <Text style={styles.helpText}>
              1. Ouvrez Supabase, SQL Editor{'\n'}2. Copiez le script create_demo_user_final.sql{'\n'}3. Exécutez-le pour créer l'utilisateur démo{'\n'}4. Puis allez dans Authentication, Users{'\n'}5. Cliquez Add user, Create new user{'\n'}6. Email: demo@opspilot.com, Password: demo123
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusContainer: {
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  demoInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  demoButtonContent: {
    marginLeft: 12,
    flex: 1,
  },
  demoButtonMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  demoButtonSubText: {
    fontSize: 12,
    color: '#DBEAFE',
    marginBottom: 2,
  },
  testButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testResult: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  testResultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },
  helpContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
})