import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Send, Users, Bell, Search, MoveVertical as MoreVertical, Phone, Video } from 'lucide-react-native';

const conversations = [
  {
    id: 1,
    name: 'Équipe Magasin',
    lastMessage: 'Nouvelle livraison prévue à 14h',
    timestamp: '10:30',
    unread: 2,
    type: 'group',
    online: true,
  },
  {
    id: 2,
    name: 'Pierre Martin',
    lastMessage: 'Je termine l\'audit rayon frais',
    timestamp: '09:45',
    unread: 0,
    type: 'direct',
    online: true,
  },
  {
    id: 3,
    name: 'Support Technique',
    lastMessage: 'Votre ticket a été traité',
    timestamp: 'Hier',
    unread: 1,
    type: 'support',
    online: false,
  },
];

const messages = [
  {
    id: 1,
    sender: 'Marie Dupont',
    content: 'Bonjour tout le monde ! J\'ai terminé l\'inventaire du rayon frais.',
    timestamp: '10:30',
    isMe: true,
  },
  {
    id: 2,
    sender: 'Pierre Martin',
    content: 'Parfait ! Moi je m\'occupe du rayon boulangerie maintenant.',
    timestamp: '10:32',
    isMe: false,
  },
  {
    id: 3,
    sender: 'Jean Leroy',
    content: 'Attention, il y a eu un problème avec la caisse 3. Elle est hors service temporairement.',
    timestamp: '10:35',
    isMe: false,
  },
  {
    id: 4,
    sender: 'Marie Dupont',
    content: 'Merci pour l\'info Jean. J\'ai signalé le problème au support technique.',
    timestamp: '10:36',
    isMe: true,
  },
];

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList}>
        <Text style={styles.sectionTitle}>Conversations</Text>
        {conversations.map((conversation) => (
          <TouchableOpacity key={conversation.id} style={styles.conversationCard}>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <View style={styles.conversationTitleSection}>
                  <Text style={styles.conversationName}>{conversation.name}</Text>
                  <View style={styles.conversationMeta}>
                    {conversation.type === 'group' && (
                      <Users size={12} color="#6B7280" />
                    )}
                    {conversation.online && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>
                </View>
                <Text style={styles.conversationTimestamp}>{conversation.timestamp}</Text>
              </View>
              <Text style={styles.conversationLastMessage}>{conversation.lastMessage}</Text>
            </View>
            {conversation.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conversation.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Current Conversation */}
        <View style={styles.currentConversation}>
          <View style={styles.conversationHeaderActive}>
            <View style={styles.conversationInfoActive}>
              <Text style={styles.conversationNameActive}>Équipe Magasin</Text>
              <View style={styles.conversationStatusActive}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.conversationStatusText}>3 membres actifs</Text>
              </View>
            </View>
            <View style={styles.conversationActions}>
              <TouchableOpacity style={styles.conversationActionButton}>
                <Phone size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.conversationActionButton}>
                <Video size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.conversationActionButton}>
                <MoreVertical size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView style={styles.messagesList}>
            {messages.map((message) => (
              <View key={message.id} style={[
                styles.messageContainer,
                message.isMe ? styles.messageContainerMe : styles.messageContainerOther
              ]}>
                <View style={[
                  styles.messageBubble,
                  message.isMe ? styles.messageBubbleMe : styles.messageBubbleOther
                ]}>
                  {!message.isMe && (
                    <Text style={styles.messageSender}>{message.sender}</Text>
                  )}
                  <Text style={[
                    styles.messageContent,
                    message.isMe ? styles.messageContentMe : styles.messageContentOther
                  ]}>{message.content}</Text>
                  <Text style={[
                    styles.messageTimestamp,
                    message.isMe ? styles.messageTimestampMe : styles.messageTimestampOther
                  ]}>{message.timestamp}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.messageInput}>
            <TextInput
              style={styles.messageTextInput}
              placeholder="Tapez votre message..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton}>
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conversationTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  currentConversation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 400,
  },
  conversationHeaderActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  conversationInfoActive: {
    flex: 1,
  },
  conversationNameActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  conversationStatusActive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationStatusText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  conversationActionButton: {
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
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleMe: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageContentMe: {
    color: '#FFFFFF',
  },
  messageContentOther: {
    color: '#111827',
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimestampMe: {
    color: '#DBEAFE',
  },
  messageTimestampOther: {
    color: '#6B7280',
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  messageTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});