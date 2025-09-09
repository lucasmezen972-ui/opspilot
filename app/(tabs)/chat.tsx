import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Send, Users, Bell, Search, MoveVertical as MoreVertical, Phone, Video, Bot, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getChatAssistantResponse } from '../../lib/openai';

export default function ChatScreen() {
  const { profile } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: profile?.full_name || 'Vous',
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
      sender: profile?.full_name || 'Vous',
      content: 'Merci pour l\'info Jean. J\'ai signalé le problème au support technique.',
      timestamp: '10:36',
      isMe: true,
    },
  ]);

  const [conversations] = useState([
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
      name: 'Assistant IA OpsPilot',
      lastMessage: 'Comment puis-je vous aider aujourd\'hui ?',
      timestamp: '09:45',
      unread: 0,
      type: 'ai',
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
  ]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: profile?.full_name || 'Vous',
      content: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Si c'est la conversation IA, obtenir une réponse
    if (selectedConversation === 2) {
      try {
        const aiResponse = await getChatAssistantResponse(
          message.content,
          `Utilisateur: ${profile?.full_name}, Rôle: ${profile?.role}, Magasin: OpsPilot Demo`
        );

        setTimeout(() => {
          const aiMessage = {
            id: messages.length + 2,
            sender: 'Assistant IA OpsPilot',
            content: aiResponse,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
            isAI: true,
          };
          setMessages(current => [...current, aiMessage]);
        }, 1000);
      } catch (error) {
        console.error('Erreur assistant IA:', error);
      }
    }
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'group': return Users;
      case 'ai': return Bot;
      case 'support': return Bell;
      default: return Users;
    }
  };

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
        {conversations.map((conversation) => {
          const IconComponent = getConversationIcon(conversation.type);
          return (
            <TouchableOpacity 
              key={conversation.id} 
              style={[
                styles.conversationCard,
                selectedConversation === conversation.id && styles.conversationCardActive
              ]}
              onPress={() => setSelectedConversation(conversation.id)}
            >
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <View style={styles.conversationTitleSection}>
                    <Text style={styles.conversationName}>{conversation.name}</Text>
                    <View style={styles.conversationMeta}>
                      <IconComponent size={12} color={conversation.type === 'ai' ? '#8B5CF6' : '#6B7280'} />
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
          );
        })}

        {/* Current Conversation */}
        <View style={styles.currentConversation}>
          <View style={styles.conversationHeaderActive}>
            <View style={styles.conversationInfoActive}>
              <Text style={styles.conversationNameActive}>
                {conversations.find(c => c.id === selectedConversation)?.name || 'Conversation'}
              </Text>
              <View style={styles.conversationStatusActive}>
                {selectedConversation === 2 ? (
                  <>
                    <Sparkles size={12} color="#8B5CF6" />
                    <Text style={styles.conversationStatusText}>Assistant IA disponible</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.onlineIndicator} />
                    <Text style={styles.conversationStatusText}>3 membres actifs</Text>
                  </>
                )}
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
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Tapez votre message..."
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
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
  conversationCardActive: {
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
});