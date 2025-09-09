import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native'
import { Bell, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Info, Zap } from 'lucide-react-native'
import { useNotifications } from '../hooks/useNotifications'

interface NotificationCenterProps {
  visible: boolean
  onClose: () => void
}

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertTriangle
      case 'info': 
      default: return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10B981'
      case 'warning': return '#F59E0B'
      case 'error': return '#EF4444'
      case 'info':
      default: return '#2563EB'
    }
  }

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    // Navigation vers l'URL d'action si disponible
    if (notification.action_url) {
      console.log('Navigate to:', notification.action_url)
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Bell size={24} color="#111827" />
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <CheckCircle size={16} color="#2563EB" />
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          )}

          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Aucune notification</Text>
                <Text style={styles.emptySubtitle}>Vous êtes à jour !</Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)
                
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.is_read && styles.notificationItemUnread
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}20` }]}>
                      <IconComponent size={16} color={iconColor} />
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.is_read && styles.notificationTitleUnread
                      ]}>
                        {notification.title}
                      </Text>
                      
                      {notification.content && (
                        <Text style={styles.notificationText}>
                          {notification.content}
                        </Text>
                      )}
                      
                      <Text style={styles.notificationTime}>
                        {new Date(notification.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    {!notification.is_read && (
                      <View style={styles.unreadIndicator} />
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <X size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  markAllText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  notificationsList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationItemUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#2563EB',
    borderLeftWidth: 4,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
})