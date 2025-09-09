import { useEffect, useState } from 'react'
import { supabase, type Message } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.organization_id) {
      fetchConversations()
      setupRealtimeSubscription()
    }
  }, [profile])

  const fetchConversations = async () => {
    if (!profile?.organization_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la récupération des conversations:', error)
        return
      }

      setConversations(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const sendMessage = async (conversationId: string, content: string, type: Message['type'] = 'text') => {
    if (!profile) return { error: 'Utilisateur non connecté' }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
          type,
          attachments: [],
          read_by: [profile.id],
        })
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .single()

      if (error) {
        console.error('Erreur lors de l\'envoi du message:', error)
        return { error }
      }

      // Mettre à jour la dernière activité de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      setMessages([...messages, data])
      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const markAsRead = async (messageId: string) => {
    if (!profile) return

    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.read_by.includes(profile.id)) return

      const updatedReadBy = [...message.read_by, profile.id]

      const { error } = await supabase
        .from('messages')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId)

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error)
        return
      }

      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, read_by: updatedReadBy }
          : m
      ))
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!profile?.organization_id) return

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
          const newMessage = payload.new as Message
          setMessages(current => [...current, newMessage])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const createConversation = async (name: string, type: 'group' | 'direct', participants: string[]) => {
    if (!profile?.organization_id) return { error: 'Organisation non définie' }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          organization_id: profile.organization_id,
          name,
          type,
          participants,
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la création de la conversation:', error)
        return { error }
      }

      setConversations([data, ...conversations])
      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const getUnreadCount = (conversationId: string) => {
    if (!profile) return 0
    
    return messages.filter(m => 
      m.conversation_id === conversationId && 
      !m.read_by.includes(profile.id) &&
      m.sender_id !== profile.id
    ).length
  }

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
  }
}