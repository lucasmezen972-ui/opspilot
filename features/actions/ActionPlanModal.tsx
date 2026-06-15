import { Sparkles, X } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import type { ActionPlan } from './actionPlan';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius } from '../../shared/styles/tokens';

interface ActionPlanModalProps {
  visible: boolean;
  subject: string;
  loading: boolean;
  planText: string | null;
  plan?: ActionPlan | null;
  /** Origine du plan : généré par l'IA en ligne, ou proposé localement. */
  source: 'ia' | 'local' | null;
  onClose: () => void;
}

/** Modale affichant le plan d'action correctif (IA en ligne ou proposé). */
export function ActionPlanModal({
  visible,
  subject,
  loading,
  planText,
  plan,
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
              {source === 'ia'
                ? 'Garde-fou métier + complément IA'
                : 'Plan proposé'}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Génération du plan…</Text>
          </View>
        ) : (
          <ScrollView style={styles.body}>
            {plan && <StructuredPlan plan={plan} />}
            {planText && source === 'ia' && (
              <View style={styles.section} testID="action-plan-ai-supplement">
                <Text style={styles.sectionTitle}>Complément IA</Text>
                <Text style={styles.planText}>{planText}</Text>
              </View>
            )}
            {planText && !plan && (
              <Text style={styles.planText} testID="action-plan-text">
                {planText}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </AppModal>
  );
}

function StructuredPlan({ plan }: { plan: ActionPlan }) {
  return (
    <View testID="action-plan-structured">
      <View style={styles.summaryGrid}>
        <SummaryItem label="Catégorie" value={plan.category} />
        <SummaryItem label="Risque" value={riskLabel(plan.riskLevel)} />
        <SummaryItem label="Deadline" value={plan.deadlineLabel} />
      </View>

      <PlanSection title="Problème constaté" body={plan.observedProblem} />
      <PlanSection title="Cause probable" body={plan.probableCause} />
      <PlanSection title="Action immédiate" body={plan.immediateAction} />
      <PlanSection title="Action corrective" body={plan.correctiveAction} />
      <PlanSection title="Action préventive" body={plan.preventiveAction} />

      <ListSection title="Preuves attendues" items={plan.evidenceRequired} />
      <ListSection title="Checklist" items={plan.checklist} numbered />

      <View style={styles.requirements}>
        <Requirement label="Photo" active={plan.photoRequired} />
        <Requirement label="Commentaire" active={plan.commentRequired} />
        <Requirement label="Nom" active={plan.employeeNameRequired} />
        <Requirement label="Matricule" active={plan.employeeIdRequired} />
        <Requirement
          label="Validation manager"
          active={plan.managerValidationRequired}
        />
        <Requirement label="Escalade" active={plan.escalationRequired} />
      </View>

      <PlanSection
        title="Responsable recommandé"
        body={plan.recommendedAssigneeRole}
      />
      {plan.relatedProcedure && (
        <PlanSection title="Procédure associée" body={plan.relatedProcedure} />
      )}
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function PlanSection({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

function ListSection({
  title,
  items,
  numbered = false,
}: {
  title: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <Text key={`${title}-${item}`} style={styles.sectionBody}>
          {numbered ? `${index + 1}. ` : '• '}
          {item}
        </Text>
      ))}
    </View>
  );
}

function Requirement({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      style={[styles.requirement, active ? styles.required : styles.optional]}
    >
      <Text
        style={[
          styles.requirementText,
          active ? styles.requiredText : styles.optionalText,
        ]}
      >
        {active ? 'Obligatoire' : 'Optionnel'} · {label}
      </Text>
    </View>
  );
}

function riskLabel(risk: ActionPlan['riskLevel']): string {
  if (risk === 'critical') return 'Critique';
  if (risk === 'high') return 'Élevé';
  if (risk === 'medium') return 'Moyen';
  return 'À suivre';
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
  sourceIa: { backgroundColor: '#F3E8FF' },
  sourceLocal: { backgroundColor: colors.backgroundAlt },
  sourceText: { fontSize: 11, fontWeight: '700' },
  sourceIaText: { color: '#7C3AED' },
  sourceLocalText: { color: colors.textMuted },
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
    maxHeight: 520,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 10,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.textStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionBody: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  requirement: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  required: { backgroundColor: colors.dangerSoft },
  optional: { backgroundColor: colors.backgroundAlt },
  requirementText: { fontSize: 11, fontWeight: '700' },
  requiredText: { color: colors.dangerStrong },
  optionalText: { color: colors.textMuted },
  planText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
});
