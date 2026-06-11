import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Building2,
  ExternalLink,
  KeyRound,
  Save,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  normalizePhone,
  validateNewPassword,
  validateProfileSettings,
} from '../features/settings/preferences';
import { useAuth } from '../hooks/useAuth';
import { useUserSettings } from '../hooks/useUserSettings';
import type { NotificationPreferences } from '../lib/supabase';

type Feedback = { message: string; error: boolean } | null;

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const {
    loading,
    isLocalDemo,
    preferences,
    organizationName,
    storeName,
    saveProfile,
    savePreferences,
    changePassword,
    saveOrganization,
  } = useUserSettings();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [nextPreferences, setNextPreferences] =
    useState<NotificationPreferences>(preferences);
  const [nextOrganizationName, setNextOrganizationName] =
    useState(organizationName);
  const [nextStoreName, setNextStoreName] = useState(storeName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setNextPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    setNextOrganizationName(organizationName);
    setNextStoreName(storeName);
  }, [organizationName, storeName]);

  const runSave = async (
    action: () => Promise<{ error: string | null }>,
    successMessage: string,
  ) => {
    setSaving(true);
    setFeedback(null);
    const result = await action();
    setSaving(false);
    setFeedback({
      message: result.error ?? successMessage,
      error: Boolean(result.error),
    });
    return !result.error;
  };

  const handleSaveProfile = async () => {
    const validationError = validateProfileSettings(fullName);
    if (validationError) {
      setFeedback({ message: validationError, error: true });
      return;
    }
    await runSave(
      () => saveProfile(fullName, normalizePhone(phone)),
      'Profil mis à jour.',
    );
  };

  const handleChangePassword = async () => {
    const validationError = validateNewPassword(password, passwordConfirmation);
    if (validationError) {
      setFeedback({ message: validationError, error: true });
      return;
    }
    const saved = await runSave(
      () => changePassword(password),
      isLocalDemo
        ? 'Mot de passe validé pour la démo locale.'
        : 'Mot de passe mis à jour.',
    );
    if (saved) {
      setPassword('');
      setPasswordConfirmation('');
    }
  };

  const handleSaveOrganization = async () => {
    if (nextOrganizationName.trim().length < 2) {
      setFeedback({
        message:
          'Le nom de l’organisation doit contenir au moins 2 caractères.',
        error: true,
      });
      return;
    }
    await runSave(
      () => saveOrganization(nextOrganizationName, nextStoreName),
      'Organisation mise à jour.',
    );
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setNextPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement des réglages...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/profile')}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            testID="settings-back-button"
          >
            <ArrowLeft size={20} color="#1D4ED8" />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>OpsPilot</Text>
            <Text style={styles.title} testID="page-settings-title">
              Réglages
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {feedback ? (
            <View
              style={[
                styles.feedback,
                feedback.error ? styles.feedbackError : styles.feedbackSuccess,
              ]}
              testID="settings-feedback"
            >
              <Text
                style={
                  feedback.error
                    ? styles.feedbackErrorText
                    : styles.feedbackSuccessText
                }
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <SettingsCard
            icon={<UserRound size={20} color="#2563EB" />}
            title="Mon profil"
            description="Les informations visibles par votre équipe."
          >
            <FieldLabel>Nom complet</FieldLabel>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="Votre nom"
              testID="settings-full-name-input"
            />
            <FieldLabel>Téléphone</FieldLabel>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="+33 6 00 00 00 00"
              keyboardType="phone-pad"
              testID="settings-phone-input"
            />
            <PrimaryButton
              label="Enregistrer le profil"
              onPress={handleSaveProfile}
              disabled={saving}
              testID="settings-profile-save"
            />
          </SettingsCard>

          <SettingsCard
            icon={<Bell size={20} color="#7C3AED" />}
            title="Notifications"
            description="Choisissez les alertes opérationnelles à recevoir."
          >
            <PreferenceRow
              label="Audits et contrôles"
              value={nextPreferences.audit_notifications}
              onValueChange={() => togglePreference('audit_notifications')}
              testID="settings-notification-audits"
            />
            <PreferenceRow
              label="Actions correctives"
              value={nextPreferences.action_notifications}
              onValueChange={() => togglePreference('action_notifications')}
              testID="settings-notification-actions"
            />
            <PreferenceRow
              label="Formations"
              value={nextPreferences.training_notifications}
              onValueChange={() => togglePreference('training_notifications')}
              testID="settings-notification-training"
            />
            <PreferenceRow
              label="Synthèse hebdomadaire"
              value={nextPreferences.weekly_summary}
              onValueChange={() => togglePreference('weekly_summary')}
              testID="settings-notification-weekly"
            />
            <PrimaryButton
              label="Enregistrer les notifications"
              onPress={() =>
                runSave(
                  () => savePreferences(nextPreferences),
                  'Préférences enregistrées.',
                )
              }
              disabled={saving}
              testID="settings-notifications-save"
            />
          </SettingsCard>

          <SettingsCard
            icon={<KeyRound size={20} color="#D97706" />}
            title="Sécurité"
            description={
              isLocalDemo
                ? 'Validation locale en mode démo, sans modifier de compte réel.'
                : 'Utilisez au moins 8 caractères.'
            }
          >
            <FieldLabel>Nouveau mot de passe</FieldLabel>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="8 caractères minimum"
              secureTextEntry
              testID="settings-password-input"
            />
            <FieldLabel>Confirmer le mot de passe</FieldLabel>
            <TextInput
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              style={styles.input}
              placeholder="Confirmez le mot de passe"
              secureTextEntry
              testID="settings-password-confirmation-input"
            />
            <PrimaryButton
              label="Changer le mot de passe"
              onPress={handleChangePassword}
              disabled={saving}
              testID="settings-password-save"
            />
          </SettingsCard>

          {profile?.role === 'admin' ? (
            <SettingsCard
              icon={<Building2 size={20} color="#059669" />}
              title="Organisation"
              description="Zone réservée aux administrateurs."
            >
              <FieldLabel>Nom de l’organisation</FieldLabel>
              <TextInput
                value={nextOrganizationName}
                onChangeText={setNextOrganizationName}
                style={styles.input}
                testID="settings-organization-input"
              />
              {profile.store_id ? (
                <>
                  <FieldLabel>Nom du magasin</FieldLabel>
                  <TextInput
                    value={nextStoreName}
                    onChangeText={setNextStoreName}
                    style={styles.input}
                    testID="settings-store-input"
                  />
                </>
              ) : null}
              <PrimaryButton
                label="Enregistrer l’organisation"
                onPress={handleSaveOrganization}
                disabled={saving}
                testID="settings-organization-save"
              />
            </SettingsCard>
          ) : null}

          <SettingsCard
            icon={<ExternalLink size={20} color="#475569" />}
            title="À propos et documents légaux"
            description="OpsPilot v1.0.0 · Support : support@opspilot.com"
          >
            <LegalLink
              label="Politique de confidentialité"
              onPress={() => router.push('/legal/confidentialite')}
              testID="settings-privacy-link"
            />
            <LegalLink
              label="Conditions d’utilisation"
              onPress={() => router.push('/legal/cgu')}
              testID="settings-terms-link"
            />
            <LegalLink
              label="Mentions légales"
              onPress={() => router.push('/legal/mentions-legales')}
              testID="settings-legal-link"
            />
            <LegalLink
              label="Contacter le support"
              onPress={() => Linking.openURL('mailto:support@opspilot.com')}
              testID="settings-support-link"
            />
          </SettingsCard>
        </ScrollView>
      </View>
    </>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>{icon}</View>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Save size={17} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PreferenceRow({
  label,
  value,
  onValueChange,
  testID,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  testID: string;
}) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
        thumbColor={value ? '#2563EB' : '#F8FAFC'}
        testID={testID}
      />
    </View>
  );
}

function LegalLink({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={styles.legalLink}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.legalLinkText}>{label}</Text>
      <ExternalLink size={16} color="#64748B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: { color: '#64748B', marginTop: 12 },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  eyebrow: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
  scroll: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 760,
    padding: 20,
    paddingBottom: 56,
    width: '100%',
  },
  feedback: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    padding: 13,
  },
  feedbackSuccess: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  feedbackError: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  feedbackSuccessText: { color: '#047857', fontWeight: '600' },
  feedbackErrorText: { color: '#B91C1C', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    padding: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 18,
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  cardHeading: { flex: 1 },
  cardTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDescription: { color: '#64748B', fontSize: 13, lineHeight: 18 },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#111827',
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 9,
    flexDirection: 'row',
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  preferenceRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  preferenceLabel: { color: '#334155', flex: 1, fontSize: 15 },
  legalLink: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  legalLinkText: { color: '#1D4ED8', flex: 1, fontSize: 15 },
});
