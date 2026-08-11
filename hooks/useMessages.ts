import { useEffect, useRef, useState } from 'react';

import { useAuth } from './useAuth';
import { DEMO_ORG_ID, DEMO_USER_ID } from '../lib/demoData';
import { supabase, type Message, type Conversation } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-conv-1',
    organization_id: DEMO_ORG_ID,
    name: 'Équipe magasin',
    description: 'Discussion générale',
    type: 'group',
    participants: [],
    last_message_at: new Date().toISOString(),
    created_by: null,
    created_at: new Date().toISOString(),
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    conversation_id: 'demo-conv-1',
    sender_id: DEMO_USER_ID,
    content: 'Bienvenue sur OpsPilot ! Ceci est un message de démonstration.',
    message_type: 'text',
    attachments: [],
    read_by: [],
    created_at: new Date().toISOString(),
  },
];

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, isDemoMode, session } = useAuth();
  const activeConversationRef = useRef<string | null>(null);
  const isLocalDemo = isDemoMode && !session;

  useEffect(() => {
    if (isLocalDemo) {
      setConversations(DEMO_CONVERSATIONS);
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
  }, [profile?.organization_id, isLocalDemo]);

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

      setConversations(data || []);
      return data || [];
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchConversations', err));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    activeConversationRef.current = conversationId;
    if (isLocalDemo) {
      setMessages(
        DEMO_MESSAGES.filter((m) => m.conversation_id === conversationId),
      );
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

      setMessages(data || []);
    } catch (err) {
      setError(mapSupabaseError('Erreur fetchMessages', err));
    }
  };

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
      setMessages((prev) => [...prev, msg]);
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

      setMessages((prev) => {
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

    const message = messages.find((m) => m.id === messageId);
    if (!message || message.read_by.includes(profile.id)) return;

    const updatedReadBy = [...message.read_by, profile.id];

    if (isLocalDemo) {
      setMessages((prev) =>
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

      setMessages((prev) =>
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
            newMessage.conversation_id !== activeConversationRef.current
          ) {
            return;
          }
          setMessages((current) => {
            if (current.some((m) => m.id === newMessage.id)) return current;
            return [...current, newMessage];
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
      setConversations((prev) => [conv, ...prev]);
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

      setConversations((prev) => [data, ...prev]);
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur createConversation', error) };
    }
  };

  const fetchUnreadCounts = async (convs?: Conversation[]) => {
    if (!profile || isLocalDemo) return;

    try {
      const counts: Record<string, number> = {};
      for (const conv of convs ?? conversations) {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .not('read_by', 'cs', `{${profile.id}}`)
          .neq('sender_id', profile.id);

        if (!error && count != null) {
          counts[conv.id] = count;
        }
      }
      setUnreadCounts(counts);
    } catch (error) {
      mapSupabaseError('Erreur fetchUnreadCounts', error);
    }
  };

  const getUnreadCount = (conversationId: string) => {
    if (!profile) return 0;

    if (conversationId === activeConversationRef.current) {
      return messages.filter(
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
