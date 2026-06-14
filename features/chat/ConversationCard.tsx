import { Users, Bot } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import type { ChatConversation } from './chatModel';
import { colors, radius, shadow } from '../../shared/styles/tokens';

interface ConversationCardProps {
  conversation: ChatConversation;
  active: boolean;
  onPress: () => void;
}

function conversationIcon(type: string) {
  return type === 'support' ? Bot : Users;
}

/** Carte d'une conversation dans la liste : nom, dernier message, badge. */
export function ConversationCard({
  conversation,
  active,
  onPress,
}: ConversationCardProps) {
  const Icon = conversationIcon(conversation.type);
  return (
    <TouchableOpacity
      testID={`conversation-${conversation.id}`}
      style={[styles.card, active && styles.cardActive]}
      onPress={onPress}
    >
      <View style={styles.info}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.name}>{conversation.name}</Text>
            <View style={styles.meta}>
              <Icon
                size={12}
                color={conversation.type === 'support' ? '#8B5CF6' : '#6B7280'}
              />
              {conversation.online && <View style={styles.onlineIndicator} />}
            </View>
          </View>
          <Text style={styles.timestamp}>{conversation.timestamp}</Text>
        </View>
        <Text style={styles.lastMessage}>{conversation.lastMessage}</Text>
      </View>
      {conversation.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conversation.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    ...shadow.card,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textStrong,
    marginRight: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textMuted,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
