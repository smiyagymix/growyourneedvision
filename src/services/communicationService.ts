import pb from '../lib/pocketbase';

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

export const communicationService = {
  // Messages
  async getMessages(userId: string, type: 'inbox' | 'sent' | 'archived' | 'starred' | 'trash' = 'inbox') {
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
        requestKey: null
      });
    } catch (error) {
      console.warn('Failed to fetch messages:', error);
      return { items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 50 };
    }
  },

  async getMessage(id: string): Promise<Message | null> {
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
    try {
      return await pb.collection('messages').create<Message>(data);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  async markMessageRead(id: string) {
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
    try {
      await pb.collection('messages').delete(id);
      return true;
    } catch (error) {
      console.warn('Failed to delete message:', error);
      return false;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
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
    try {
        return await pb.collection('users').getFirstListItem(`email = "${email}"`);
    } catch (error) {
        console.error('Failed to find user by email:', error);
        throw error;
    }
  },

  // Notifications
  async getNotifications(userId: string) {
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
    try {
      return await pb.collection('notifications').create<Notification>(data);
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  },

  async markNotificationRead(id: string) {
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
    try {
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
    try {
      await pb.collection('notifications').delete(id);
      return true;
    } catch (error) {
      console.warn('Failed to delete notification:', error);
      return false;
    }
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
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
    try {
      return await pb.collection('social_posts').getOne<SocialPost>(id);
    } catch (error) {
      console.warn('Failed to fetch social post:', error);
      return null;
    }
  },

  async createSocialPost(data: Partial<SocialPost>) {
    try {
      return await pb.collection('social_posts').create(data);
    } catch (error) {
      console.error('Failed to create social post:', error);
      throw error;
    }
  },

  async updateSocialPost(id: string, data: Partial<SocialPost>): Promise<SocialPost | null> {
    try {
      return await pb.collection('social_posts').update<SocialPost>(id, data);
    } catch (error) {
      console.error('Failed to update social post:', error);
      return null;
    }
  },

  async deleteSocialPost(id: string): Promise<boolean> {
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
    try {
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
    } catch (error) {
      console.warn('Failed to fetch message stats:', error);
      return {
        inbox: 0,
        sent: 0,
        unread: 0,
        starred: 0,
        archived: 0
      };
    }
  }
};
