import { Send } from 'lucide-react-native';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { colors } from '../../shared/styles/tokens';

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}

/** Zone de saisie d'un message : champ multiligne + bouton d'envoi. */
export function MessageComposer({
  value,
  onChangeText,
  onSend,
  disabled,
}: MessageComposerProps) {
  return (
    <View style={styles.container}>
      <TextInput
        testID="chat-message-input"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Tapez votre message..."
        multiline
        onSubmitEditing={onSend}
      />
      <TouchableOpacity
        testID="chat-send-button"
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={disabled}
      >
        <Send size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
