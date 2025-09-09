import { useEffect, useState } from 'react'
import { supabase, type Message, type Conversation } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
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
        .contains('participants', [profile.id])
        .order('last_message_at', { ascending: false })

      if (error) {
        // Si la table n'existe pas, ne pas faire crasher l'app
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Table conversations pas encore créée')
          setConversations([])
          setLoading(false)
          return
        }
        console.error('Erreur conversations:', error)
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
          sender:profiles!sender_id(full_name, avatar_url, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        // Si la table n'existe pas, ne pas faire crasher l'app
        if (error.code === 'PGRST205') {
          console.log('ℹ️ Table messages pas encore créée')
          setMessages([])
          return
        }
        console.error('Erreur messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const sendMessage = async (conversationId: string, content: string, type: Message['type'] = 'text') => {
    if (!profile?.id) return { error: 'Utilisateur non connecté' }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
          message_type: type,
          attachments: [],
          read_by: [profile.id]
        })
        .select(`
          *,
          sender:profiles!sender_id(full_name, avatar_url, email)
        `)
        .single()

      if (error) {
        console.error('Erreur envoi message:', error)
        return { error }
      }

      // Mettre à jour la conversation
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
    if (!profile?.id) return

    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.read_by.includes(profile.id)) return

      const updatedReadBy = [...message.read_by, profile.id]

      const { error } = await supabase
        .from('messages')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId)

      if (error) {
        console.error('Erreur marquage lu:', error)
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
          // Vérifier si le message appartient à une conversation de l'utilisateur
          const userConversations = conversations.map(c => c.id)
          if (userConversations.includes(newMessage.conversation_id)) {
            setMessages(current => [...current, newMessage])
          }
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
      // Ajouter l'utilisateur actuel aux participants
      const allParticipants = [...participants, profile.id]

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          organization_id: profile.organization_id,
          name,
          type,
          participants: allParticipants,
          created_by: profile.id
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur création conversation:', error)
        return { error }
      }

      setConversations([data, ...conversations])

      // Message système de création
      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_id: profile.id,
          content: `Conversation "${name}" créée`,
          message_type: 'system',
          read_by: [profile.id]
        })

      return { data }
    } catch (error) {
      console.error('Erreur:', error)
      return { error }
    }
  }

  const getUnreadCount = (conversationId: string) => {
    if (!profile?.id) return 0
    
    return messages.filter(m => 
      m.conversation_id === conversationId && 
      !m.read_by.includes(profile.id) &&
      m.sender_id !== profile.id
    ).length
  }

  const searchMessages = (query: string, conversationId?: string) => {
    let searchMessages = messages
    
    if (conversationId) {
      searchMessages = messages.filter(m => m.conversation_id === conversationId)
    }

    return searchMessages.filter(m =>
      m.content.toLowerCase().includes(query.toLowerCase())
    )
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
    searchMessages,
    refetch: fetchConversations,
  }
}