import { Bell, Search } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { ConversationCard } from '../../features/chat/ConversationCard';
import { ConversationPanel } from '../../features/chat/ConversationPanel';
import {
  getLocalAssistantResponse,
  getLocalOperationalContext,
} from '../../features/chat/assistant';
import {
  buildConversations,
  buildAssistantHistory,
  toDisplayMessages,
  formatTime,
  type DisplayMessage,
} from '../../features/chat/chatModel';
import { ChannelList } from '../../features/messaging/ChannelList';
import { ChannelView } from '../../features/messaging/ChannelView';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuth } from '../../hooks/useAuth';
import { useChannels } from '../../hooks/useChannels';
import { useMessages } from '../../hooks/useMessages';
import { supabase } from '../../lib/supabase';
import { AppScreenHeader } from '../../shared/components/AppScreenHeader';
import { AppTabBar } from '../../shared/components/AppTabBar';
import { colors } from '../../shared/styles/tokens';
import { logger } from '../../utils/logger';
import { isManagerRole } from '../../utils/roles';

export default function ChatScreen() {
  const { profile, session, isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'canaux'>('messages');
  const {
    channels,
    getMessagesForChannel,
    getPinnedMessage,
    getUnreadCount: getChannelUnread,
    markChannelRead,
    sendMessage: sendChannelMessage,
    togglePin,
    deleteMessage,
    searchMessages,
    currentUserId,
  } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;
  const isManager = isManagerRole(profile?.role);

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    markChannelRead(channelId);
  };

  const {
    messages: dbMessages,
    conversations: dbConversations,
    loading,
    fetchMessages,
    sendMessage: sendDbMessage,
    getUnreadCount,
  } = useMessages();

  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<DisplayMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const isLocalDemo = isDemoMode && !session;

  // Modules pilotés depuis le back-office (assistant IA désactivable).
  const { isEnabled } = useAppSettings();

  const conversations = buildConversations(
    dbConversations,
    getUnreadCount,
    isEnabled('features.ai_assistant'),
  );

  // Sélectionner la première conversation par défaut.
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]?.id ?? null);
    }
  }, [conversations.length]);

  // Charger les messages quand on change de conversation réelle.
  useEffect(() => {
    if (selectedConversation && !selectedConversation.startsWith('demo-')) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const displayMessages = selectedConversation?.startsWith('demo-')
    ? localMessages.filter(
        (message) => message.conversationId === selectedConversation,
      )
    : toDisplayMessages(dbMessages, profile?.id);

  const isAIConversation =
    selectedConversation === 'demo-ai' ||
    conversations.find((c) => c.id === selectedConversation)?.type ===
      'support';

  const selectedConvName =
    conversations.find((c) => c.id === selectedConversation)?.name ??
    'Conversation';

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || assistantLoading) return;
    const content = newMessage.trim();
    setNewMessage('');

    if (!selectedConversation.startsWith('demo-')) {
      const result = await sendDbMessage(selectedConversation, content);
      if (result.error) {
        Alert.alert('Erreur', "Impossible d'envoyer le message.");
      }
      return;
    }

    const msg: DisplayMessage = {
      id: `local-${Date.now()}`,
      conversationId: selectedConversation,
      sender: profile?.full_name ?? 'Vous',
      content,
      timestamp: formatTime(Date.now()),
      isMe: true,
    };
    setLocalMessages((prev) => [...prev, msg]);

    if (!isAIConversation) return;

    const history = buildAssistantHistory(localMessages, content);
    setAssistantLoading(true);
    try {
      let aiResponse: string;
      if (isLocalDemo || !session) {
        aiResponse = getLocalAssistantResponse(
          content,
          getLocalOperationalContext(),
        );
      } else {
        const { data, error } = await supabase.functions.invoke<{
          reply?: string;
          error?: string;
        }>('ai-assistant', {
          body: { messages: history },
        });
        if (error || !data?.reply) {
          throw new Error(data?.error ?? error?.message ?? 'Réponse vide');
        }
        aiResponse = data.reply;
      }

      setLocalMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          conversationId: 'demo-ai',
          sender: 'Assistant IA OpsPilot',
          content: aiResponse,
          timestamp: formatTime(Date.now()),
          isMe: false,
        },
      ]);
    } catch (error) {
      logger.error('Erreur assistant IA', error);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          conversationId: 'demo-ai',
          sender: 'Assistant IA OpsPilot',
          content:
            'Je suis temporairement indisponible. Vérifiez la connexion puis réessayez dans quelques instants.',
          timestamp: formatTime(Date.now()),
          isMe: false,
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppScreenHeader
        title="Communication"
        titleTestID="page-messages-title"
        subtitle="Messagerie & canaux officiels"
        right={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Alert.alert(
                  'Recherche',
                  'La recherche de messages sera bientôt disponible.',
                )
              }
            >
              <Search size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'Les notifications seront bientôt disponibles.',
                )
              }
            >
              <Bell size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        }
      />

      <AppTabBar
        activeKey={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'messages', label: 'Messages', testID: 'chat-tab-messages' },
          { key: 'canaux', label: 'Canaux', testID: 'chat-tab-canaux' },
        ]}
      />

      {activeTab === 'canaux' ? (
        <View style={styles.channelContainer} testID="chat-channels-container">
          {activeChannel ? (
            <ChannelView
              channel={activeChannel}
              messages={getMessagesForChannel(activeChannel.id)}
              pinnedMessage={getPinnedMessage(activeChannel.id)}
              currentUserId={currentUserId}
              canModerate={isManager}
              onBack={() => setActiveChannelId(null)}
              onSend={(content, type) => {
                sendChannelMessage(activeChannel.id, content, type).then(
                  (result) => {
                    if (result?.error) {
                      Alert.alert(
                        'Message non envoyé',
                        'La communication interne reste disponible en mode démo.',
                      );
                    }
                  },
                );
              }}
              onTogglePin={togglePin}
              onDelete={deleteMessage}
              onSearch={searchMessages}
            />
          ) : (
            <ScrollView>
              <ChannelList
                channels={channels}
                activeChannelId={activeChannelId}
                getUnreadCount={getChannelUnread}
                onSelect={handleSelectChannel}
              />
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView style={styles.conversationsList}>
          <Text style={styles.sectionTitle}>Conversations</Text>
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              active={selectedConversation === conversation.id}
              onPress={() => setSelectedConversation(conversation.id)}
            />
          ))}

          <ConversationPanel
            name={selectedConvName}
            isAI={Boolean(isAIConversation)}
            assistantLoading={assistantLoading}
            loading={loading}
            messages={displayMessages}
            draft={newMessage}
            onChangeDraft={setNewMessage}
            onSend={handleSendMessage}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textStrong,
    marginBottom: 16,
  },
  channelContainer: {
    flex: 1,
  },
});
