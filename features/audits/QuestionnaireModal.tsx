import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { AUDIT_QUESTIONS } from './constants';
import { AppModal } from '../../shared/components/AppModal';
import { colors, radius, spacing } from '../../shared/styles/tokens';

interface QuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (answers: boolean[]) => Promise<void> | void;
}

export function QuestionnaireModal({
  visible,
  onClose,
  onSubmit,
}: QuestionnaireModalProps) {
  const [answers, setAnswers] = useState<boolean[]>(
    AUDIT_QUESTIONS.map(() => true),
  );

  useEffect(() => {
    if (visible) {
      setAnswers(AUDIT_QUESTIONS.map(() => true));
    }
  }, [visible]);

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Audit libre"
      testID="audit-questionnaire"
    >
      <Text style={styles.questionnaireHint}>
        Contrôle générique de la zone : évaluez chaque point. Une non-conformité
        crée automatiquement une action corrective.
      </Text>
      <ScrollView style={styles.questionList}>
        {AUDIT_QUESTIONS.map((q, i) => (
          <View key={q} style={styles.questionRow}>
            <Text style={styles.questionText}>{q}</Text>
            <View style={styles.questionChoices}>
              <TouchableOpacity
                testID={`question-${i}-ok`}
                style={[
                  styles.choiceButton,
                  answers[i] && styles.choiceButtonOk,
                ]}
                onPress={() =>
                  setAnswers((prev) => prev.map((v, j) => (j === i ? true : v)))
                }
              >
                <Text
                  style={[styles.choiceText, answers[i] && styles.choiceTextOk]}
                >
                  Conforme
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`question-${i}-ko`}
                style={[
                  styles.choiceButton,
                  !answers[i] && styles.choiceButtonKo,
                ]}
                onPress={() =>
                  setAnswers((prev) =>
                    prev.map((v, j) => (j === i ? false : v)),
                  )
                }
              >
                <Text
                  style={[
                    styles.choiceText,
                    !answers[i] && styles.choiceTextKo,
                  ]}
                >
                  Non conforme
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        testID="questionnaire-submit"
        style={styles.confirmButton}
        onPress={() => onSubmit(answers)}
      >
        <Text style={styles.confirmText}>
          Valider l'audit ({answers.filter(Boolean).length}/
          {AUDIT_QUESTIONS.length} conformes)
        </Text>
      </TouchableOpacity>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  questionnaireHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  questionList: {
    maxHeight: 360,
    marginBottom: spacing.md,
  },
  questionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundAlt,
    gap: spacing.sm,
  },
  questionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textStrong,
  },
  questionChoices: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  choiceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceButtonOk: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successText,
  },
  choiceButtonKo: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerStrong,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  choiceTextOk: {
    color: colors.successText,
  },
  choiceTextKo: {
    color: colors.dangerStrong,
  },
  confirmButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
