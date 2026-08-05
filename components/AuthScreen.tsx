import { Link } from 'expo-router';
import { LogIn, UserPlus, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import ConnectedStatus from './ConnectedStatus';
import { useAuth } from '../hooks/useAuth';
import { colors, shadow } from '../shared/styles/tokens';
import { extractErrorMessage } from '../utils/error';
import { loginSchema } from '../utils/validation';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { signIn, signInDemo, signUp, authError, isOffline } = useAuth();

  const handleAuth = async () => {
    setLocalError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Champs invalides');
      return;
    }

    if (!isLogin && !fullName) {
      setLocalError('Veuillez entrer votre nom complet');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, fullName);
      }
      if (result.error) throw result.error;
      const d = result.data as Record<string, unknown> | null;
      if (!isLogin && d?.user && !d?.session) {
        setLocalError(
          'Compte créé ! Vérifiez votre email pour confirmer votre inscription.',
        );
      }
    } catch (e) {
      setLocalError(extractErrorMessage(e) ?? 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLocalError('');
    setDemoLoading(true);
    try {
      const result = await signInDemo();
      if (result.error) {
        setLocalError(
          extractErrorMessage(result.error) ??
            'Accès démo indisponible. Réessayez.',
        );
      }
    } catch (e) {
      setLocalError(
        extractErrorMessage(e) ?? 'Accès démo indisponible. Réessayez.',
      );
    } finally {
      setDemoLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>OP</Text>
        </View>
        <Text style={styles.title}>OpsPilot</Text>
        <Text style={styles.subtitle}>
          Le carnet de bord terrain pour sécuriser audits, preuves et formations
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <ConnectedStatus />
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Connexion temporairement indisponible. Le mode démo reste
            accessible.
          </Text>
        </View>
      )}

      {displayError && !isOffline && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      <View style={styles.demoContainer}>
        <View style={styles.demoHeader}>
          <Zap size={16} color="#F59E0B" />
          <Text style={styles.demoTitle}>Démo terrain guidée</Text>
          <Text style={styles.demoSubtitle}> (fonctionne hors ligne)</Text>
        </View>
        <TouchableOpacity
          testID="demo-login-button"
          style={[styles.demoButton, demoLoading && styles.demoButtonLoading]}
          onPress={handleDemoLogin}
          disabled={demoLoading || loading}
          accessibilityRole="button"
          accessibilityLabel="Connexion démo"
        >
          {demoLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Zap size={16} color="#FFFFFF" />
          )}
          <Text style={styles.demoButtonText}>
            {demoLoading ? 'Connexion...' : 'Lancer la démo OpsPilot'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou connectez-vous</Text>
        <View style={styles.dividerLine} />
      </View>

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
          testID="email-input"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          testID="password-input"
        />

        <TouchableOpacity
          testID="auth-submit-button"
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading || demoLoading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isLogin ? (
            <LogIn size={20} color="#FFFFFF" />
          ) : (
            <UserPlus size={20} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {loading ? 'Connexion...' : isLogin ? 'Se connecter' : "S'inscrire"}
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

      <View style={styles.legalLinks}>
        <Link href="/legal/mentions-legales" style={styles.legalLink}>
          Mentions légales
        </Link>
        <Text style={styles.legalSeparator}>•</Text>
        <Link href="/legal/confidentialite" style={styles.legalLink}>
          Confidentialité
        </Link>
        <Text style={styles.legalSeparator}>•</Text>
        <Link href="/legal/cgu" style={styles.legalLink}>
          CGU
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: { marginBottom: 12 },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  demoContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoTitle: { fontWeight: '600', fontSize: 14, color: '#92400E' },
  demoSubtitle: { fontSize: 12, color: '#B45309', fontStyle: 'italic' },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
  },
  demoButtonLoading: { opacity: 0.8 },
  demoButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 12 },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  switchButton: { alignItems: 'center', paddingVertical: 6 },
  switchButtonText: { color: '#2563EB', fontSize: 14, fontWeight: '500' },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: '#4B5563',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
