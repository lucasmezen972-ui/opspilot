import { CheckCircle, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

import type { ActionPlan } from './actionPlan';
import type { CorrectiveAction } from '../../lib/supabase';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius } from '../../shared/styles/tokens';

interface ResolveActionModalProps {
  visible: boolean;
  action: CorrectiveAction | null;
  plan: ActionPlan | null;
  onClose: () => void;
  onConfirm: (payload: ResolutionEvidencePayload) => void;
}

export interface ResolutionEvidencePayload {
  comment: string;
  employeeName: string;
  employeeId: string;
  photoConfirmed: boolean;
  managerValidated: boolean;
}

const initialEvidence: ResolutionEvidencePayload = {
  comment: '',
  employeeName: '',
  employeeId: '',
  photoConfirmed: false,
  managerValidated: false,
};

export function ResolveActionModal({
  visible,
  action,
  plan,
  onClose,
  onConfirm,
}: ResolveActionModalProps) {
  const [evidence, setEvidence] = useState(initialEvidence);

  const missingRequirements = useMemo(() => {
    if (!plan) return [];
    return [
      plan.commentRequired && evidence.comment.trim().length === 0
        ? 'commentaire'
        : null,
      plan.employeeNameRequired && evidence.employeeName.trim().length === 0
        ? 'nom exécutant'
        : null,
      plan.employeeIdRequired && evidence.employeeId.trim().length === 0
        ? 'matricule'
        : null,
      plan.photoRequired && !evidence.photoConfirmed ? 'preuve photo' : null,
      plan.managerValidationRequired && !evidence.managerValidated
        ? 'validation manager'
        : null,
    ].filter((item): item is string => item !== null);
  }, [evidence, plan]);

  const canConfirm = missingRequirements.length === 0;

  const updateEvidence = (patch: Partial<ResolutionEvidencePayload>) => {
    setEvidence((current) => ({ ...current, ...patch }));
  };

  const handleClose = () => {
    setEvidence(initialEvidence);
    onClose();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(evidence);
    setEvidence(initialEvidence);
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      testID="action-resolution-modal"
    >
      <View>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <CheckCircle size={18} color={colors.success} />
            <Text style={styles.title}>Clôture contrôlée</Text>
          </View>
          <TouchableOpacity onPress={handleClose} testID="action-resolution-close">
            <X size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subject} numberOfLines={2}>
          {action?.title ?? 'Action corrective'}
        </Text>

        {plan && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{plan.category}</Text>
            <Text style={styles.summaryText}>{plan.deadlineLabel}</Text>
            <Text style={styles.summaryText}>
              {plan.evidenceRequired.join(' · ')}
            </Text>
          </View>
        )}

        <ScrollView style={styles.body}>
          <Field
            label="Commentaire d'exécution"
            value={evidence.comment}
            placeholder="Décris ce qui a été corrigé et vérifié."
            multiline
            onChangeText={(comment) => updateEvidence({ comment })}
          />
          <Field
            label="Nom exécutant"
            value={evidence.employeeName}
            placeholder="Nom et prénom"
            onChangeText={(employeeName) => updateEvidence({ employeeName })}
          />
          <Field
            label="Matricule"
            value={evidence.employeeId}
            placeholder="Matricule ou identifiant interne"
            onChangeText={(employeeId) => updateEvidence({ employeeId })}
          />

          <CheckRow
            label="Preuve photo jointe"
            active={evidence.photoConfirmed}
            onPress={() =>
              updateEvidence({ photoConfirmed: !evidence.photoConfirmed })
            }
          />
          <CheckRow
            label="Validation manager obtenue"
            active={evidence.managerValidated}
            onPress={() =>
              updateEvidence({ managerValidated: !evidence.managerValidated })
            }
          />

          {missingRequirements.length > 0 && (
            <Text style={styles.warningText} testID="action-resolution-missing">
              Obligatoire avant clôture : {missingRequirements.join(', ')}.
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canConfirm}
            onPress={handleConfirm}
            testID="action-resolution-confirm"
            style={[styles.confirmButton, !canConfirm && styles.confirmDisabled]}
          >
            <Text style={styles.confirmText}>Clôturer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

function Field({
  label,
  value,
  placeholder,
  multiline = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function CheckRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkbox, active && styles.checkboxActive]}>
        {active && <CheckCircle size={14} color="#FFFFFF" />}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
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
    fontWeight: '800',
    color: colors.textStrong,
  },
  subject: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  summaryBox: {
    borderRadius: radius.lg,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  body: {
    maxHeight: 430,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: colors.textStrong,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textStrong,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  textarea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  warningText: {
    color: colors.dangerStrong,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmDisabled: {
    opacity: 0.45,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
