import type { AssistantHistoryMessage } from './assistant';
import type { Conversation, Message } from '../../lib/supabase';

export interface DisplayMessage {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatConversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  type: string;
  online: boolean;
}

/** Conversation Supabase enrichie des derniers messages joints (select). */
type ConversationWithMessages = Conversation & {
  messages?: { content: string; created_at: string }[];
};

/** Message Supabase enrichi du profil expéditeur joint (select). */
type MessageWithProfile = Message & {
  profiles?: { full_name?: string | null } | null;
};

const HHMM: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

/** Heure courte « 14:05 » à partir d'une date ISO. */
export function formatTime(iso: string | number | Date): string {
  return new Date(iso).toLocaleTimeString('fr-FR', HHMM);
}

/** Convertit les messages Supabase en messages d'affichage. */
export function toDisplayMessages(
  dbMessages: Message[],
  profileId?: string,
): DisplayMessage[] {
  return dbMessages.map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    sender: (m as MessageWithProfile).profiles?.full_name ?? 'Utilisateur',
    content: m.content,
    timestamp: formatTime(m.created_at),
    isMe: m.sender_id === profileId,
  }));
}

/**
 * Construit la liste des conversations affichées : conversations réelles
 * (ou repli démo « Équipe Magasin » si aucune), suivies de l'assistant IA
 * lorsqu'il est activé au back-office.
 */
export function buildConversations(
  dbConversations: Conversation[],
  getUnreadCount: (id: string) => number,
  aiEnabled: boolean,
): ChatConversation[] {
  const remote: ChatConversation[] = dbConversations.map((c) => {
    const joined = (c as ConversationWithMessages).messages ?? [];
    const lastMessage =
      joined.length > 0
        ? [...joined].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0]!.content
        : 'Aucun message';
    return {
      id: c.id,
      name: c.name,
      lastMessage,
      timestamp: formatTime(c.last_message_at),
      unread: getUnreadCount(c.id),
      type: c.type,
      online: true,
    };
  });

  const base: ChatConversation[] =
    remote.length > 0
      ? remote
      : [
          {
            id: 'demo-team',
            name: 'Équipe Magasin',
            lastMessage: 'Bienvenue dans OpsPilot !',
            timestamp: 'Maintenant',
            unread: 0,
            type: 'group',
            online: true,
          },
        ];

  const withAi: ChatConversation[] = [
    ...base,
    {
      id: 'demo-ai',
      name: 'Assistant IA OpsPilot',
      lastMessage: 'Posez une question sur vos priorités opérationnelles.',
      timestamp: 'Maintenant',
      unread: 0,
      type: 'support',
      online: true,
    },
  ];

  return withAi.filter((c) => c.id !== 'demo-ai' || aiEnabled);
}

/** Historique (12 derniers tours) envoyé à l'assistant IA. */
export function buildAssistantHistory(
  localMessages: DisplayMessage[],
  content: string,
): AssistantHistoryMessage[] {
  const previous = localMessages
    .filter((message) => message.conversationId === 'demo-ai')
    .map<AssistantHistoryMessage>((message) => ({
      role: message.isMe ? 'user' : 'assistant',
      content: message.content,
    }));
  const current: AssistantHistoryMessage = { role: 'user', content };
  return [...previous, current].slice(-12);
}
