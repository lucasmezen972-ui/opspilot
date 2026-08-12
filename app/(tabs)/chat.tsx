import { Bell, Search, X } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const isLocalDemo = isDemoMode && !session;

  // Modules pilotés depuis le back-office (assistant IA désactivable).
  const { isEnabled } = useAppSettings();

  const conversations = buildConversations(
    dbConversations,
    getUnreadCount,
    isEnabled('features.ai_assistant'),
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(() => {
    const convUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
    const chanUnread = channels.reduce(
      (sum, c) => sum + getChannelUnread(c.id),
      0,
    );
    return convUnread + chanUnread;
  }, [conversations, channels, getChannelUnread]);

  // Sélectionner la première conversation par défaut.
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, selectedConversation]);

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
          conversationId: selectedConversation,
          sender: 'Assistant IA OpsPilot',
          content: aiResponse,
          timestamp: formatTime(Date.now()),
          isMe: false,
        },
      ]);
    } catch (err) {
      logger.error('Erreur assistant IA', err);
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          conversationId: selectedConversation,
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
              testID="chat-search-button"
              onPress={() => {
                setShowSearch((v) => !v);
                if (showSearch) setSearchQuery('');
              }}
            >
              {showSearch ? (
                <X size={20} color={colors.primary} />
              ) : (
                <Search size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              testID="chat-notif-button"
              onPress={() => setShowNotifPanel((v) => !v)}
            >
              <Bell size={20} color={colors.textMuted} />
              {totalUnread > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        }
      />

      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les conversations…"
            placeholderTextColor={colors.textFaint}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            testID="chat-search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {showNotifPanel && (
        <View style={styles.notifPanel}>
          <Text style={styles.notifPanelTitle}>Notifications</Text>
          {totalUnread === 0 ? (
            <Text style={styles.notifPanelEmpty}>
              Aucun message non lu. Vous êtes à jour !
            </Text>
          ) : (
            <>
              {conversations
                .filter((c) => c.unread > 0)
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.notifRow}
                    onPress={() => {
                      setSelectedConversation(c.id);
                      setActiveTab('messages');
                      setShowNotifPanel(false);
                    }}
                  >
                    <View style={styles.notifDot} />
                    <Text style={styles.notifRowText} numberOfLines={1}>
                      {c.name} — {c.unread} non lu{c.unread > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              {channels
                .filter((c) => getChannelUnread(c.id) > 0)
                .map((c) => {
                  const count = getChannelUnread(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.notifRow}
                      onPress={() => {
                        handleSelectChannel(c.id);
                        setActiveTab('canaux');
                        setShowNotifPanel(false);
                      }}
                    >
                      <View style={styles.notifDot} />
                      <Text style={styles.notifRowText} numberOfLines={1}>
                        #{c.name} — {count} non lu{count > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </>
          )}
        </View>
      )}

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
          {filteredConversations.map((conversation) => (
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
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textStrong,
    paddingVertical: 2,
  },
  notifPanel: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifPanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: 8,
  },
  notifPanelEmpty: {
    fontSize: 13,
    color: colors.textMuted,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifRowText: {
    fontSize: 13,
    color: colors.textStrong,
    flex: 1,
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
