import { Building2, Ticket, LogOut } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { useAuth } from '../hooks/AuthContext';
import { supabase } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

type Mode = 'create' | 'join';

export default function OnboardingScreen() {
  const { user, signOut, fetchProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('create');
  const [orgName, setOrgName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const { error: rpcError } = await supabase.rpc('create_organization', {
          org_name: orgName.trim(),
          store_name: storeName.trim() || null,
        });
        if (rpcError) {
          setError(mapSupabaseError('Erreur création organisation', rpcError));
          return;
        }
      } else {
        const { error: rpcError } = await supabase.rpc('accept_invitation', {
          invite_token: inviteCode.trim(),
        });
        if (rpcError) {
          setError(mapSupabaseError('Erreur invitation', rpcError));
          return;
        }
      }
      await fetchProfile(user.id);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    mode === 'create' ? orgName.trim().length > 1 : inviteCode.trim().length > 10;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>OP</Text>
        </View>
        <Text style={styles.title}>Bienvenue sur OpsPilot</Text>
        <Text style={styles.subtitle}>
          Pour commencer, créez votre organisation ou rejoignez votre équipe.
        </Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
            onPress={() => setMode('create')}
          >
            <Building2 size={18} color={mode === 'create' ? '#2563EB' : '#6B7280'} />
            <Text
              style={[styles.modeText, mode === 'create' && styles.modeTextActive]}
            >
              Créer mon organisation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
            onPress={() => setMode('join')}
          >
            <Ticket size={18} color={mode === 'join' ? '#2563EB' : '#6B7280'} />
            <Text
              style={[styles.modeText, mode === 'join' && styles.modeTextActive]}
            >
              J'ai une invitation
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Nom de l'organisation *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Supermarchés Durand"
              placeholderTextColor="#9CA3AF"
              value={orgName}
              onChangeText={setOrgName}
            />
            <Text style={styles.label}>Premier magasin (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Magasin Centre-Ville"
              placeholderTextColor="#9CA3AF"
              value={storeName}
              onChangeText={setStoreName}
            />
            <Text style={styles.hint}>
              Vous serez administrateur. Essai gratuit de 14 jours inclus.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Code d'invitation *</Text>
            <TextInput
              style={styles.input}
              placeholder="Collez le code reçu de votre manager"
              placeholderTextColor="#9CA3AF"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              L'invitation doit correspondre à l'adresse e-mail de votre compte
              ({user?.email}).
            </Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'create' ? 'Créer et démarrer' : "Rejoindre l'équipe"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
          <LogOut size={16} color="#6B7280" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeTextActive: {
    color: '#2563EB',
  },
  form: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    marginBottom: 14,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  signOutText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
