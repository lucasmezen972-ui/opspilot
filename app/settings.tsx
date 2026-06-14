import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AboutCard,
  NotificationsCard,
  OrganizationCard,
  ProfileCard,
  SecurityCard,
} from '../features/settings/SettingsCards';
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

          <ProfileCard
            fullName={fullName}
            phone={phone}
            onChangeFullName={setFullName}
            onChangePhone={setPhone}
            onSave={handleSaveProfile}
            saving={saving}
          />

          <NotificationsCard
            preferences={nextPreferences}
            onToggle={togglePreference}
            onSave={() =>
              runSave(
                () => savePreferences(nextPreferences),
                'Préférences enregistrées.',
              )
            }
            saving={saving}
          />

          <SecurityCard
            password={password}
            confirmation={passwordConfirmation}
            onChangePassword={setPassword}
            onChangeConfirmation={setPasswordConfirmation}
            onSave={handleChangePassword}
            saving={saving}
            isLocalDemo={isLocalDemo}
          />

          {profile?.role === 'admin' ? (
            <OrganizationCard
              organizationName={nextOrganizationName}
              storeName={nextStoreName}
              onChangeOrganizationName={setNextOrganizationName}
              onChangeStoreName={setNextStoreName}
              onSave={handleSaveOrganization}
              saving={saving}
              showStore={Boolean(profile.store_id)}
            />
          ) : null}

          <AboutCard
            onPrivacy={() => router.push('/legal/confidentialite')}
            onTerms={() => router.push('/legal/cgu')}
            onLegal={() => router.push('/legal/mentions-legales')}
            onSupport={() => Linking.openURL('mailto:support@opspilot.com')}
          />
        </ScrollView>
      </View>
    </>
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
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
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
});
