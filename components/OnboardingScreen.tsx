import {
  Building2,
  Ticket,
  LogOut,
  Check,
  CircleCheck as CheckCircle,
  ChevronLeft,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
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

import {
  SECTORS,
  ONBOARDING_MODULES,
  defaultModulesForSector,
  onboardingCompleteness,
  buildStarterConfig,
  type SectorId,
  type ModuleId,
  type OnboardingState,
} from '../features/onboarding/onboardingModel';
import { useAuth } from '../hooks/AuthContext';
import { supabase } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

type Mode = 'create' | 'join';
type CreateStep = 'form' | 'recap';

export default function OnboardingScreen() {
  const { user, signOut, fetchProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('create');
  const [step, setStep] = useState<CreateStep>('form');
  const [orgName, setOrgName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [sector, setSector] = useState<SectorId | null>(null);
  const [modules, setModules] = useState<ModuleId[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state: OnboardingState = useMemo(
    () => ({
      organizationName: orgName,
      storeName,
      sector,
      modules,
      managerName,
    }),
    [orgName, storeName, sector, modules, managerName],
  );
  const completeness = useMemo(() => onboardingCompleteness(state), [state]);
  const starter = useMemo(() => buildStarterConfig(state), [state]);

  const selectSector = (id: SectorId) => {
    setSector(id);
    // Pré-active les modules cohérents avec le secteur (modifiables ensuite).
    setModules(defaultModulesForSector(id));
  };

  const toggleModule = (id: ModuleId, core?: boolean) => {
    if (core) return; // les modules socle restent activés
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const persistConfiguration = async () => {
    // Best-effort : enregistre secteur + modules (RPC dédiée, fusion settings)
    // et le nom du premier manager. N'empêche jamais la fin de l'onboarding.
    if (!user) return;
    try {
      await supabase.rpc('apply_onboarding_configuration', {
        p_sector: sector,
        p_modules: modules,
      });
      if (managerName.trim()) {
        await supabase
          .from('profiles')
          .update({ full_name: managerName.trim() })
          .eq('id', user.id);
      }
    } catch {
      /* no-op : configuration best-effort */
    }
  };

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
        await persistConfiguration();
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

  const canJoin = inviteCode.trim().length > 10;

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

        {step === 'form' && (
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'create' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('create')}
            >
              <Building2
                size={18}
                color={mode === 'create' ? '#2563EB' : '#6B7280'}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === 'create' && styles.modeTextActive,
                ]}
              >
                Créer mon organisation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'join' && styles.modeButtonActive,
              ]}
              onPress={() => setMode('join')}
            >
              <Ticket
                size={18}
                color={mode === 'join' ? '#2563EB' : '#6B7280'}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === 'join' && styles.modeTextActive,
                ]}
              >
                J'ai une invitation
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' ? (
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
        ) : step === 'form' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Nom de l'organisation *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Supermarchés Durand"
              placeholderTextColor="#9CA3AF"
              value={orgName}
              onChangeText={setOrgName}
            />

            <Text style={styles.label}>Secteur / type de magasin *</Text>
            <View style={styles.chipsWrap}>
              {SECTORS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  testID={`onboarding-sector-${s.id}`}
                  style={[
                    styles.sectorChip,
                    sector === s.id && styles.sectorChipActive,
                  ]}
                  onPress={() => selectSector(s.id)}
                >
                  <Text
                    style={[
                      styles.sectorChipText,
                      sector === s.id && styles.sectorChipTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Modules activés</Text>
            <View style={styles.moduleList}>
              {ONBOARDING_MODULES.map((m) => {
                const active = modules.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    testID={`onboarding-module-${m.id}`}
                    style={styles.moduleRow}
                    onPress={() => toggleModule(m.id, m.core)}
                    disabled={m.core}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        active && styles.checkboxOn,
                        m.core && styles.checkboxLocked,
                      ]}
                    >
                      {active && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <View style={styles.moduleBody}>
                      <Text style={styles.moduleLabel}>
                        {m.label}
                        {m.core ? ' · socle' : ''}
                      </Text>
                      <Text style={styles.moduleDesc}>{m.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Premier magasin *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Magasin Centre-Ville"
              placeholderTextColor="#9CA3AF"
              value={storeName}
              onChangeText={setStoreName}
            />

            <Text style={styles.label}>Premier manager (votre nom) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Marie Dupont"
              placeholderTextColor="#9CA3AF"
              value={managerName}
              onChangeText={setManagerName}
            />

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${completeness.score}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{completeness.score}%</Text>
            </View>
            <Text style={styles.hint}>
              Vous serez administrateur. Essai gratuit de 14 jours inclus.
            </Text>
          </View>
        ) : (
          // step === 'recap' : écran « configuration opérationnelle »
          <View style={styles.form} testID="onboarding-recap">
            <View style={styles.recapHeader}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.recapTitle}>
                Configuration opérationnelle
              </Text>
            </View>
            <RecapRow label="Organisation" value={orgName.trim()} />
            <RecapRow label="Secteur" value={starter?.sectorLabel ?? '—'} />
            <RecapRow label="Premier magasin" value={storeName.trim()} />
            <RecapRow label="Premier manager" value={managerName.trim()} />
            <RecapRow label="Modules" value={`${modules.length} activés`} />
            {!!starter && starter.recommendedAuditTemplates.length > 0 && (
              <RecapRow
                label="Audits recommandés"
                value={starter.recommendedAuditTemplates.join(', ')}
              />
            )}
            <Text style={styles.hint}>
              Tout est prêt : votre espace démarre avec une base cohérente avec
              votre secteur.
            </Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {mode === 'create' && step === 'form' ? (
          <TouchableOpacity
            testID="onboarding-continue"
            style={[
              styles.submitButton,
              !completeness.isComplete && styles.submitDisabled,
            ]}
            onPress={() => setStep('recap')}
            disabled={!completeness.isComplete}
          >
            <Text style={styles.submitText}>Continuer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="onboarding-submit"
            style={[
              styles.submitButton,
              ((mode === 'join' && !canJoin) || submitting) &&
                styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={(mode === 'join' && !canJoin) || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'create' ? 'Créer et démarrer' : "Rejoindre l'équipe"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {mode === 'create' && step === 'recap' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('form')}
          >
            <ChevronLeft size={16} color="#6B7280" />
            <Text style={styles.signOutText}>Revenir à la configuration</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOut} onPress={() => signOut()}>
          <LogOut size={16} color="#6B7280" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value || '—'}</Text>
    </View>
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sectorChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  sectorChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EEF2FF',
  },
  sectorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sectorChipTextActive: {
    color: '#1D4ED8',
  },
  moduleList: {
    marginBottom: 14,
    gap: 4,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLocked: {
    opacity: 0.7,
  },
  moduleBody: {
    flex: 1,
  },
  moduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  moduleDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    width: 38,
    textAlign: 'right',
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recapTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recapLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  recapValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
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
