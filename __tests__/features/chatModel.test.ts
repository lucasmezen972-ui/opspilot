import { describe, it, expect } from 'vitest';

import {
  buildConversations,
  buildAssistantHistory,
  toDisplayMessages,
  type DisplayMessage,
} from '../../features/chat/chatModel';
import type { Conversation, Message } from '../../lib/supabase';

function conversation(partial: Partial<Conversation>): Conversation {
  return {
    id: 'c',
    organization_id: 'org',
    name: 'Conversation',
    type: 'group',
    participants: [],
    last_message_at: '2026-06-13T10:00:00Z',
    created_at: '2026-06-13T09:00:00Z',
    ...partial,
  };
}

function message(partial: Partial<Message>): Message {
  return {
    id: 'm',
    conversation_id: 'c1',
    sender_id: 'u1',
    content: 'Bonjour',
    message_type: 'text',
    attachments: [],
    read_by: [],
    created_at: '2026-06-13T10:00:00Z',
    ...partial,
  };
}

describe('buildConversations', () => {
  it('ajoute un repli démo quand il n’y a aucune conversation', () => {
    const result = buildConversations([], () => 0, true);
    expect(result.map((c) => c.id)).toEqual(['demo-team', 'demo-ai']);
  });

  it('masque l’assistant IA lorsqu’il est désactivé', () => {
    const result = buildConversations([], () => 0, false);
    expect(result.map((c) => c.id)).toEqual(['demo-team']);
  });

  it('utilise les conversations réelles et leur compteur de non-lus', () => {
    const result = buildConversations(
      [conversation({ id: 'real-1', name: 'Équipe' })],
      (id) => (id === 'real-1' ? 3 : 0),
      true,
    );
    expect(result[0]?.id).toBe('real-1');
    expect(result[0]?.unread).toBe(3);
    expect(result.at(-1)?.id).toBe('demo-ai');
  });
});

describe('toDisplayMessages', () => {
  it('marque les messages de l’utilisateur courant', () => {
    const result = toDisplayMessages(
      [
        message({ id: 'm1', sender_id: 'me', content: 'A' }),
        message({ id: 'm2', sender_id: 'other', content: 'B' }),
      ],
      'me',
    );
    expect(result[0]?.isMe).toBe(true);
    expect(result[1]?.isMe).toBe(false);
  });
});

describe('buildAssistantHistory', () => {
  it('reprend les échanges IA et ajoute le nouveau message utilisateur', () => {
    const locals: DisplayMessage[] = [
      {
        id: '1',
        conversationId: 'demo-ai',
        sender: 'Vous',
        content: 'Salut',
        timestamp: '10:00',
        isMe: true,
      },
      {
        id: '2',
        conversationId: 'demo-ai',
        sender: 'IA',
        content: 'Bonjour',
        timestamp: '10:01',
        isMe: false,
      },
      {
        id: '3',
        conversationId: 'demo-team',
        sender: 'Vous',
        content: 'ignoré',
        timestamp: '10:02',
        isMe: true,
      },
    ];
    const history = buildAssistantHistory(locals, 'Et maintenant ?');
    expect(history).toEqual([
      { role: 'user', content: 'Salut' },
      { role: 'assistant', content: 'Bonjour' },
      { role: 'user', content: 'Et maintenant ?' },
    ]);
  });
});
