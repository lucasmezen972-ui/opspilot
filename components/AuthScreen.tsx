import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { LogIn, UserPlus } from 'lucide-react-native'
import ConnectedStatus from './ConnectedStatus'
import { useAuth } from '../hooks/useAuth'
import { loginSchema } from '../utils/validation'

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const { signIn, signUp, authError } = useAuth()

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // runConnectionTest(); // garder uniquement en DEV si besoin
    }
  }, [])

  const handleAuth = async () => {
    setLocalError('')

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Champs invalides')
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
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password, fullName)
      }
      if (result.error) throw result.error
    } catch (e: any) {
      setLocalError(e?.message ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const displayError = localError || authError

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>OP</Text>
        </View>
        <Text style={styles.title}>OpsPilot</Text>
        <Text style={styles.subtitle}>
          Votre copilote pour des opérations terrain efficaces
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <ConnectedStatus />
      </View>

      {displayError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {displayError}</Text>
        </View>
      )}

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
            {loading
              ? 'Chargement...'
              : isLogin
                ? 'Se connecter'
                : "S'inscrire"}
          </Text>
        </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchButtonText}>
          {isLogin
            ? "Pas encore de compte ? S'inscrire"
            : 'Déjà un compte ? Se connecter'}
        </Text>
      </TouchableOpacity>
    </View>
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Compte de démonstration</Text>
      <Text style={styles.demoText}>Email: demo@opspilot.com</Text>
      <Text style={styles.demoText}>Mot de passe: demo123</Text>
      <TouchableOpacity
        style={styles.demoFillButton}
        onPress={() => { setEmail('demo@opspilot.com'); setPassword('demo123'); setIsLogin(true); }}
      >
        <Text style={styles.demoFillButtonText}>Remplir automatiquement</Text>
      </TouchableOpacity>
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
  statusIndicator: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
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
  demoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  demoTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  demoText: {
    fontSize: 14,
    color: '#374151',
  },
  demoFillButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoFillButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
})

