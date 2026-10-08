import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { colors, radius, spacing } from '../shared/styles/tokens';

type AppRole =
  | 'superadmin'
  | 'support'
  | 'admin'
  | 'manager'
  | 'employé'
  | 'employee'
  | 'stagiaire';

/**
 * Garde d'accès par rôle pour les écrans protégés (deep-link / URL directe).
 * Les onglets sont déjà masqués via `href: null`, mais la route reste
 * atteignable : ce composant affiche « Accès non autorisé » au lieu du
 * contenu (sans déconnecter l'utilisateur).
 */
export default function RequireRole({
  roles,
  children,
}: {
  roles: AppRole[];
  children: React.ReactNode;
}) {
  const { profile, ready } = useAuth();

  // Pendant le chargement du profil, ne rien décider (évite un flash).
  if (!ready || !profile) return null;

  if (!roles.includes(profile.role)) {
    return (
      <View style={styles.container} testID="access-denied-screen">
        <View style={styles.iconWrap}>
          <ShieldAlert size={36} color={colors.dangerStrong} />
        </View>
        <Text style={styles.title}>Accès non autorisé</Text>
        <Text style={styles.subtitle}>
          Cette page est réservée aux rôles :{' '}
          {roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}.
          Votre rôle actuel ne permet pas d'y accéder.
        </Text>
        <TouchableOpacity
          testID="access-denied-home-button"
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
