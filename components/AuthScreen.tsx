import Constants from 'expo-constants';
import { Link } from 'expo-router';
import {
  ArrowRight,
  ClipboardCheck,
  GraduationCap,
  ListChecks,
  LogIn,
  Play,
  UserPlus,
} from 'lucide-react-native';
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
  useWindowDimensions,
} from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { AppBrand } from '../shared/components/AppBrand';
import { colors, radius, spacing } from '../shared/styles/tokens';
import { extractErrorMessage } from '../utils/error';
import { loginSchema } from '../utils/validation';

export default function AuthScreen() {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 1024;
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
      contentContainerStyle={[styles.container, isWide && styles.containerWide]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.layout, isWide && styles.layoutWide]}>
        {isWide ? (
          <View style={styles.contextPanel}>
            <AppBrand size={46} wordmarkSize={29} inverted subtitle={false} />
            <View style={styles.contextBody}>
              <Text style={styles.contextEyebrow}>LE TERRAIN, EN CLAIR</Text>
              <Text style={styles.contextTitle}>
                Gardez le cap sur vos opérations.
              </Text>
              <Text style={styles.contextDescription}>
                Audits, actions et formations : un même espace pour faire
                avancer le quotidien de votre équipe.
              </Text>
              <View style={styles.contextFeatures}>
                {[
                  {
                    icon: ClipboardCheck,
                    title: 'Observer avec méthode',
                    text: 'Rassemblez vos contrôles et leurs preuves.',
                  },
                  {
                    icon: ListChecks,
                    title: 'Passer à l’action',
                    text: 'Attribuez les suites et suivez leur résolution.',
                  },
                  {
                    icon: GraduationCap,
                    title: 'Faire progresser l’équipe',
                    text: 'Retrouvez les parcours et les acquis de chacun.',
                  },
                ].map((feature) => (
                  <View key={feature.title} style={styles.contextFeature}>
                    <View style={styles.contextIcon}>
                      <feature.icon size={20} color="#AFC6FF" />
                    </View>
                    <View style={styles.contextFeatureBody}>
                      <Text style={styles.contextFeatureTitle}>
                        {feature.title}
                      </Text>
                      <Text style={styles.contextFeatureText}>
                        {feature.text}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.contextFooter}>
              COMMERCE · GRANDE DISTRIBUTION · RESTAURATION
            </Text>
          </View>
        ) : (
          <View style={styles.header}>
            <AppBrand size={42} wordmarkSize={27} subtitle={false} />
          </View>
        )}
        <View style={[styles.accessColumn, isWide && styles.accessColumnWide]}>
          <View style={[styles.form, isWide && styles.formWide]}>
            <View style={styles.formHeading}>
              {isWide && (
                <Text style={styles.eyebrow}>VOTRE ESPACE DE TRAVAIL</Text>
              )}
              <Text style={styles.formTitle}>
                {showReset
                  ? 'Retrouver votre accès'
                  : isLogin
                    ? 'Connexion'
                    : 'Créer un compte'}
              </Text>
              <Text style={styles.formSubtitle}>
                {showReset
                  ? 'Recevez un lien pour choisir un nouveau mot de passe.'
                  : isLogin
                    ? 'Reprenez le fil de vos opérations.'
                    : 'Créez votre accès personnel à OpsPilot.'}
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
                  <Text style={styles.switchButtonText}>
                    Retour à la connexion
                  </Text>
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
            <View style={styles.demoContainer}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>Démo terrain guidée</Text>
                <Text style={styles.demoSubtitle}>Sans inscription</Text>
              </View>
              <TouchableOpacity
                testID="demo-login-button"
                style={[
                  styles.demoButton,
                  demoLoading && styles.demoButtonLoading,
                ]}
                onPress={handleDemoLogin}
                disabled={demoLoading || loading}
                accessibilityRole="button"
                accessibilityLabel="Connexion démo"
                accessibilityState={{
                  disabled: demoLoading || loading,
                  busy: demoLoading,
                }}
              >
                {demoLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Play size={16} color={colors.primary} />
                )}
                <Text style={styles.demoButtonText}>
                  {demoLoading ? 'Connexion...' : 'Lancer la démo OpsPilot'}
                </Text>
                {!demoLoading && (
                  <ArrowRight size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
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
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'web' ? 28 : (Constants.statusBarHeight ?? 44) + 16,
    paddingBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerWide: { padding: 36 },
  layout: { width: '100%', maxWidth: 460 },
  layoutWide: {
    maxWidth: 1180,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { alignItems: 'center', marginBottom: 24, gap: 10 },
  contextPanel: {
    width: '48%',
    backgroundColor: '#11223D',
    padding: 44,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  contextBody: { marginTop: 56, marginBottom: 50 },
  contextEyebrow: {
    color: '#9DB8F4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.7,
    marginBottom: 18,
  },
  contextTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    lineHeight: 49,
    fontWeight: '700',
    letterSpacing: -1.5,
    maxWidth: 420,
  },
  contextDescription: {
    color: '#C4CFDF',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 20,
    maxWidth: 380,
  },
  contextFeatures: { gap: 24, marginTop: 40 },
  contextFeature: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  contextIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#1D3354',
  },
  contextFeatureBody: { flex: 1, minWidth: 0 },
  contextFeatureTitle: {
    color: '#F2F6FD',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  contextFeatureText: {
    color: '#ACBED5',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 3,
  },
  contextFooter: {
    color: '#A3B5CD',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: 1,
  },
  accessColumn: { width: '100%' },
  accessColumnWide: {
    width: '52%',
    justifyContent: 'center',
    padding: 40,
    paddingHorizontal: 48,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formWide: { borderWidth: 0, padding: 0, borderRadius: 0 },
  formHeading: { marginBottom: 22 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  formTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.textStrong,
  },
  formSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  offlineBanner: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 18,
  },
  offlineText: { color: colors.warningText, fontSize: 13, lineHeight: 20 },
  successContainer: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 18,
  },
  successText: { color: colors.successText, fontSize: 13, lineHeight: 20 },
  errorContainer: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 18,
  },
  errorText: { color: colors.dangerStrong, fontSize: 13, lineHeight: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 7,
  },
  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: '#CED6E1',
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 17,
    backgroundColor: colors.surface,
    color: colors.textStrong,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 49,
    backgroundColor: colors.primary,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 20,
  },
  switchButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  demoContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 22,
    marginTop: 17,
  },
  demoHeader: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  demoTitle: { fontWeight: '600', fontSize: 13, color: colors.textStrong },
  demoSubtitle: { fontSize: 11, color: colors.textMuted },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#CCD8F1',
    backgroundColor: '#F5F8FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 9,
  },
  demoButtonLoading: { opacity: 0.8 },
  demoButtonText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 6,
  },
  legalLink: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textDecorationLine: 'underline',
  },
  legalSeparator: { color: colors.textFaint, fontSize: 10 },
});
