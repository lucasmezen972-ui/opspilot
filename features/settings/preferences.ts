import type { NotificationPreferences } from '../../lib/supabase';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  audit_notifications: true,
  action_notifications: true,
  training_notifications: true,
  weekly_summary: true,
};

export function normalizePhone(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function validateProfileSettings(fullName: string): string | null {
  if (fullName.trim().length < 2) {
    return 'Le nom doit contenir au moins 2 caractères.';
  }
  return null;
}

export function validateNewPassword(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  if (password !== confirmation) {
    return 'Les mots de passe ne correspondent pas.';
  }
  return null;
}
