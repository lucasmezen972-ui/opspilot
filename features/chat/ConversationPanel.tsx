import {
  Sparkles,
  Phone,
  Video,
  MoveVertical as MoreVertical,
} from 'lucide-react-native';
import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import type { DisplayMessage } from './chatModel';
import { colors, radius, shadow } from '../../shared/styles/tokens';

interface ConversationPanelProps {
  name: string;
  isAI: boolean;
  assistantLoading: boolean;
  loading: boolean;
  messages: DisplayMessage[];
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
}

/** Panneau de la conversation active : en-tête, fil de messages et saisie. */
export function ConversationPanel({
  name,
  isAI,
  assistantLoading,
  loading,
  messages,
  draft,
  onChangeDraft,
  onSend,
}: ConversationPanelProps) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.status}>
            {isAI ? (
              <>
                <Sparkles size={12} color="#8B5CF6" />
                <Text style={styles.statusText}>
                  {assistantLoading
                    ? 'Assistant IA réfléchit…'
                    : 'Assistant IA disponible'}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>En ligne</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Appel',
                'Les appels vocaux seront bientôt disponibles.',
              )
            }
          >
            <Phone size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Vidéo',
                'Les appels vidéo seront bientôt disponibles.',
              )
            }
          >
            <Video size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Options',
                'Les options de conversation seront bientôt disponibles.',
              )
            }
          >
            <MoreVertical size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Aucun message. Commencez la conversation !
            </Text>
          </View>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {assistantLoading && (
          <Text style={styles.assistantLoading} testID="chat-assistant-loading">
            Analyse de vos priorités…
          </Text>
        )}
      </ScrollView>

      <MessageComposer
        value={draft}
        onChangeText={onChangeDraft}
        onSend={onSend}
        disabled={!draft.trim() || assistantLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    maxHeight: 250,
    padding: 16,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
    textAlign: 'center',
  },
  assistantLoading: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
});
