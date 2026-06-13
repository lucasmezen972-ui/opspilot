import { Camera, CircleCheck, CircleX, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  calculateAuditScore,
  getResponseCompliance,
  validateAuditResponses,
  type AuditResponseDraft,
} from './scoring';
import CameraModal from '../../components/CameraModal';
import type { AuditTemplate, AuditTemplateItem } from '../../lib/supabase';

type ProfessionalAuditModalProps = {
  visible: boolean;
  template: AuditTemplate | null;
  items: AuditTemplateItem[];
  onClose: () => void;
  onSubmit: (
    responses: AuditResponseDraft[],
    score: number,
    issuesCount: number,
  ) => Promise<void> | void;
};

function initialResponse(item: AuditTemplateItem): AuditResponseDraft {
  const value =
    item.item_type === 'yes_no'
      ? true
      : item.item_type === 'score_1_5'
        ? 5
        : '';
  return {
    item_id: item.id,
    value,
    photo_url: null,
    comment: '',
    is_compliant: getResponseCompliance(item, value),
  };
}

export function ProfessionalAuditModal({
  visible,
  template,
  items,
  onClose,
  onSubmit,
}: ProfessionalAuditModalProps) {
  const [responses, setResponses] = useState<
    Record<string, AuditResponseDraft>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoItemId, setPhotoItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setResponses(
      Object.fromEntries(items.map((item) => [item.id, initialResponse(item)])),
    );
    setErrors({});
    setPhotoItemId(null);
  }, [items, visible]);

  const sections = useMemo(() => {
    const grouped = new Map<string, AuditTemplateItem[]>();
    for (const item of items) {
      grouped.set(item.section, [...(grouped.get(item.section) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [items]);

  const updateResponse = (
    item: AuditTemplateItem,
    updates: Partial<AuditResponseDraft>,
  ) => {
    setResponses((current) => {
      const previous = current[item.id] ?? initialResponse(item);
      const next = { ...previous, ...updates };
      if ('value' in updates) {
        next.is_compliant = getResponseCompliance(item, next.value);
      }
      return { ...current, [item.id]: next };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
  };

  const handlePhotoTaken = (uri: string) => {
    if (!photoItemId) return;
    const item = items.find((candidate) => candidate.id === photoItemId);
    if (!item) return;
    updateResponse(item, {
      photo_url: uri,
      value: item.item_type === 'photo' ? uri : responses[item.id]?.value,
    });
  };

  const handleSubmit = async () => {
    const responseList = items.map(
      (item) => responses[item.id] ?? initialResponse(item),
    );
    const validationErrors = validateAuditResponses(items, responseList);
    if (validationErrors.length > 0) {
      setErrors(
        Object.fromEntries(
          validationErrors.map((error) => [error.itemId, error.message]),
        ),
      );
      Alert.alert(
        'Audit incomplet',
        'Complétez les critères obligatoires et joignez une photo à chaque non-conformité.',
      );
      return;
    }

    const score = calculateAuditScore(items, responseList);
    const issuesCount = responseList.filter(
      (response) => !response.is_compliant,
    ).length;
    await onSubmit(responseList, score, issuesCount);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide">
        <View
          style={styles.container}
          testID="audit-professional-questionnaire"
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{template?.name ?? 'Audit'}</Text>
              <Text style={styles.subtitle}>
                {items.length} critères répartis par section
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fermer">
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {sections.map(([section, sectionItems]) => (
              <View key={section} style={styles.section}>
                <Text style={styles.sectionTitle}>{section}</Text>
                {sectionItems.map((item) => {
                  const response = responses[item.id] ?? initialResponse(item);
                  return (
                    <View
                      key={item.id}
                      style={styles.itemCard}
                      testID={`audit-item-${item.id}`}
                    >
                      <View style={styles.questionHeader}>
                        <Text style={styles.question}>
                          {item.question}
                          {item.is_required ? ' *' : ''}
                        </Text>
                        <Text style={styles.points}>{item.points} pts</Text>
                      </View>

                      {item.item_type === 'yes_no' && (
                        <View style={styles.choiceRow}>
                          <TouchableOpacity
                            testID={`audit-item-${item.id}-ok`}
                            style={[
                              styles.choice,
                              response.value === true && styles.choiceOk,
                            ]}
                            onPress={() =>
                              updateResponse(item, { value: true })
                            }
                          >
                            <CircleCheck size={18} color="#15803D" />
                            <Text style={styles.choiceOkText}>Conforme</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            testID={`audit-item-${item.id}-ko`}
                            style={[
                              styles.choice,
                              response.value === false && styles.choiceKo,
                            ]}
                            onPress={() =>
                              updateResponse(item, { value: false })
                            }
                          >
                            <CircleX size={18} color="#B91C1C" />
                            <Text style={styles.choiceKoText}>
                              Non conforme
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.item_type === 'score_1_5' && (
                        <View style={styles.ratingRow}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <TouchableOpacity
                              key={rating}
                              testID={`audit-item-${item.id}-score-${rating}`}
                              style={[
                                styles.rating,
                                response.value === rating &&
                                  styles.ratingSelected,
                              ]}
                              onPress={() =>
                                updateResponse(item, { value: rating })
                              }
                            >
                              <Text
                                style={[
                                  styles.ratingText,
                                  response.value === rating &&
                                    styles.ratingTextSelected,
                                ]}
                              >
                                {rating}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {item.item_type === 'text' && (
                        <TextInput
                          testID={`audit-item-${item.id}-text`}
                          style={styles.textInput}
                          multiline
                          placeholder="Saisir votre réponse..."
                          value={
                            typeof response.value === 'string'
                              ? response.value
                              : ''
                          }
                          onChangeText={(value) =>
                            updateResponse(item, { value })
                          }
                        />
                      )}

                      {(item.item_type === 'photo' ||
                        !response.is_compliant) && (
                        <TouchableOpacity
                          testID={`audit-item-${item.id}-photo`}
                          style={[
                            styles.photoButton,
                            response.photo_url && styles.photoButtonDone,
                          ]}
                          onPress={() => setPhotoItemId(item.id)}
                        >
                          <Camera
                            size={18}
                            color={response.photo_url ? '#15803D' : '#2563EB'}
                          />
                          <Text
                            style={[
                              styles.photoButtonText,
                              response.photo_url && styles.photoButtonTextDone,
                            ]}
                          >
                            {response.photo_url
                              ? 'Preuve jointe'
                              : !response.is_compliant
                                ? 'Joindre la preuve obligatoire'
                                : 'Prendre une photo'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TextInput
                        testID={`audit-item-${item.id}-comment`}
                        style={styles.commentInput}
                        placeholder="Commentaire (facultatif)"
                        value={response.comment ?? ''}
                        onChangeText={(comment) =>
                          updateResponse(item, { comment })
                        }
                      />
                      {errors[item.id] && (
                        <Text style={styles.errorText}>{errors[item.id]}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              testID="audit-professional-submit"
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>
                Terminer et calculer le score
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CameraModal
        visible={photoItemId !== null}
        onClose={() => setPhotoItemId(null)}
        onPhotoTaken={handlePhotoTaken}
        auditType={template?.category ?? 'general'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  itemCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  questionHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  question: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  points: {
    color: '#6B7280',
    fontSize: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  choice: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOk: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  choiceKo: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  choiceOkText: {
    color: '#15803D',
    fontWeight: '600',
  },
  choiceKoText: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rating: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  ratingText: {
    color: '#374151',
    fontWeight: '700',
  },
  ratingTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    minHeight: 80,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    color: '#111827',
    textAlignVertical: 'top',
  },
  photoButton: {
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonDone: {
    backgroundColor: '#DCFCE7',
  },
  photoButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  photoButtonTextDone: {
    color: '#15803D',
  },
  commentInput: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    color: '#111827',
  },
  errorText: {
    marginTop: 6,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
