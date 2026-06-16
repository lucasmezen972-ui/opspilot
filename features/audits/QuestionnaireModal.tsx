import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';

import { AUDIT_QUESTIONS } from './constants';

interface QuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (answers: boolean[]) => Promise<void> | void;
}

/**
 * Questionnaire de clôture d'audit : chaque point « Non conforme » baisse le
 * score et déclenche la création automatique d'une action corrective.
 */
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} testID="audit-questionnaire">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Audit libre</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.questionnaireHint}>
            Contrôle générique de la zone : évaluez chaque point. Une
            non-conformité crée automatiquement une action corrective.
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
                      setAnswers((prev) =>
                        prev.map((v, j) => (j === i ? true : v)),
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        answers[i] && styles.choiceTextOk,
                      ]}
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
            style={styles.modalConfirmButton}
            onPress={() => onSubmit(answers)}
          >
            <Text style={styles.modalConfirmText}>
              Valider l'audit ({answers.filter(Boolean).length}/
              {AUDIT_QUESTIONS.length} conformes)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  questionnaireHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 17,
  },
  questionList: {
    maxHeight: 360,
    marginBottom: 12,
  },
  questionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  questionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  questionChoices: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  choiceButtonOk: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  choiceButtonKo: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  choiceTextOk: {
    color: '#16A34A',
  },
  choiceTextKo: {
    color: '#DC2626',
  },
});
