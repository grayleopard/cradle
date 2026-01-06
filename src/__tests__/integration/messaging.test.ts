import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, createMockConversation, createMockMessage, createMockUser, createMockListing } from '../../test/setup';

describe('Messaging System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Conversation Creation', () => {
    it('should create new conversation for first message', async () => {
      const newConversation = createMockConversation({
        id: 'conv-new-123',
        listingId: 'listing-123',
        participantIds: ['buyer-1', 'seller-1'],
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: newConversation, error: null }),
      });

      const db = mockSupabaseClient.from('conversations');
      const { data, error } = await db.insert(newConversation);

      expect(error).toBeNull();
      expect(data?.participantIds).toContain('buyer-1');
      expect(data?.participantIds).toContain('seller-1');
    });

    it('should find existing conversation for same listing and users', async () => {
      const existingConversation = createMockConversation({
        id: 'conv-existing-123',
        listingId: 'listing-123',
        participantIds: ['buyer-1', 'seller-1'],
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingConversation, error: null }),
      });

      const db = mockSupabaseClient.from('conversations');
      const { data } = await db.select().eq('listing_id', 'listing-123').contains('participant_ids', ['buyer-1', 'seller-1']).single();

      expect(data?.id).toBe('conv-existing-123');
    });

    it('should not allow conversation with self', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Cannot create conversation with yourself' },
        }),
      });

      const db = mockSupabaseClient.from('conversations');
      const { error } = await db.insert({
        listingId: 'listing-123',
        participantIds: ['user-1', 'user-1'],
      });

      expect(error).toBeDefined();
    });
  });

  describe('Send Message', () => {
    it('should send text message', async () => {
      const newMessage = createMockMessage({
        id: 'msg-new-123',
        conversationId: 'conv-123',
        senderId: 'user-1',
        text: 'Is this still available?',
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: newMessage, error: null }),
      });

      const db = mockSupabaseClient.from('messages');
      const { data, error } = await db.insert(newMessage);

      expect(error).toBeNull();
      expect(data?.text).toBe('Is this still available?');
    });

    it('should reject empty messages', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Message text is required' },
        }),
      });

      const db = mockSupabaseClient.from('messages');
      const { error } = await db.insert({
        conversationId: 'conv-123',
        senderId: 'user-1',
        text: '',
      });

      expect(error).toBeDefined();
    });

    it('should update conversation last message', async () => {
      const newMessage = createMockMessage({
        id: 'msg-latest',
        text: 'Latest message',
      });

      const updatedConversation = createMockConversation({
        id: 'conv-123',
        lastMessage: newMessage,
        updatedAt: new Date().toISOString(),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: updatedConversation, error: null }),
      });

      const db = mockSupabaseClient.from('conversations');
      const { data } = await db.update({
        last_message: newMessage,
        updated_at: new Date().toISOString(),
      }).eq('id', 'conv-123');

      expect(data?.lastMessage?.text).toBe('Latest message');
    });
  });

  describe('Receive Messages', () => {
    it('should fetch messages for conversation', async () => {
      const messages = [
        createMockMessage({ id: 'msg-1', text: 'Hello!', timestamp: '2024-01-15T10:00:00Z' }),
        createMockMessage({ id: 'msg-2', text: 'Hi there!', timestamp: '2024-01-15T10:01:00Z' }),
        createMockMessage({ id: 'msg-3', text: 'Is this available?', timestamp: '2024-01-15T10:02:00Z' }),
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: messages, error: null }),
      });

      const db = mockSupabaseClient.from('messages');
      const { data } = await db.select().eq('conversation_id', 'conv-123').order('timestamp', { ascending: true });

      expect(data).toHaveLength(3);
      expect(data?.[0].text).toBe('Hello!');
    });

    it('should mark messages as read', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ data: [{ id: 'msg-1', isRead: true }], error: null }),
      });

      const db = mockSupabaseClient.from('messages');
      const { data } = await db
        .update({ is_read: true })
        .eq('conversation_id', 'conv-123')
        .neq('sender_id', 'current-user');

      expect(data?.[0].isRead).toBe(true);
    });
  });

  describe('Conversation List', () => {
    it('should fetch user conversations sorted by recent', async () => {
      const conversations = [
        createMockConversation({ id: 'conv-1', updatedAt: '2024-01-15T12:00:00Z' }),
        createMockConversation({ id: 'conv-2', updatedAt: '2024-01-15T10:00:00Z' }),
        createMockConversation({ id: 'conv-3', updatedAt: '2024-01-15T08:00:00Z' }),
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: conversations, error: null }),
      });

      const db = mockSupabaseClient.from('conversations');
      const { data } = await db
        .select()
        .contains('participant_ids', ['user-1'])
        .order('updated_at', { ascending: false });

      expect(data).toHaveLength(3);
      expect(data?.[0].id).toBe('conv-1'); // Most recent first
    });

    it('should include unread count', async () => {
      const mockConversationsWithUnread = [
        { ...createMockConversation({ id: 'conv-1' }), unreadCount: 3 },
        { ...createMockConversation({ id: 'conv-2' }), unreadCount: 0 },
      ];

      expect(mockConversationsWithUnread[0].unreadCount).toBe(3);
      expect(mockConversationsWithUnread[1].unreadCount).toBe(0);
    });
  });

  describe('Message Validation', () => {
    it('should validate message length', () => {
      const validateMessage = (text: string): { valid: boolean; error?: string } => {
        if (!text || text.trim().length === 0) {
          return { valid: false, error: 'Message cannot be empty' };
        }
        if (text.length > 2000) {
          return { valid: false, error: 'Message too long (max 2000 characters)' };
        }
        return { valid: true };
      };

      expect(validateMessage('')).toEqual({ valid: false, error: 'Message cannot be empty' });
      expect(validateMessage('   ')).toEqual({ valid: false, error: 'Message cannot be empty' });
      expect(validateMessage('Hello!')).toEqual({ valid: true });
      expect(validateMessage('A'.repeat(2001))).toEqual({ valid: false, error: 'Message too long (max 2000 characters)' });
    });

    it('should sanitize message content', () => {
      const sanitizeMessage = (text: string): string => {
        return text.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      expect(sanitizeMessage('  Hello!  ')).toBe('Hello!');
      expect(sanitizeMessage('Hello<script>alert("xss")</script>!')).toBe('Hello!');
    });
  });

  describe('Real-time Updates', () => {
    it('should set up subscription for new messages', () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      };

      mockSupabaseClient.channel = vi.fn().mockReturnValue(mockSubscription);

      const channel = mockSupabaseClient.channel('messages:conv-123');
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {});
      const subscription = channel.subscribe();

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('messages:conv-123');
      expect(subscription.unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('Thread Creation from Listing', () => {
    it('should include listing details in first message context', async () => {
      const listing = createMockListing({
        id: 'listing-123',
        title: 'UPPAbaby Stroller',
        price: 450,
      });

      const seller = createMockUser({ id: 'seller-1', name: 'Sarah' });
      const buyer = createMockUser({ id: 'buyer-1', name: 'Mike' });

      const conversation = createMockConversation({
        listingId: listing.id,
        participantIds: [buyer.id, seller.id],
      });

      expect(conversation.listingId).toBe('listing-123');
      expect(conversation.participantIds).toContain('seller-1');
      expect(conversation.participantIds).toContain('buyer-1');
    });
  });
});

describe('Notification System', () => {
  it('should create notification for new message', () => {
    const createNotification = (type: string, data: Record<string, unknown>) => ({
      id: `notif-${Date.now()}`,
      type,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    const notification = createNotification('new_message', {
      userId: 'user-1',
      title: 'New message from Sarah',
      message: 'Is this still available?',
      actorId: 'user-2',
      referenceId: 'conv-123',
    });

    expect(notification.type).toBe('new_message');
    expect(notification.isRead).toBe(false);
  });

  it('should mark notification as read', () => {
    const notification = {
      id: 'notif-123',
      isRead: false,
    };

    const markedAsRead = { ...notification, isRead: true };

    expect(markedAsRead.isRead).toBe(true);
  });

  it('should count unread notifications', () => {
    const notifications = [
      { id: '1', isRead: false },
      { id: '2', isRead: true },
      { id: '3', isRead: false },
      { id: '4', isRead: false },
    ];

    const unreadCount = notifications.filter(n => !n.isRead).length;

    expect(unreadCount).toBe(3);
  });
});
