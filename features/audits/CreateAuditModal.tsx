import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../shared/components/AppButton';
import { AppInput } from '../../shared/components/AppInput';
import { AppModal } from '../../shared/components/AppModal';
import { colors } from '../../shared/styles/tokens';

interface CreateAuditModalProps {
  visible: boolean;
  title: string;
  selectedTemplateName: string | null;
  onChangeTitle: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

/** Audit title and template stay named while filling the form. */
export function CreateAuditModal({
  visible,
  title,
  selectedTemplateName,
  onChangeTitle,
  onClose,
  onConfirm,
}: CreateAuditModalProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Nouvel audit"
      testID="audit-create-modal"
      closeLabel="Fermer la création d’audit"
      maxWidth={440}
      scrollable
    >
      <Text style={styles.hint}>
        Le titre est obligatoire pour retrouver cet audit.
      </Text>
      <AppInput
        label="Titre de l’audit"
        placeholder="Titre de l'audit"
        testID="audit-create-title-input"
        value={title}
        onChangeText={onChangeTitle}
        autoFocus
        required
      />
      <Text style={styles.hint}>
        {selectedTemplateName
          ? `Modèle : ${selectedTemplateName}`
          : 'Audit libre : questionnaire standard à la clôture'}
      </Text>
      <View style={styles.actions}>
        <AppButton
          label="Annuler"
          variant="secondary"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={onClose}
        />
        <AppButton
          label="Créer"
          testID="audit-create-submit"
          fullWidth={false}
          style={{ flex: 1 }}
          disabled={!title.trim()}
          onPress={onConfirm}
        />
      </View>
    </AppModal>
  );
}
const styles = StyleSheet.create({
  hint: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 12 },
});
