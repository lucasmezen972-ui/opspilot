import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from './useAuth';
import { useDemoCollection, updateDemoCollection } from '../lib/demoStore';
import { supabase, type Message, type Conversation } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useMessages() {
  const [remoteMessages, setRemoteMessages] = useState<Message[]>([]);
  const [remoteConversations, setRemoteConversations] = useState<
    Conversation[]
  >([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const activeConversationRef = useRef<string | null>(null);
  const isLocalDemo = isDemoMode && !session;

  const demoConversations = useDemoCollection('conversations');
  const demoMessages = useDemoCollection('messages');

  const conversations = isLocalDemo ? demoConversations : remoteConversations;
  const messages = isLocalDemo
    ? demoMessages.filter((m) => m.conversation_id === activeConversationId)
    : remoteMessages;

  useEffect(() => {
    if (isLocalDemo) {
      setLoading(false);
      return;
    }
    if (profile?.organization_id) {
      fetchConversations().then((convs) => {
        if (convs && convs.length > 0) fetchUnreadCounts(convs);
      });
      const cleanup = setupRealtimeSubscription();
      return () => {
        cleanup?.();
      };
    }
  }, [profile?.organization_id, profile?.id, isLocalDemo]);

  const fetchConversations = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('conversations')
        .select('*, messages(content, created_at)')
        .eq('organization_id', profile.organization_id)
        .order('last_message_at', { ascending: false });

      if (fetchErr) {
        setError(
          mapSupabaseError(
            'Erreur lors de la récupération des conversations',
            fetchErr,
          ),
        );
        return;
      }

      setRemoteConversations(data || []);
      return data || [];
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchConversations', err));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      activeConversationRef.current = conversationId;
      setActiveConversationId(conversationId);
      if (isLocalDemo) {
        return;
      }
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(
            `
          *,
          profiles(full_name, avatar_url)
        `,
          )
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          setError(
            mapSupabaseError(
              'Erreur lors de la récupération des messages',
              error,
            ),
          );
          return;
        }

        setRemoteMessages(data || []);
      } catch (err) {
        setError(mapSupabaseError('Erreur fetchMessages', err));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isLocalDemo, profile?.organization_id],
  );

  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: Message['message_type'] = 'text',
  ) => {
    if (!profile) return { data: null, error: 'Utilisateur non connecté' };

    if (isLocalDemo) {
      const msg: Message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        message_type: messageType,
        attachments: [],
        read_by: [profile.id],
        created_at: new Date().toISOString(),
      };
      updateDemoCollection('messages', (prev) => [...prev, msg]);
      return { data: msg };
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
          message_type: messageType,
          attachments: [],
          read_by: [profile.id],
        })
        .select(
          `
          *,
          profiles(full_name, avatar_url)
        `,
        )
        .single();

      if (error) {
        return {
          error: mapSupabaseError("Erreur lors de l'envoi du message", error),
        };
      }

      // Mettre à jour la dernière activité de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setRemoteMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur envoi message', error) };
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!profile) return;

    const allMessages = isLocalDemo ? demoMessages : remoteMessages;
    const message = allMessages.find((m) => m.id === messageId);
    if (!message || message.read_by.includes(profile.id)) return;

    const updatedReadBy = [...message.read_by, profile.id];

    if (isLocalDemo) {
      updateDemoCollection('messages', (prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, read_by: updatedReadBy } : m,
        ),
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId);

      if (error) {
        mapSupabaseError('Erreur lors du marquage comme lu', error);
        return;
      }

      setRemoteMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, read_by: updatedReadBy } : m,
        ),
      );
    } catch (error) {
      mapSupabaseError('Erreur markAsRead', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.organization_id) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            activeConversationRef.current &&
            newMessage.conversation_id === activeConversationRef.current
          ) {
            setRemoteMessages((current) => {
              if (current.some((m) => m.id === newMessage.id)) return current;
              return [...current, newMessage];
            });
          }
          setUnreadCounts((prev) => {
            if (newMessage.sender_id === profile?.id) return prev;
            const convId = newMessage.conversation_id;
            if (convId === activeConversationRef.current) return prev;
            return { ...prev, [convId]: (prev[convId] ?? 0) + 1 };
          });
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const createConversation = async (
    name: string,
    type: 'group' | 'direct',
    participants: string[],
  ) => {
    if (!profile?.organization_id)
      return { data: null, error: 'Organisation non définie' };

    if (isLocalDemo) {
      const conv: Conversation = {
        id: `demo-conv-${Date.now()}`,
        organization_id: profile.organization_id,
        name,
        description: null,
        type,
        participants,
        last_message_at: new Date().toISOString(),
        created_by: profile.id,
        created_at: new Date().toISOString(),
      };
      updateDemoCollection('conversations', (prev) => [conv, ...prev]);
      return { data: conv };
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          organization_id: profile.organization_id,
          name,
          type,
          participants,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) {
        return {
          error: mapSupabaseError(
            'Erreur lors de la création de la conversation',
            error,
          ),
        };
      }

      setRemoteConversations((prev) => [data, ...prev]);
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur createConversation', error) };
    }
  };

  const fetchUnreadCounts = async (convs?: Conversation[]) => {
    if (!profile || isLocalDemo) return;

    try {
      const targets = convs ?? remoteConversations;
      const results = await Promise.all(
        targets.map((conv) =>
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .not('read_by', 'cs', `{${profile.id}}`)
            .neq('sender_id', profile.id)
            .then(({ count, error }) => ({
              id: conv.id,
              count: !error && count != null ? count : 0,
            })),
        ),
      );
      const counts: Record<string, number> = {};
      for (const r of results) counts[r.id] = r.count;
      setUnreadCounts(counts);
    } catch (error) {
      mapSupabaseError('Erreur fetchUnreadCounts', error);
    }
  };

  const getUnreadCount = (conversationId: string) => {
    if (!profile) return 0;

    if (conversationId === activeConversationRef.current) {
      const allMessages = isLocalDemo ? demoMessages : remoteMessages;
      return allMessages.filter(
        (m) =>
          m.conversation_id === conversationId &&
          !m.read_by.includes(profile.id) &&
          m.sender_id !== profile.id,
      ).length;
    }

    return unreadCounts[conversationId] ?? 0;
  };

  return {
    messages,
    conversations,
    loading,
    error,
    fetchMessages,
    sendMessage,
    markAsRead,
    createConversation,
    getUnreadCount,
    refetch: fetchConversations,
  };
}
