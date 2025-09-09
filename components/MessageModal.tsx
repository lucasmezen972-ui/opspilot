import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native'
import { X, Send, Users, Phone, Video } from 'lucide-react-native'

interface MessageModalProps {
  visible: boolean
  onClose: () => void
  conversationName: string
}

interface Message {
  id: number
  content: string
  timestamp: string
  isMe: boolean
  sender: string
}

export default function MessageModal({ visible, onClose, conversationName }: MessageModalProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: 'Bonjour l\'équipe ! Comment se passe la matinée ?',
      timestamp: '09:15',
      isMe: false,
      sender: 'Pierre Martin'
    },
    {
      id: 2,
      content: 'Ça va bien ! J\'ai terminé l\'audit du rayon frais, tout est conforme.',
      timestamp: '09:18',
      isMe: true,
      sender: 'Vous'
    },
    {
      id: 3,
      content: 'Super ! De mon côté, je m\'occupe de la formation du nouveau caissier.',
      timestamp: '09:20',
      isMe: false,
      sender: 'Jean Leroy'
    }
  ])
  const [sending, setSending] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return

    setSending(true)
    
    try {
      console.log('💬 Envoi message:', message.trim())
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMessage: Message = {
        id: Date.now(),
        content: message.trim(),
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        sender: 'Vous'
      }

      setMessages([...messages, newMessage])
      setMessage('')
      
      console.log('✅ Message envoyé')
      
      // Simuler une réponse automatique après quelques secondes
      setTimeout(() => {
        const autoReply: Message = {
          id: Date.now() + 1,
          content: 'Message reçu ! L\'équipe vous répondra bientôt.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          sender: 'Système'
        }
        setMessages(prev => [...prev, autoReply])
      }, 2000)
      
    } catch (error) {
      console.error('❌ Erreur envoi:', error)
      Alert.alert('Erreur', 'Impossible d\'envoyer le message')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  const startCall = (type: 'voice' | 'video') => {
    Alert.alert(
      'Appel',
      `Démarrer un appel ${type === 'voice' ? 'vocal' : 'vidéo'} avec ${conversationName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => Alert.alert('Info', 'Fonctionnalité d\'appel en développement.')
        }
      ]
    )
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.conversationInfo}>
              <Text style={styles.title}>{conversationName}</Text>
              <View style={styles.status}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>3 membres actifs</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => startCall('voice')}
              >
                <Phone size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => startCall('video')}
              >
                <Video size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.messagesContainer}>
            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageContainer,
                msg.isMe ? styles.messageContainerMe : styles.messageContainerOther
              ]}>
                <View style={[
                  styles.messageBubble,
                  msg.isMe ? styles.messageBubbleMe : styles.messageBubbleOther
                ]}>
                  {!msg.isMe && (
                    <Text style={styles.messageSender}>{msg.sender}</Text>
                  )}
                  <Text style={[
                    styles.messageContent,
                    msg.isMe ? styles.messageContentMe : styles.messageContentOther
                  ]}>{msg.content}</Text>
                  <Text style={[
                    styles.messageTimestamp,
                    msg.isMe ? styles.messageTimestampMe : styles.messageTimestampOther
                  ]}>{msg.timestamp}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Tapez votre message..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={!message.trim() || sending}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  conversationInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleMe: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageContentMe: {
    color: '#FFFFFF',
  },
  messageContentOther: {
    color: '#111827',
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimestampMe: {
    color: '#DBEAFE',
  },
  messageTimestampOther: {
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 20,
    gap: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})