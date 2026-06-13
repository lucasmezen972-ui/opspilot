import { View, Text, StyleSheet } from 'react-native';

import type { DisplayMessage } from './chatModel';
import { colors } from '../../shared/styles/tokens';

interface MessageBubbleProps {
  message: DisplayMessage;
}

/** Bulle d'un message : expéditeur, contenu et heure, alignée selon l'auteur. */
export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <View
      style={[
        styles.container,
        message.isMe ? styles.containerMe : styles.containerOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          message.isMe ? styles.bubbleMe : styles.bubbleOther,
        ]}
      >
        {!message.isMe && <Text style={styles.sender}>{message.sender}</Text>}
        <Text
          testID={message.isMe ? 'chat-user-message' : 'chat-assistant-message'}
          style={[
            styles.content,
            message.isMe ? styles.contentMe : styles.contentOther,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.timestamp,
            message.isMe ? styles.timestampMe : styles.timestampOther,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  containerMe: {
    alignItems: 'flex-end',
  },
  containerOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentMe: {
    color: '#FFFFFF',
  },
  contentOther: {
    color: colors.textStrong,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  timestampMe: {
    color: '#DBEAFE',
  },
  timestampOther: {
    color: colors.textMuted,
  },
});
