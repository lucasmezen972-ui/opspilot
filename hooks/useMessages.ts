import { useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES, DEMO_USER_ID } from '../lib/demo';
import { supabase, type Message, type Conversation } from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setConversations(DEMO_CONVERSATIONS);
      setMessages(DEMO_MESSAGES);
      setLoading(false);
      return;
    }

    if (profile?.organization_id) {
      fetchConversations();
      const cleanup = setupRealtimeSubscription();
      return () => {
        cleanup?.();
      };
    }
  }, [profile?.organization_id, isDemo]);

  const fetchConversations = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('last_message_at', { ascending: false });

      if (error) {
        mapSupabaseError(
          'Erreur lors de la recuperation des conversations',
          error,
        );
        return;
      }

      setConversations(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchConversations', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (isDemo) {
      setMessages(DEMO_MESSAGES.filter((m) => m.conversation_id === conversationId));
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
        mapSupabaseError('Erreur lors de la recuperation des messages', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      mapSupabaseError('Erreur fetchMessages', error);
    }
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: Message['message_type'] = 'text',
  ) => {
    if (!profile) return { data: null, error: 'Utilisateur non connecte' };

    if (isDemo) {
      const newMsg: Message = {
        id: `demo-msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        message_type: messageType,
        attachments: [],
        read_by: [profile.id],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      return { data: newMsg };
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

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setMessages([...messages, data]);
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

    if (isDemo) {
      setMessages(
        messages.map((m) =>
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

      setMessages(
        messages.map((m) =>
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
          setMessages((current) => [...current, newMessage]);
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
      return { data: null, error: 'Organisation non definie' };

    if (isDemo) {
      const newConv: Conversation = {
        id: `demo-conv-${Date.now()}`,
        organization_id: profile.organization_id,
        name,
        type,
        participants,
        created_by: profile.id,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setConversations([newConv, ...conversations]);
      return { data: newConv };
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
            'Erreur lors de la creation de la conversation',
            error,
          ),
        };
      }

      setConversations([data, ...conversations]);
      return { data };
    } catch (error) {
      return { error: mapSupabaseError('Erreur createConversation', error) };
    }
  };

  const getUnreadCount = (conversationId: string) => {
    if (!profile) return 0;

    return messages.filter(
      (m) =>
        m.conversation_id === conversationId &&
        !m.read_by.includes(profile.id) &&
        m.sender_id !== profile.id,
    ).length;
  };

  return {
    messages,
    conversations,
    loading,
    fetchMessages,
    sendMessage,
    markAsRead,
    createConversation,
    getUnreadCount,
    refetch: fetchConversations,
  };
}
