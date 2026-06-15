import { Sparkles, X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { riskLevelLabel, type CorrectiveActionPlan } from './actionPlan';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, riskPalette } from '../../shared/styles/tokens';

interface ActionPlanModalProps {
  visible: boolean;
  subject: string;
  loading: boolean;
  /** Plan structuré (local) : affichage premium par sections. */
  plan: CorrectiveActionPlan | null;
  /** Texte libre (repli IA en ligne). */
  planText: string | null;
  /** Origine du plan : généré par l'IA en ligne, ou proposé localement. */
  source: 'ia' | 'local' | null;
  onClose: () => void;
}

/** Modale affichant le plan d'action correctif (IA en ligne ou structuré local). */
export function ActionPlanModal({
  visible,
  subject,
  loading,
  plan,
  planText,
  source,
  onClose,
}: ActionPlanModalProps) {
  return (
    <AppModal visible={visible} onClose={onClose} testID="action-plan-modal">
      <View>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Sparkles size={18} color="#7C3AED" />
            <Text style={styles.title}>Plan d'action correctif</Text>
          </View>
          <TouchableOpacity onPress={onClose} testID="action-plan-close">
            <X size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subject} numberOfLines={2}>
          {subject}
        </Text>

        {source && !loading && (
          <View
            style={[
              styles.sourceBadge,
              source === 'ia' ? styles.sourceIa : styles.sourceLocal,
            ]}
          >
            <Text
              style={[
                styles.sourceText,
                source === 'ia' ? styles.sourceIaText : styles.sourceLocalText,
              ]}
            >
              {source === 'ia' ? 'Généré par l’IA' : 'Plan structuré'}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Génération du plan…</Text>
          </View>
        ) : plan ? (
          <StructuredPlan plan={plan} />
        ) : (
          <ScrollView style={styles.body}>
            <Text style={styles.planText} testID="action-plan-text">
              {planText}
            </Text>
          </ScrollView>
        )}
      </View>
    </AppModal>
  );
}

function StructuredPlan({ plan }: { plan: CorrectiveActionPlan }) {
  const risk = riskPalette[plan.riskLevel];
  const validations = [
    plan.photoRequired && 'Preuve photo',
    plan.commentRequired && 'Commentaire',
    plan.employeeNameRequired && 'Nom intervenant',
    plan.employeeIdRequired && 'Matricule',
    plan.managerValidationRequired && 'Validation manager',
    plan.escalationRequired &&
      `Escalade${plan.escalationTargetRole ? ` (${plan.escalationTargetRole})` : ''}`,
  ].filter(Boolean) as string[];

  return (
    <ScrollView style={styles.body} testID="action-plan-structured">
      <View style={styles.metaRow}>
        <View style={[styles.riskBadge, { backgroundColor: risk.bg }]}>
          <Text style={[styles.riskText, { color: risk.fg }]}>
            Risque {riskLevelLabel(plan.riskLevel)}
          </Text>
        </View>
        <View style={styles.deadlinePill}>
          <Text style={styles.deadlineText} testID="action-plan-deadline">
            {plan.deadlineLabel}
          </Text>
        </View>
      </View>

      <Section label="Problème constaté" testID="action-plan-problem">
        {`${plan.observedProblem} · ${plan.category}`}
      </Section>
      <Section label="Cause probable" testID="action-plan-cause">
        {plan.probableCause}
      </Section>
      <Section label="Action immédiate" testID="action-plan-immediate">
        {plan.immediateAction}
      </Section>
      <Section label="Action corrective" testID="action-plan-corrective">
        {plan.correctiveAction}
      </Section>
      <Section label="Action préventive" testID="action-plan-preventive">
        {plan.preventiveAction}
      </Section>

      <ListSection
        label="Preuves attendues"
        items={plan.evidenceRequired}
        testID="action-plan-evidence"
      />
      <ListSection
        label="Checklist de clôture"
        items={plan.checklist}
        testID="action-plan-checklist"
      />

      <Section label="Validation requise" testID="action-plan-validation">
        {validations.length
          ? validations.join(' · ')
          : 'Aucune obligation spécifique'}
      </Section>
      <Section label="Responsable recommandé" testID="action-plan-assignee">
        {plan.recommendedAssigneeRole}
      </Section>
      <Section label="Procédure liée">{plan.relatedProcedure}</Section>
    </ScrollView>
  );
}

function Section({
  label,
  testID,
  children,
}: {
  label: string;
  testID?: string;
  children: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionValue} testID={testID}>
        {children}
      </Text>
    </View>
  );
}

function ListSection({
  label,
  items,
  testID,
}: {
  label: string;
  items: string[];
  testID?: string;
}) {
  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: -0.3,
  },
  subject: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 14,
  },
  sourceIa: {
    backgroundColor: '#F3E8FF',
  },
  sourceLocal: {
    backgroundColor: colors.backgroundAlt,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sourceIaText: {
    color: '#7C3AED',
  },
  sourceLocalText: {
    color: colors.textMuted,
  },
  loading: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  body: {
    marginTop: 2,
    maxHeight: 420,
  },
  planText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deadlinePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textFaint,
    marginBottom: 3,
  },
  sectionValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});
