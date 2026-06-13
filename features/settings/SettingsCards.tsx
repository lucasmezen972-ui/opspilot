import {
  Bell,
  Building2,
  ExternalLink,
  KeyRound,
  UserRound,
} from 'lucide-react-native';

import {
  SettingsCard,
  SettingsField,
  PrimaryButton,
  PreferenceRow,
  LegalLink,
} from './SettingsControls';
import type { NotificationPreferences } from '../../lib/supabase';

export function ProfileCard({
  fullName,
  phone,
  onChangeFullName,
  onChangePhone,
  onSave,
  saving,
}: {
  fullName: string;
  phone: string;
  onChangeFullName: (text: string) => void;
  onChangePhone: (text: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <SettingsCard
      icon={<UserRound size={20} color="#2563EB" />}
      title="Mon profil"
      description="Les informations visibles par votre équipe."
    >
      <SettingsField
        label="Nom complet"
        value={fullName}
        onChangeText={onChangeFullName}
        placeholder="Votre nom"
        testID="settings-full-name-input"
      />
      <SettingsField
        label="Téléphone"
        value={phone}
        onChangeText={onChangePhone}
        placeholder="+33 6 00 00 00 00"
        keyboardType="phone-pad"
        testID="settings-phone-input"
      />
      <PrimaryButton
        label="Enregistrer le profil"
        onPress={onSave}
        disabled={saving}
        testID="settings-profile-save"
      />
    </SettingsCard>
  );
}

export function NotificationsCard({
  preferences,
  onToggle,
  onSave,
  saving,
}: {
  preferences: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <SettingsCard
      icon={<Bell size={20} color="#7C3AED" />}
      title="Notifications"
      description="Choisissez les alertes opérationnelles à recevoir."
    >
      <PreferenceRow
        label="Audits et contrôles"
        value={preferences.audit_notifications}
        onValueChange={() => onToggle('audit_notifications')}
        testID="settings-notification-audits"
      />
      <PreferenceRow
        label="Actions correctives"
        value={preferences.action_notifications}
        onValueChange={() => onToggle('action_notifications')}
        testID="settings-notification-actions"
      />
      <PreferenceRow
        label="Formations"
        value={preferences.training_notifications}
        onValueChange={() => onToggle('training_notifications')}
        testID="settings-notification-training"
      />
      <PreferenceRow
        label="Synthèse hebdomadaire"
        value={preferences.weekly_summary}
        onValueChange={() => onToggle('weekly_summary')}
        testID="settings-notification-weekly"
      />
      <PrimaryButton
        label="Enregistrer les notifications"
        onPress={onSave}
        disabled={saving}
        testID="settings-notifications-save"
      />
    </SettingsCard>
  );
}

export function SecurityCard({
  password,
  confirmation,
  onChangePassword,
  onChangeConfirmation,
  onSave,
  saving,
  isLocalDemo,
}: {
  password: string;
  confirmation: string;
  onChangePassword: (text: string) => void;
  onChangeConfirmation: (text: string) => void;
  onSave: () => void;
  saving: boolean;
  isLocalDemo: boolean;
}) {
  return (
    <SettingsCard
      icon={<KeyRound size={20} color="#D97706" />}
      title="Sécurité"
      description={
        isLocalDemo
          ? 'Validation locale en mode démo, sans modifier de compte réel.'
          : 'Utilisez au moins 8 caractères.'
      }
    >
      <SettingsField
        label="Nouveau mot de passe"
        value={password}
        onChangeText={onChangePassword}
        placeholder="8 caractères minimum"
        secureTextEntry
        testID="settings-password-input"
      />
      <SettingsField
        label="Confirmer le mot de passe"
        value={confirmation}
        onChangeText={onChangeConfirmation}
        placeholder="Confirmez le mot de passe"
        secureTextEntry
        testID="settings-password-confirmation-input"
      />
      <PrimaryButton
        label="Changer le mot de passe"
        onPress={onSave}
        disabled={saving}
        testID="settings-password-save"
      />
    </SettingsCard>
  );
}

export function OrganizationCard({
  organizationName,
  storeName,
  onChangeOrganizationName,
  onChangeStoreName,
  onSave,
  saving,
  showStore,
}: {
  organizationName: string;
  storeName: string;
  onChangeOrganizationName: (text: string) => void;
  onChangeStoreName: (text: string) => void;
  onSave: () => void;
  saving: boolean;
  showStore: boolean;
}) {
  return (
    <SettingsCard
      icon={<Building2 size={20} color="#059669" />}
      title="Organisation"
      description="Zone réservée aux administrateurs."
    >
      <SettingsField
        label="Nom de l’organisation"
        value={organizationName}
        onChangeText={onChangeOrganizationName}
        testID="settings-organization-input"
      />
      {showStore ? (
        <SettingsField
          label="Nom du magasin"
          value={storeName}
          onChangeText={onChangeStoreName}
          testID="settings-store-input"
        />
      ) : null}
      <PrimaryButton
        label="Enregistrer l’organisation"
        onPress={onSave}
        disabled={saving}
        testID="settings-organization-save"
      />
    </SettingsCard>
  );
}

export function AboutCard({
  onPrivacy,
  onTerms,
  onLegal,
  onSupport,
}: {
  onPrivacy: () => void;
  onTerms: () => void;
  onLegal: () => void;
  onSupport: () => void;
}) {
  return (
    <SettingsCard
      icon={<ExternalLink size={20} color="#475569" />}
      title="À propos et documents légaux"
      description="OpsPilot v1.0.0 · Support : support@opspilot.com"
    >
      <LegalLink
        label="Politique de confidentialité"
        onPress={onPrivacy}
        testID="settings-privacy-link"
      />
      <LegalLink
        label="Conditions d’utilisation"
        onPress={onTerms}
        testID="settings-terms-link"
      />
      <LegalLink
        label="Mentions légales"
        onPress={onLegal}
        testID="settings-legal-link"
      />
      <LegalLink
        label="Contacter le support"
        onPress={onSupport}
        testID="settings-support-link"
      />
    </SettingsCard>
  );
}
