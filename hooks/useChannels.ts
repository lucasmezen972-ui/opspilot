import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './useAuth';
import { DEMO_USER_ID, demoId } from '../lib/demoData';
import { updateDemoCollection, useDemoCollection } from '../lib/demoStore';
import {
  supabase,
  type Channel,
  type ChannelMessage,
  type ChannelRead,
} from '../lib/supabase';
import { mapSupabaseError } from '../utils/error';

function now() {
  return new Date().toISOString();
}

export function useChannels() {
  const { profile, isDemoMode, session } = useAuth();
  const isLocalDemo = isDemoMode && !session;

  const demoChannels = useDemoCollection('channels');
  const demoMessages = useDemoCollection('channelMessages');
  const [remoteChannels, setRemoteChannels] = useState<Channel[]>([]);
  const [remoteMessages, setRemoteMessages] = useState<ChannelMessage[]>([]);
  // Marqueurs de lecture par canal (mode connecté) : channel_id -> last_read_at.
  const [remoteReads, setRemoteReads] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!isLocalDemo);
  const [error, setError] = useState<string | null>(null);

  const channels = isLocalDemo ? demoChannels : remoteChannels;
  const allMessages = isLocalDemo ? demoMessages : remoteMessages;

  const currentUserId = isLocalDemo ? DEMO_USER_ID : (profile?.id ?? '');

  useEffect(() => {
    if (isLocalDemo) return;
    if (!profile?.organization_id) return;
    fetchData().catch((err) => {
      setError(mapSupabaseError('Erreur chargement canaux', err));
      setLoading(false);
    });
  }, [profile?.organization_id, isLocalDemo]);

  const fetchData = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const { data: chData } = await supabase
        .from('channels')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });
      setRemoteChannels((chData ?? []) as Channel[]);

      const channelIds = (chData ?? []).map((c) => c.id as string);
      if (channelIds.length > 0) {
        const [msgResult, readResult] = await Promise.all([
          supabase
            .from('channel_messages')
            .select('*')
            .in('channel_id', channelIds)
            .order('created_at', { ascending: true }),
          supabase
            .from('channel_reads')
            .select('channel_id, last_read_at')
            .eq('user_id', profile.id),
        ]);
        setRemoteMessages((msgResult.data ?? []) as ChannelMessage[]);
        const reads: Record<string, string> = {};
        for (const r of (readResult.data ?? []) as ChannelRead[]) {
          reads[r.channel_id] = r.last_read_at;
        }
        setRemoteReads(reads);
      } else {
        setRemoteMessages([]);
        setRemoteReads({});
      }
    } finally {
      setLoading(false);
    }
  };

  const getMessagesForChannel = useCallback(
    (channelId: string) =>
      allMessages.filter((m) => m.channel_id === channelId),
    [allMessages],
  );

  const getPinnedMessage = useCallback(
    (channelId: string) =>
      allMessages.find((m) => m.channel_id === channelId && m.is_pinned),
    [allMessages],
  );

  const getUnreadCount = useCallback(
    (channelId: string) => {
      if (isLocalDemo) {
        return allMessages.filter(
          (m) =>
            m.channel_id === channelId &&
            !(m.read_by ?? []).includes(currentUserId),
        ).length;
      }
      // Mode connecté : non lus = messages d'autrui postés après le dernier
      // accusé de lecture du canal (table channel_reads).
      const lastRead = remoteReads[channelId];
      return allMessages.filter((m) => {
        if (m.channel_id !== channelId) return false;
        if (m.user_id === currentUserId) return false;
        if (!lastRead) return true;
        return (m.created_at ?? '') > lastRead;
      }).length;
    },
    [allMessages, currentUserId, isLocalDemo, remoteReads],
  );

  const markChannelRead = useCallback(
    (channelId: string) => {
      if (isLocalDemo) {
        updateDemoCollection('channelMessages', (prev) =>
          prev.map((m) => {
            if (m.channel_id !== channelId) return m;
            const readBy = m.read_by ?? [];
            if (readBy.includes(currentUserId)) return m;
            return { ...m, read_by: [...readBy, currentUserId] };
          }),
        );
        return;
      }
      // Mode connecté : enregistre l'instant de lecture (upsert) et met à jour
      // l'état local pour vider le badge immédiatement.
      const readAt = now();
      setRemoteReads((prev) => ({ ...prev, [channelId]: readAt }));
      if (!profile?.id) return;
      supabase
        .from('channel_reads')
        .upsert(
          {
            user_id: profile.id,
            channel_id: channelId,
            last_read_at: readAt,
            updated_at: readAt,
          },
          { onConflict: 'user_id,channel_id' },
        )
        .then(
          ({ error }) => {
            if (error) mapSupabaseError('Erreur accusé de lecture', error);
          },
          () => {},
        );
    },
    [isLocalDemo, currentUserId, profile?.id],
  );

  const sendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      messageType: ChannelMessage['message_type'] = 'text',
      attachmentUrl?: string,
    ) => {
      if (!content.trim()) return;

      const msg: ChannelMessage = {
        id: demoId('cmsg'),
        channel_id: channelId,
        user_id: currentUserId,
        sender_name: profile?.full_name ?? 'Vous',
        sender_role: profile?.role ?? undefined,
        content: content.trim(),
        message_type: messageType,
        is_pinned: false,
        attachment_url: attachmentUrl ?? null,
        read_by: [currentUserId],
        created_at: now(),
        updated_at: now(),
      };

      if (isLocalDemo) {
        updateDemoCollection('channelMessages', (prev) => [...prev, msg]);
        return { data: msg };
      }

      const { data, error } = await supabase
        .from('channel_messages')
        .insert({
          channel_id: msg.channel_id,
          user_id: msg.user_id,
          sender_name: msg.sender_name,
          sender_role: msg.sender_role,
          content: msg.content,
          message_type: msg.message_type,
          attachment_url: msg.attachment_url,
          // L'auteur a déjà « lu » son message : évite de le compter comme
          // non lu dans son propre badge.
          read_by: msg.read_by,
        })
        .select()
        .single();

      if (!error && data) {
        setRemoteMessages((prev) => [...prev, data as ChannelMessage]);
        return { data };
      }
      return { error };
    },
    [isLocalDemo, currentUserId, profile],
  );

  const togglePin = useCallback(
    async (messageId: string) => {
      if (isLocalDemo) {
        updateDemoCollection('channelMessages', (prev) => {
          const msg = prev.find((m) => m.id === messageId);
          if (!msg) return prev;
          const channelId = msg.channel_id;
          return prev.map((m) => {
            if (m.channel_id !== channelId) return m;
            if (m.id === messageId) return { ...m, is_pinned: !m.is_pinned };
            if (m.is_pinned) return { ...m, is_pinned: false };
            return m;
          });
        });
        return;
      }
      const msg = allMessages.find((m) => m.id === messageId);
      if (!msg) return;
      const { error: pinErr } = await supabase
        .from('channel_messages')
        .update({ is_pinned: !msg.is_pinned })
        .eq('id', messageId);
      if (pinErr) {
        setError(mapSupabaseError('Erreur épinglage message', pinErr));
        return;
      }
      await fetchData();
    },
    [isLocalDemo, allMessages],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (isLocalDemo) {
        updateDemoCollection('channelMessages', (prev) =>
          prev.filter((m) => m.id !== messageId),
        );
        return;
      }
      const { error: delErr } = await supabase
        .from('channel_messages')
        .delete()
        .eq('id', messageId);
      if (delErr) {
        setError(mapSupabaseError('Erreur suppression message', delErr));
        return;
      }
      setRemoteMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [isLocalDemo],
  );

  const searchMessages = useCallback(
    (query: string): ChannelMessage[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      return allMessages.filter((m) => m.content.toLowerCase().includes(q));
    },
    [allMessages],
  );

  return {
    loading,
    error,
    channels,
    allMessages,
    getMessagesForChannel,
    getPinnedMessage,
    getUnreadCount,
    markChannelRead,
    sendMessage,
    togglePin,
    deleteMessage,
    searchMessages,
    currentUserId,
  };
}
