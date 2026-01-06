import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject?: string;
  content: string;
  read_at?: string;
  archived?: boolean;
  trashed?: boolean;
  starred?: boolean;
  attachments?: string[];
  created: string;
  expand?: {
    sender?: { id: string; name: string; avatar: string; email: string };
    recipient?: { id: string; name: string; avatar: string; email: string };
  };
}

export interface Notification {
  id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link?: string;
  created: string;
}

export interface SocialPost {
    id: string;
    platform: 'Facebook' | 'Twitter' | 'Instagram' | 'LinkedIn';
    content: string;
    scheduled_for?: string;
    status: 'Draft' | 'Scheduled' | 'Published';
    image?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    user?: string;
}

export interface Conversation {
    id: string;
    participants: string[];
    lastMessage?: Message;
    unreadCount: number;
    created: string;
    updated: string;
}

const MOCK_USERS = [
    { id: 'user-1', name: 'John Doe', email: 'john@school.com', avatar: '' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@school.com', avatar: '' },
    { id: 'user-3', name: 'Bob Wilson', email: 'bob@school.com', avatar: '' }
];

const MOCK_MESSAGES: Message[] = [
    {
        id: 'msg-1',
        sender: 'user-2',
        recipient: 'user-1',
        subject: 'Welcome to the platform',
        content: 'Hi! Welcome to Grow Your Need. Let me know if you have any questions.',
        read_at: undefined,
        archived: false,
        trashed: false,
        starred: false,
        created: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        expand: {
            sender: MOCK_USERS[1],
            recipient: MOCK_USERS[0]
        }
    },
    {
        id: 'msg-2',
        sender: 'user-3',
        recipient: 'user-1',
        subject: 'Course materials ready',
        content: 'The course materials for next week are now available.',
        read_at: new Date().toISOString(),
        archived: false,
        trashed: false,
        starred: true,
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expand: {
            sender: MOCK_USERS[2],
            recipient: MOCK_USERS[0]
        }
    },
    {
        id: 'msg-3',
        sender: 'user-1',
        recipient: 'user-2',
        subject: 'Re: Welcome to the platform',
        content: 'Thank you! I\'m excited to be here.',
        read_at: new Date().toISOString(),
        archived: false,
        trashed: false,
        starred: false,
        created: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        expand: {
            sender: MOCK_USERS[0],
            recipient: MOCK_USERS[1]
        }
    }
];

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        user: 'user-1',
        title: 'New Assignment',
        message: 'You have a new assignment due next week.',
        type: 'info',
        is_read: false,
        link: '/student/assignments',
        created: new Date().toISOString()
    },
    {
        id: 'notif-2',
        user: 'user-1',
        title: 'Grade Posted',
        message: 'Your grade for Math Quiz 1 has been posted.',
        type: 'success',
        is_read: true,
        link: '/student/grades',
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_SOCIAL_POSTS: SocialPost[] = [
    {
        id: 'social-1',
        platform: 'Twitter',
        content: 'Excited to announce our new learning features! #EdTech #Learning',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'Scheduled',
        likes: 0,
        comments: 0,
        shares: 0
    },
    {
        id: 'social-2',
        platform: 'LinkedIn',
        content: 'Check out how our platform is helping students succeed.',
        status: 'Published',
        likes: 45,
        comments: 12,
        shares: 8
    }
];

export const communicationService = {
  // Messages
  async getMessages(userId: string, type: 'inbox' | 'sent' | 'archived' | 'starred' | 'trash' = 'inbox') {
    if (isMockEnv()) {
      let filtered = MOCK_MESSAGES;
      if (type === 'inbox') {
        filtered = MOCK_MESSAGES.filter(m => m.recipient === userId && !m.archived && !m.trashed);
      } else if (type === 'sent') {
        filtered = MOCK_MESSAGES.filter(m => m.sender === userId && !m.trashed);
      } else if (type === 'archived') {
        filtered = MOCK_MESSAGES.filter(m => (m.recipient === userId || m.sender === userId) && m.archived);
      } else if (type === 'starred') {
        filtered = MOCK_MESSAGES.filter(m => (m.recipient === userId || m.sender === userId) && m.starred);
      } else if (type === 'trash') {
        filtered = MOCK_MESSAGES.filter(m => (m.recipient === userId || m.sender === userId) && m.trashed);
      }
      return { items: filtered, totalItems: filtered.length, totalPages: 1, page: 1, perPage: 50 };
    }

    try {
      let filter = '';
      if (type === 'inbox') {
          filter = `recipient = "${userId}" && (archived = false && trashed = false)`;
      } else if (type === 'sent') {
          filter = `sender = "${userId}" && trashed = false`;
      } else if (type === 'archived') {
          filter = `(recipient = "${userId}" || sender = "${userId}") && archived = true`;
      } else if (type === 'starred') {
          filter = `(recipient = "${userId}" || sender = "${userId}") && starred = true`;
      } else if (type === 'trash') {
          filter = `(recipient = "${userId}" || sender = "${userId}") && trashed = true`;
      }
        
      return await pb.collection('messages').getList<Message>(1, 50, {
        filter,
        sort: '-created',
        expand: 'sender,recipient',
        requestKey: null // Disable auto-cancellation
      });
    } catch (error) {
      console.warn('Failed to fetch messages:', error);
      return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 50 };
    }
  },

  async getMessage(id: string): Promise<Message | null> {
    if (isMockEnv()) {
      return MOCK_MESSAGES.find(m => m.id === id) || null;
    }

    try {
      return await pb.collection('messages').getOne<Message>(id, {
        expand: 'sender,recipient'
      });
    } catch (error) {
      console.warn('Failed to fetch message:', error);
      return null;
    }
  },

  async sendMessage(data: Partial<Message>) {
    if (isMockEnv()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: data.sender || '',
        recipient: data.recipient || '',
        subject: data.subject,
        content: data.content || '',
        archived: false,
        trashed: false,
        starred: false,
        created: new Date().toISOString(),
        expand: {
          sender: MOCK_USERS.find(u => u.id === data.sender),
          recipient: MOCK_USERS.find(u => u.id === data.recipient)
        }
      };
      MOCK_MESSAGES.unshift(newMessage);
      return newMessage;
    }

    try {
      return await pb.collection('messages').create<Message>(data);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  async markMessageRead(id: string) {
    if (isMockEnv()) {
      const msg = MOCK_MESSAGES.find(m => m.id === id);
      if (msg) {
        msg.read_at = new Date().toISOString();
      }
      return msg || null;
    }

    try {
      return await pb.collection('messages').update<Message>(id, {
        read_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to mark message as read:', error);
      return null;
    }
  },

  async toggleStarred(id: string) {
    if (isMockEnv()) {
      const msg = MOCK_MESSAGES.find(m => m.id === id);
      if (msg) {
        msg.starred = !msg.starred;
      }
      return msg || null;
    }

    try {
      const message = await pb.collection('messages').getOne<Message>(id);
      return await pb.collection('messages').update<Message>(id, {
        starred: !message.starred
      });
    } catch (error) {
      console.warn('Failed to toggle starred:', error);
      return null;
    }
  },

  async archiveMessage(id: string) {
    if (isMockEnv()) {
      const msg = MOCK_MESSAGES.find(m => m.id === id);
      if (msg) {
        msg.archived = true;
      }
      return msg || null;
    }

    try {
      return await pb.collection('messages').update<Message>(id, {
        archived: true
      });
    } catch (error) {
      console.warn('Failed to archive message:', error);
      return null;
    }
  },

  async trashMessage(id: string) {
    if (isMockEnv()) {
      const msg = MOCK_MESSAGES.find(m => m.id === id);
      if (msg) {
        msg.trashed = true;
      }
      return msg || null;
    }

    try {
      return await pb.collection('messages').update<Message>(id, {
        trashed: true
      });
    } catch (error) {
      console.warn('Failed to trash message:', error);
      return null;
    }
  },

  async restoreMessage(id: string) {
    if (isMockEnv()) {
      const msg = MOCK_MESSAGES.find(m => m.id === id);
      if (msg) {
        msg.trashed = false;
        msg.archived = false;
      }
      return msg || null;
    }

    try {
      return await pb.collection('messages').update<Message>(id, {
        trashed: false,
        archived: false
      });
    } catch (error) {
      console.warn('Failed to restore message:', error);
      return null;
    }
  },

  async deleteMessagePermanently(id: string) {
    if (isMockEnv()) {
      const index = MOCK_MESSAGES.findIndex(m => m.id === id);
      if (index !== -1) {
        MOCK_MESSAGES.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('messages').delete(id);
      return true;
    } catch (error) {
      console.warn('Failed to delete message:', error);
      return false;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (isMockEnv()) {
      return MOCK_MESSAGES.filter(m => m.recipient === userId && !m.read_at && !m.trashed).length;
    }

    try {
      const result = await pb.collection('messages').getList(1, 1, {
        filter: `recipient = "${userId}" && read_at = "" && trashed = false`
      });
      return result.totalItems;
    } catch (error) {
      console.warn('Failed to get unread count:', error);
      return 0;
    }
  },

  async searchUsers(query: string) {
    if (isMockEnv()) {
      const lowerQuery = query.toLowerCase();
      const filtered = MOCK_USERS.filter(u => 
        u.name.toLowerCase().includes(lowerQuery) || 
        u.email.toLowerCase().includes(lowerQuery)
      );
      return { items: filtered };
    }

    try {
        return await pb.collection('users').getList(1, 10, {
            filter: `name ~ "${query}" || email ~ "${query}"`,
            requestKey: null
        });
    } catch (error) {
        console.error('Failed to search users:', error);
        return { items: [] };
    }
  },

  async findUserByEmail(email: string) {
    if (isMockEnv()) {
      return MOCK_USERS.find(u => u.email === email) || null;
    }

    try {
        return await pb.collection('users').getFirstListItem(`email = "${email}"`);
    } catch (error) {
        console.error('Failed to find user by email:', error);
        throw error;
    }
  },

  // Notifications
  async getNotifications(userId: string) {
    if (isMockEnv()) {
      const filtered = MOCK_NOTIFICATIONS.filter(n => n.user === userId);
      return { items: filtered, totalItems: filtered.length, totalPages: 1, page: 1, perPage: 20 };
    }

    try {
      return await pb.collection('notifications').getList<Notification>(1, 20, {
        filter: `user = "${userId}"`,
        sort: '-created',
      });
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
      return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 20 };
    }
  },

  async createNotification(data: Partial<Notification>): Promise<Notification | null> {
    if (isMockEnv()) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        user: data.user || '',
        title: data.title || '',
        message: data.message || '',
        type: data.type || 'info',
        is_read: false,
        link: data.link,
        created: new Date().toISOString()
      };
      MOCK_NOTIFICATIONS.unshift(newNotif);
      return newNotif;
    }

    try {
      return await pb.collection('notifications').create<Notification>(data);
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  },

  async markNotificationRead(id: string) {
    if (isMockEnv()) {
      const notif = MOCK_NOTIFICATIONS.find(n => n.id === id);
      if (notif) {
        notif.is_read = true;
      }
      return notif || null;
    }

    try {
      return await pb.collection('notifications').update<Notification>(id, {
        is_read: true,
      });
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
      return null;
    }
  },

  async markAllNotificationsRead(userId: string) {
    if (isMockEnv()) {
      MOCK_NOTIFICATIONS.filter(n => n.user === userId).forEach(n => {
        n.is_read = true;
      });
      return;
    }

    try {
      // Note: PocketBase doesn't support bulk update via API easily without custom endpoint or loop
      // For now, we'll fetch unread and update them (limit to recent)
      const unread = await pb.collection('notifications').getFullList({
        filter: `user = "${userId}" && is_read = false`,
      });
      
      await Promise.all(unread.map(n => 
        pb.collection('notifications').update(n.id, { is_read: true })
      ));
    } catch (error) {
      console.warn('Failed to mark all notifications as read:', error);
    }
  },

  async deleteNotification(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
      if (index !== -1) {
        MOCK_NOTIFICATIONS.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('notifications').delete(id);
      return true;
    } catch (error) {
      console.warn('Failed to delete notification:', error);
      return false;
    }
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (isMockEnv()) {
      return MOCK_NOTIFICATIONS.filter(n => n.user === userId && !n.is_read).length;
    }

    try {
      const result = await pb.collection('notifications').getList(1, 1, {
        filter: `user = "${userId}" && is_read = false`
      });
      return result.totalItems;
    } catch (error) {
      console.warn('Failed to get unread notification count:', error);
      return 0;
    }
  },

  // Social Media
  async getSocialPosts(userId?: string) {
    if (isMockEnv()) {
      const filtered = userId 
        ? MOCK_SOCIAL_POSTS.filter(p => p.user === userId)
        : MOCK_SOCIAL_POSTS;
      return { items: filtered, totalItems: filtered.length, totalPages: 1, page: 1, perPage: 50 };
    }

    try {
      return await pb.collection('social_posts').getList<SocialPost>(1, 50, {
          filter: userId ? `user = "${userId}"` : '',
          sort: '-scheduled_for'
      });
    } catch (error) {
      console.warn('Failed to fetch social posts:', error);
      return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 50 };
    }
  },

  async getSocialPost(id: string): Promise<SocialPost | null> {
    if (isMockEnv()) {
      return MOCK_SOCIAL_POSTS.find(p => p.id === id) || null;
    }

    try {
      return await pb.collection('social_posts').getOne<SocialPost>(id);
    } catch (error) {
      console.warn('Failed to fetch social post:', error);
      return null;
    }
  },

  async createSocialPost(data: Partial<SocialPost>) {
    if (isMockEnv()) {
      const newPost: SocialPost = {
        id: `social-${Date.now()}`,
        platform: data.platform || 'Twitter',
        content: data.content || '',
        scheduled_for: data.scheduled_for,
        status: data.status || 'Draft',
        image: data.image,
        likes: 0,
        comments: 0,
        shares: 0,
        user: data.user
      };
      MOCK_SOCIAL_POSTS.unshift(newPost);
      return newPost;
    }

    try {
      return await pb.collection('social_posts').create(data);
    } catch (error) {
      console.error('Failed to create social post:', error);
      throw error;
    }
  },

  async updateSocialPost(id: string, data: Partial<SocialPost>): Promise<SocialPost | null> {
    if (isMockEnv()) {
      const post = MOCK_SOCIAL_POSTS.find(p => p.id === id);
      if (post) {
        Object.assign(post, data);
      }
      return post || null;
    }

    try {
      return await pb.collection('social_posts').update<SocialPost>(id, data);
    } catch (error) {
      console.error('Failed to update social post:', error);
      return null;
    }
  },

  async deleteSocialPost(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_SOCIAL_POSTS.findIndex(p => p.id === id);
      if (index !== -1) {
        MOCK_SOCIAL_POSTS.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('social_posts').delete(id);
      return true;
    } catch (error) {
      console.error('Failed to delete social post:', error);
      return false;
    }
  },

  async publishSocialPost(id: string): Promise<SocialPost | null> {
    return this.updateSocialPost(id, { 
      status: 'Published' 
    });
  },

  async scheduleSocialPost(id: string, scheduledFor: string): Promise<SocialPost | null> {
    return this.updateSocialPost(id, { 
      status: 'Scheduled',
      scheduled_for: scheduledFor
    });
  },

  // Statistics
  async getMessageStats(userId: string): Promise<{
    inbox: number;
    sent: number;
    unread: number;
    starred: number;
    archived: number;
  }> {
    if (isMockEnv()) {
      return {
        inbox: MOCK_MESSAGES.filter(m => m.recipient === userId && !m.archived && !m.trashed).length,
        sent: MOCK_MESSAGES.filter(m => m.sender === userId && !m.trashed).length,
        unread: MOCK_MESSAGES.filter(m => m.recipient === userId && !m.read_at && !m.trashed).length,
        starred: MOCK_MESSAGES.filter(m => (m.recipient === userId || m.sender === userId) && m.starred).length,
        archived: MOCK_MESSAGES.filter(m => (m.recipient === userId || m.sender === userId) && m.archived).length
      };
    }

    const [inbox, sent, unread, starred, archived] = await Promise.all([
      pb.collection('messages').getList(1, 1, { filter: `recipient = "${userId}" && archived = false && trashed = false` }),
      pb.collection('messages').getList(1, 1, { filter: `sender = "${userId}" && trashed = false` }),
      pb.collection('messages').getList(1, 1, { filter: `recipient = "${userId}" && read_at = "" && trashed = false` }),
      pb.collection('messages').getList(1, 1, { filter: `(recipient = "${userId}" || sender = "${userId}") && starred = true` }),
      pb.collection('messages').getList(1, 1, { filter: `(recipient = "${userId}" || sender = "${userId}") && archived = true` })
    ]);

    return {
      inbox: inbox.totalItems,
      sent: sent.totalItems,
      unread: unread.totalItems,
      starred: starred.totalItems,
      archived: archived.totalItems
    };
  }
};
