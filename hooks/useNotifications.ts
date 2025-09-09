import { useEffect, useState } from 'react'
import { supabase, type Notification } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications()
      setupRealtimeSubscription()
    }
  }, [profile])

  const fetchNotifications = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      setError(null)
      console.log('🔔 Récupération notifications...')
      
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        // Si la table n'existe pas, utiliser les données de démo
        if (fetchError.code === 'PGRST205') {
          console.log('ℹ️ Table notifications pas encore créée, utilisation démo')
          const demoNotifications = generateDemoNotifications()
          setNotifications(demoNotifications)
          setUnreadCount(demoNotifications.filter(n => !n.is_read).length)
          setLoading(false)
          return
        }
        console.error('❌ Erreur récupération notifications:', fetchError)
        setError(fetchError.message)
        
        // Utiliser des notifications de démo en cas d'erreur
        const demoNotifications = generateDemoNotifications()
        setNotifications(demoNotifications)
        setUnreadCount(demoNotifications.filter(n => !n.is_read).length)
        return
      }

      console.log('✅ Notifications récupérées:', data?.length || 0)
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error: any) {
      console.error('❌ Erreur inattendue notifications:', error)
      setError(error.message || 'Erreur inattendue')
      
      // Utiliser des notifications de démo
      const demoNotifications = generateDemoNotifications()
      setNotifications(demoNotifications)
      setUnreadCount(demoNotifications.filter(n => !n.is_read).length)
    } finally {
      setLoading(false)
    }
  }

  const generateDemoNotifications = (): Notification[] => {
    const now = new Date()
    return [
      {
        id: 'notif-1',
        organization_id: profile?.organization_id || '',
        user_id: profile?.id || '',
        title: 'Nouvel audit assigné',
        content: 'Un audit "Contrôle rayon frais" vous a été assigné pour demain matin.',
        notification_type: 'info' as const,
        action_url: '/audits',
        data: {},
        is_read: false,
        is_push_sent: false,
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        organization_id: profile?.organization_id || '',
        user_id: profile?.id || '',
        title: 'Formation complétée',
        content: 'Félicitations ! Vous avez terminé la formation "Accueil client".',
        notification_type: 'success' as const,
        action_url: '/training',
        data: {},
        is_read: false,
        is_push_sent: false,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-3',
        organization_id: profile?.organization_id || '',
        user_id: profile?.id || '',
        title: 'Stock faible détecté',
        content: '3 produits sont en rupture de stock dans votre rayon.',
        notification_type: 'warning' as const,
        action_url: '/products',
        data: {},
        is_read: true,
        is_push_sent: true,
        created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-4',
        organization_id: profile?.organization_id || '',
        user_id: profile?.id || '',
        title: 'Nouveau message',
        content: 'Pierre Martin vous a envoyé un message dans le chat équipe.',
        notification_type: 'info' as const,
        action_url: '/chat',
        data: {},
        is_read: true,
        is_push_sent: true,
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
      }
    ]
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Pour la démo, marquer localement
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))

      // Essayer de marquer en base
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.log('ℹ️ Notification marquée localement (base non disponible)')
      }
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!profile?.id) return

    try {
      // Marquer localement
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

      // Essayer en base
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)

      if (error) {
        console.log('ℹ️ Notifications marquées localement (base non disponible)')
      }
    } catch (error) {
      console.error('❌ Erreur marquage toutes notifications:', error)
    }
  }

  const createNotification = async (
    title: string, 
    content: string, 
    type: Notification['notification_type'] = 'info',
    userId?: string,
    actionUrl?: string,
    data?: Record<string, any>
  ) => {
    if (!profile?.organization_id) return { error: 'Organisation non définie' }

    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          organization_id: profile.organization_id,
          user_id: userId || profile.id,
          title,
          content,
          notification_type: type,
          action_url: actionUrl,
          data: data || {}
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur création notification:', error)
        return { error: error.message }
      }

      console.log('✅ Notification créée:', notification)
      return { data: notification }
    } catch (error: any) {
      console.error('❌ Erreur inattendue création notification:', error)
      return { error: error.message || 'Erreur inattendue' }
    }
  }

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(current => [newNotification, ...current])
          setUnreadCount(current => current + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(current => 
            current.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      
      if (notification && !notification.is_read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }

      // Essayer de supprimer en base
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        console.log('ℹ️ Notification supprimée localement (base non disponible)')
      }
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    refetch: fetchNotifications,
  }
}