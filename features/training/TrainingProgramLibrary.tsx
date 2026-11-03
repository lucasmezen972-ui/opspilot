import { BookOpen, ChevronLeft, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { TrainingProgramOverview } from './TrainingProgramOverview';
import {
  internalProgramCatalogue,
  isProgramCatalogue,
  programRequirementLabel,
} from './internalPrograms';
import {
  supabase,
  type Training,
  type TrainingProgramMetadata,
} from '../../lib/supabase';
import { colors, radius } from '../../shared/styles/tokens';

export function TrainingProgramLibrary({
  organizationId,
  actorId,
  isLocalDemo,
  courses,
  onInstalled,
}: {
  organizationId: string;
  actorId: string;
  isLocalDemo: boolean;
  courses: Training[];
  onInstalled: (id: string) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [programs, setPrograms] = useState<TrainingProgramMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [focused, setFocused] = useState<TrainingProgramMetadata | null>(null);
  const [busyKey, setBusyKey] = useState('');
  const [filter, setFilter] = useState('Tous');
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    const current = ++generation.current;
    setPrograms([]);
    setError('');
    setFocused(null);
    setBusyKey('');
    busy.current = false;
    if (isLocalDemo) {
      setPrograms(internalProgramCatalogue);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase.rpc('list_internal_training_programs').then(
      ({ data, error: issue }) => {
        if (generation.current !== current) return;
        if (issue !== null || !isProgramCatalogue(data))
          setError('Les parcours n’ont pas pu être chargés.');
        else setPrograms(data);
        setLoading(false);
      },
      () => {
        if (generation.current === current) {
          setLoading(false);
          setError('Les parcours n’ont pas pu être chargés.');
        }
      },
    );
    return () => {
      generation.current++;
    };
  }, [organizationId, actorId, isLocalDemo, retry]);
  const install = async (program: TrainingProgramMetadata) => {
    if (busy.current || isLocalDemo) return;
    busy.current = true;
    setBusyKey(program.key);
    setError('');
    const current = generation.current;
    try {
      const existing = courses.find(
        (c) =>
          c.program_key === program.key &&
          c.program_version === program.version,
      );
      let courseId = existing?.id;
      if (!courseId) {
        const { data, error: issue } = await supabase.rpc(
          'install_internal_training_program',
          { p_key: program.key, p_version: program.version },
        );
        if (current !== generation.current) return;
        if (issue !== null || typeof data !== 'string')
          throw new Error('installation');
        courseId = data;
      }
      await onInstalled(courseId);
      if (current === generation.current) {
        setVisible(false);
        setFocused(null);
      }
    } catch {
      if (current === generation.current)
        setError(
          'Le parcours n’a pas pu être actualisé. Réessayez : un ajout déjà enregistré ne sera pas dupliqué.',
        );
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setBusyKey('');
      }
    }
  };
  const installed = (p: TrainingProgramMetadata) =>
    courses.find(
      (c) => c.program_key === p.key && c.program_version === p.version,
    );
  const filtered = programs.filter(
    (p) =>
      filter === 'Tous' ||
      (filter === 'Sécurité'
        ? p.category === 'Sécurité au travail'
        : filter === 'Hygiène'
          ? p.category === 'Hygiène alimentaire'
          : p.requirement === 'professional'),
  );
  return (
    <>
      <View style={styles.banner} testID="training-program-library">
        <BookOpen size={24} color={colors.primary} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.heading}>Parcours texte + vidéo</Text>
          <Text style={styles.text}>
            Cours, capsule sous-titrée, exercice et quiz dans le même parcours.
            Obligations internes selon le poste et les risques.
          </Text>
          <TouchableOpacity
            testID="training-program-library-open"
            accessibilityRole="button"
            style={styles.openButton}
            onPress={() => setVisible(true)}
          >
            <Text style={styles.buttonText}>
              Explorer les parcours internes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal} testID="training-program-library-modal">
            <View style={styles.header}>
              {focused && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retour aux parcours"
                  style={styles.iconButton}
                  onPress={() => setFocused(null)}
                >
                  <ChevronLeft size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
              <Text style={[styles.heading, { flex: 1 }]}>
                {focused ? focused.title : 'Choisir un parcours interne'}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fermer les parcours internes"
                style={styles.iconButton}
                onPress={() => setVisible(false)}
              >
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.body}>
              {loading && (
                <ActivityIndicator
                  accessibilityLabel="Chargement des parcours"
                  color={colors.primary}
                />
              )}
              {error && (
                <View style={styles.notice}>
                  <Text accessibilityRole="alert" style={styles.text}>
                    {error}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.iconButton}
                    onPress={() => setRetry((x) => x + 1)}
                    disabled={!!busyKey}
                  >
                    <Text style={styles.link}>Actualiser</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isLocalDemo && (
                <Text style={styles.text}>
                  Aperçu du programme. L’ajout et la lecture privée nécessitent
                  un compte connecté.
                </Text>
              )}
              {focused ? (
                <TrainingProgramOverview
                  key={focused.key}
                  program={focused}
                  expanded
                />
              ) : (
                <>
                  <Text style={styles.text}>
                    À adapter par le responsable aux tâches et aux consignes du
                    site. La partie en ligne ne remplace pas l’entraînement
                    pratique.
                  </Text>
                  <View style={styles.filters}>
                    {['Tous', 'Sécurité', 'Hygiène', 'Métiers'].map((label) => (
                      <TouchableOpacity
                        key={label}
                        accessibilityRole="button"
                        accessibilityState={{ selected: filter === label }}
                        onPress={() => setFilter(label)}
                        style={[
                          styles.filter,
                          filter === label && styles.selectedFilter,
                        ]}
                      >
                        <Text
                          style={
                            filter === label ? styles.selectedText : styles.text
                          }
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.grid}>
                    {filtered.map((program) => (
                      <View
                        key={program.key}
                        style={[
                          styles.card,
                          { width: width >= 900 ? '48.5%' : '100%' },
                        ]}
                      >
                        <Text style={styles.badge}>
                          {programRequirementLabel(program.requirement)}
                        </Text>
                        <Text style={styles.cardTitle}>{program.title}</Text>
                        <Text style={styles.text}>{program.summary}</Text>
                        <Text style={styles.meta}>
                          {program.chapter_count} chapitres · 1 vidéo ·{' '}
                          {program.quiz_count} questions finales
                        </Text>
                        <TouchableOpacity
                          testID={`training-program-preview-${program.key}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Voir le programme : ${program.title}`}
                          style={styles.preview}
                          onPress={() => setFocused(program)}
                        >
                          <Text style={styles.link}>
                            Voir le programme
                            {installed(program) ? ' · déjà ajouté' : ''}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  {!loading && !error && programs.length === 0 && (
                    <Text style={styles.text}>
                      Aucun nouveau parcours prêt pour le moment.
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
            {focused && (
              <View style={styles.footer}>
                <Text style={styles.meta}>
                  {installed(focused)
                    ? 'Cette version est déjà dans votre catalogue.'
                    : 'Les résultats et attestations des anciens cours sont conservés.'}
                </Text>
                <TouchableOpacity
                  testID="training-program-install"
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isLocalDemo || !!busyKey,
                    busy: !!busyKey,
                  }}
                  disabled={isLocalDemo || !!busyKey}
                  style={[
                    styles.install,
                    (isLocalDemo || !!busyKey) && { opacity: 0.55 },
                  ]}
                  onPress={() => install(focused)}
                >
                  <Text style={styles.buttonText}>
                    {busyKey
                      ? 'Ajout en cours…'
                      : installed(focused)
                        ? 'Ouvrir ce parcours'
                        : 'Ajouter au catalogue de mon équipe'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.textStrong,
  },
  text: { fontSize: 14, lineHeight: 22, color: colors.text },
  openButton: {
    backgroundColor: colors.primary,
    minHeight: 46,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.surface,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 12,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: 1000,
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 16, gap: 16 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filter: {
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedText: { fontSize: 14, fontWeight: '600', color: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 18,
    gap: 10,
  },
  badge: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryInk,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 25,
    color: colors.textStrong,
    fontWeight: '700',
  },
  meta: { fontSize: 12, lineHeight: 19, color: colors.textMuted },
  preview: { minHeight: 44, justifyContent: 'center', marginTop: 2 },
  link: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  footer: {
    padding: 16,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  install: {
    minHeight: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    borderRadius: radius.md,
    padding: 12,
  },
  notice: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
});
