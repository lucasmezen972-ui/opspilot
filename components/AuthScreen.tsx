import Constants from 'expo-constants';
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
  Platform,
} from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing, shadow } from '../shared/styles/tokens';
import { extractErrorMessage } from '../utils/error';
import { loginSchema } from '../utils/validation';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn, signInDemo, signUp, resetPassword, authError, isOffline } =
    useAuth();

  const handleAuth = async () => {
    setLocalError('');
    setSuccessMessage('');

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
      if (result.error)
        throw new Error(
          extractErrorMessage(result.error) ?? 'Erreur de connexion',
        );
      const d = result.data as Record<string, unknown> | null;
      if (!isLogin && d?.user && !d?.session) {
        setSuccessMessage(
          'Compte créé ! Vérifiez votre email pour confirmer votre inscription.',
        );
        setPassword('');
      }
    } catch (e) {
      setLocalError(extractErrorMessage(e) ?? 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLocalError('');
    setSuccessMessage('');
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

  const handleResetPassword = async () => {
    setLocalError('');
    setSuccessMessage('');
    if (!email?.includes('@')) {
      setLocalError(
        'Entrez votre adresse email ci-dessus avant de réinitialiser.',
      );
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.error) {
        setLocalError(
          extractErrorMessage(result.error) ??
            'Impossible d’envoyer le lien. Réessayez.',
        );
      } else {
        setSuccessMessage(
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
        );
        setShowReset(false);
      }
    } catch (e) {
      setLocalError(
        extractErrorMessage(e) ?? 'Impossible d’envoyer le lien. Réessayez.',
      );
    } finally {
      setLoading(false);
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

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Connexion temporairement indisponible. Le mode démo reste
            accessible.
          </Text>
        </View>
      )}

      {successMessage && !isOffline && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {displayError && !isOffline && (
        <View style={styles.errorContainer} accessibilityRole="alert">
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      <View style={styles.demoContainer}>
        <View style={styles.demoHeader}>
          <Zap size={16} color={colors.warning} />
          <Text style={styles.demoTitle}>Démo terrain guidée</Text>
          <Text style={styles.demoSubtitle}>Sans inscription</Text>
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
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Zap size={16} color={colors.surface} />
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
          <>
            <Text style={styles.inputLabel}>Nom complet</Text>
            <TextInput
              accessibilityLabel="Nom complet"
              autoComplete="name"
              style={styles.input}
              placeholder="Nom complet"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </>
        )}

        <Text nativeID="auth-email-label" style={styles.inputLabel}>
          Adresse e-mail
        </Text>
        <TextInput
          aria-labelledby="auth-email-label"
          accessibilityLabel="Adresse e-mail"
          autoComplete="email"
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="email-input"
        />

        <Text nativeID="auth-password-label" style={styles.inputLabel}>
          Mot de passe
        </Text>
        <TextInput
          aria-labelledby="auth-password-label"
          accessibilityLabel="Mot de passe"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          testID="password-input"
        />

        {showReset ? (
          <>
            <Text style={styles.resetHint}>
              Entrez votre email ci-dessus puis appuyez sur le bouton.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              testID="reset-password-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>
                  Envoyer le lien de réinitialisation
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.switchButton}
              onPress={() => {
                setShowReset(false);
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              <Text style={styles.switchButtonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              testID="auth-submit-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading || demoLoading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : isLogin ? (
                <LogIn size={20} color={colors.surface} />
              ) : (
                <UserPlus size={20} color={colors.surface} />
              )}
              <Text style={styles.buttonText}>
                {loading
                  ? 'Connexion...'
                  : isLogin
                    ? 'Se connecter'
                    : "S'inscrire"}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                accessibilityRole="button"
                testID="forgot-password-button"
                style={styles.switchButton}
                onPress={() => {
                  setShowReset(true);
                  setLocalError('');
                  setSuccessMessage('');
                }}
              >
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setShowReset(false);
                setLocalError('');
                setSuccessMessage('');
              }}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Pas encore de compte ? S'inscrire"
                  : 'Déjà un compte ? Se connecter'}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
        <Link href="/legal/cgv" style={styles.legalLink}>
          Conditions commerciales
        </Link>
        <Link href="/legal/sous-traitance" style={styles.legalLink}>
          Données professionnelles
        </Link>
        <Link href="/legal/cgu" style={styles.legalLink}>
          CGU
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop:
      Platform.OS === 'web' ? 32 : (Constants.statusBarHeight ?? 44) + 16,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: { color: colors.surface, fontSize: 28, fontWeight: '700' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: { marginBottom: spacing.md },
  offlineBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  offlineText: {
    color: colors.warningText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successText: {
    color: colors.successText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.dangerStrong,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  demoContainer: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  demoHeader: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoTitle: { fontWeight: '600', fontSize: 14, color: colors.primaryDark },
  demoSubtitle: {
    fontSize: 12,
    color: colors.primaryDark,
    fontStyle: 'italic',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryInk,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  demoButtonLoading: { opacity: 0.8 },
  demoButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontSize: 12 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.surface, fontSize: 15, fontWeight: '600' },
  resetHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  switchButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  forgotPasswordText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  legalLink: {
    color: colors.text,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: colors.textFaint,
    fontSize: 12,
  },
});
