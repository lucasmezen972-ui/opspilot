import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../hooks/useAuth';

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
          <ShieldAlert size={36} color="#DC2626" />
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
