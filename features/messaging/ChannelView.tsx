import {
  ArrowLeft,
  Megaphone,
  Pin,
  PinOff,
  Search,
  Send,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Channel, ChannelMessage } from '../../lib/supabase';
import { colors } from '../../shared/styles/tokens';

interface Props {
  channel: Channel;
  messages: ChannelMessage[];
  pinnedMessage: ChannelMessage | undefined;
  currentUserId: string;
  canModerate: boolean;
  onBack: () => void;
  onSend: (content: string, type?: ChannelMessage['message_type']) => void;
  onTogglePin: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onSearch: (query: string) => ChannelMessage[];
}

function formatMsgTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatMsgDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function MessageRow({
  msg,
  isMe,
  canModerate,
  onTogglePin,
  onDelete,
}: {
  msg: ChannelMessage;
  isMe: boolean;
  canModerate: boolean;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isAnnouncement = msg.message_type === 'announcement';
  const readCount = (msg.read_by ?? []).length;

  const handleLongPress = () => {
    if (!canModerate) return;
    Alert.alert(msg.sender_name, msg.content.slice(0, 80), [
      {
        text: msg.is_pinned ? 'Désépingler' : 'Épingler',
        onPress: () => onTogglePin(msg.id),
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Supprimer ce message ?', undefined, [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => onDelete(msg.id),
            },
          ]),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      style={[
        styles.msgRow,
        isAnnouncement && styles.msgRowAnnouncement,
        msg.is_pinned && styles.msgRowPinned,
      ]}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
      testID={`channel-message-${msg.id}`}
    >
      <View style={styles.msgAvatar}>
        <Text style={styles.msgAvatarText}>
          {msg.sender_name
            .trim()
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.msgBody}>
        <View style={styles.msgMeta}>
          <Text style={styles.msgSender}>{msg.sender_name}</Text>
          {isAnnouncement && (
            <View style={styles.announceBadge}>
              <Megaphone size={10} color="#7C3AED" />
              <Text style={styles.announceBadgeText}>Annonce</Text>
            </View>
          )}
          {msg.is_pinned && (
            <Pin size={10} color="#F59E0B" style={styles.pinIcon} />
          )}
          <Text style={styles.msgTime}>{formatMsgTime(msg.created_at)}</Text>
        </View>
        <Text style={styles.msgContent}>{msg.content}</Text>
        {isAnnouncement && readCount > 0 && (
          <Text style={styles.readCount}>
            {readCount} vue{readCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function ChannelView({
  channel,
  messages,
  pinnedMessage,
  currentUserId,
  canModerate,
  onBack,
  onSend,
  onTogglePin,
  onDelete,
  onSearch,
}: Props) {
  const [draft, setDraft] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const listRef = useRef<FlatList>(null);

  const filteredMessages =
    showSearch && searchQuery ? onSearch(searchQuery) : messages;

  useEffect(() => {
    if (messages.length > 0 && !showSearch) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages.length, showSearch]);

  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    onSend(draft, isAnnouncement ? 'announcement' : 'text');
    setDraft('');
    setIsAnnouncement(false);
  }, [draft, isAnnouncement, onSend]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.channelHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          testID="channel-back-button"
        >
          <ArrowLeft size={18} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.channelHeaderLeft}>
          <Text style={styles.channelName}>#{channel.name}</Text>
          {channel.description ? (
            <Text style={styles.channelDesc} numberOfLines={1}>
              {channel.description}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.searchToggle, showSearch && styles.searchToggleActive]}
          onPress={() => {
            setShowSearch((v) => !v);
            setSearchQuery('');
          }}
          testID="channel-search-toggle"
        >
          <Search
            size={16}
            color={showSearch ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans ce canal…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            testID="channel-search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {pinnedMessage && !showSearch && (
        <View style={styles.pinnedBanner} testID="channel-pinned-banner">
          <Pin size={12} color="#F59E0B" />
          <Text style={styles.pinnedText} numberOfLines={2}>
            {pinnedMessage.content}
          </Text>
          {canModerate && (
            <TouchableOpacity
              onPress={() => onTogglePin(pinnedMessage.id)}
              testID="channel-unpin-button"
            >
              <PinOff size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageRow
            msg={item}
            isMe={item.user_id === currentUserId}
            canModerate={canModerate}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
          />
        )}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {showSearch && searchQuery
                ? 'Aucun message trouvé.'
                : "Aucun message pour l'instant."}
            </Text>
          </View>
        }
      />

      {!showSearch && (
        <View style={styles.composer}>
          {canModerate && (
            <TouchableOpacity
              style={[
                styles.announcementToggle,
                isAnnouncement && styles.announcementToggleActive,
              ]}
              onPress={() => setIsAnnouncement((v) => !v)}
              testID="channel-announcement-toggle"
            >
              <Megaphone
                size={16}
                color={isAnnouncement ? '#7C3AED' : colors.textMuted}
              />
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.input}
            placeholder={
              isAnnouncement ? 'Rédiger une annonce…' : 'Écrire un message…'
            }
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
            testID="channel-message-input"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !draft.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!draft.trim()}
            testID="channel-send-button"
          >
            <Send
              size={18}
              color={draft.trim() ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  channelHeaderLeft: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textStrong,
  },
  channelDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  searchToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchToggleActive: {
    backgroundColor: colors.primarySoft,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textStrong,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  pinnedText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
  },
  msgRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  msgRowAnnouncement: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
    marginVertical: 4,
  },
  msgRowPinned: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  msgAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  msgBody: {
    flex: 1,
  },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  msgSender: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
  },
  announceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  announceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  pinIcon: {
    marginLeft: 2,
  },
  msgTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  msgContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  readCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  announcementToggle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  announcementToggleActive: {
    backgroundColor: '#EDE9FE',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textStrong,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
