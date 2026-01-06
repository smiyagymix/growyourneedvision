import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  requester: string;
  assigned_to?: string;
  created: string;
  expand?: {
    requester?: { id: string; name: string; email: string };
    assigned_to?: { id: string; name: string; email: string };
  };
}

export interface TicketReply {
  id: string;
  ticket: string;
  user: string;
  message: string;
  is_staff: boolean;
  created: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  author: string;
  is_published: boolean;
  created: string;
  updated: string;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'ticket-1',
    subject: 'Login issues after password reset',
    description: 'I cannot log in after resetting my password. The system says invalid credentials.',
    status: 'Open',
    priority: 'High',
    requester: 'user-1',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expand: {
      requester: { id: 'user-1', name: 'John Doe', email: 'john@school.com' }
    }
  },
  {
    id: 'ticket-2',
    subject: 'Feature request: Dark mode',
    description: 'Would like to have a dark mode option for the platform.',
    status: 'In Progress',
    priority: 'Low',
    requester: 'user-2',
    assigned_to: 'staff-1',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expand: {
      requester: { id: 'user-2', name: 'Jane Smith', email: 'jane@school.com' },
      assigned_to: { id: 'staff-1', name: 'Support Agent', email: 'support@growyourneed.com' }
    }
  },
  {
    id: 'ticket-3',
    subject: 'Grade calculation error',
    description: 'The grade calculator shows incorrect weighted average.',
    status: 'Resolved',
    priority: 'Medium',
    requester: 'user-3',
    assigned_to: 'staff-1',
    created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    expand: {
      requester: { id: 'user-3', name: 'Bob Wilson', email: 'bob@school.com' },
      assigned_to: { id: 'staff-1', name: 'Support Agent', email: 'support@growyourneed.com' }
    }
  }
];

const MOCK_ARTICLES: KnowledgeBaseArticle[] = [
  {
    id: 'article-1',
    title: 'Getting Started with Grow Your Need',
    content: '# Welcome!\n\nThis guide will help you get started with our platform...',
    category: 'Getting Started',
    tags: 'onboarding,setup,new user',
    author: 'staff-1',
    is_published: true,
    created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'article-2',
    title: 'How to Reset Your Password',
    content: '# Password Reset\n\n1. Click on "Forgot Password"\n2. Enter your email...',
    category: 'Account',
    tags: 'password,account,security',
    author: 'staff-1',
    is_published: true,
    created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'article-3',
    title: 'Understanding Grade Calculations',
    content: '# Grade Calculations\n\nGrades are calculated using weighted averages...',
    category: 'Academic',
    tags: 'grades,calculation,academic',
    author: 'staff-1',
    is_published: true,
    created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated: new Date().toISOString()
  }
];

const MOCK_REPLIES: TicketReply[] = [
  {
    id: 'reply-1',
    ticket: 'ticket-2',
    user: 'staff-1',
    message: 'Thank you for the suggestion! We are currently working on implementing dark mode.',
    is_staff: true,
    created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

export const supportService = {
  // Tickets
  async getTickets(userId?: string) {
    if (isMockEnv()) {
      const filtered = userId 
        ? MOCK_TICKETS.filter(t => t.requester === userId)
        : MOCK_TICKETS;
      return { items: filtered, totalItems: filtered.length };
    }

    try {
      let filter = '';
      if (userId) {
        filter = `requester = "${userId}"`;
      }
      return await pb.collection('tickets').getList<Ticket>(1, 50, {
        sort: '-created',
        filter,
        expand: 'requester,assigned_to',
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return { items: [], totalItems: 0 };
    }
  },

  async getTicket(id: string): Promise<Ticket | null> {
    if (isMockEnv()) {
      return MOCK_TICKETS.find(t => t.id === id) || null;
    }

    try {
      return await pb.collection('tickets').getOne<Ticket>(id, {
        expand: 'requester,assigned_to'
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  },

  async createTicket(data: Partial<Ticket>): Promise<Ticket | null> {
    if (isMockEnv()) {
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        subject: data.subject || '',
        description: data.description || '',
        status: data.status || 'Open',
        priority: data.priority || 'Medium',
        requester: data.requester || '',
        created: new Date().toISOString()
      };
      MOCK_TICKETS.unshift(newTicket);
      return newTicket;
    }

    try {
      return await pb.collection('tickets').create<Ticket>(data);
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },

  async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket | null> {
    if (isMockEnv()) {
      const ticket = MOCK_TICKETS.find(t => t.id === id);
      if (ticket) {
        Object.assign(ticket, data);
      }
      return ticket || null;
    }

    try {
      return await pb.collection('tickets').update<Ticket>(id, data);
    } catch (error) {
      console.error('Error updating ticket:', error);
      return null;
    }
  },

  async deleteTicket(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_TICKETS.findIndex(t => t.id === id);
      if (index !== -1) {
        MOCK_TICKETS.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('tickets').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
  },

  async assignTicket(ticketId: string, staffId: string): Promise<Ticket | null> {
    return supportService.updateTicket(ticketId, {
      assigned_to: staffId,
      status: 'In Progress'
    });
  },

  async resolveTicket(ticketId: string): Promise<Ticket | null> {
    return supportService.updateTicket(ticketId, { status: 'Resolved' });
  },

  async closeTicket(ticketId: string): Promise<Ticket | null> {
    return supportService.updateTicket(ticketId, { status: 'Closed' });
  },

  // Ticket Replies
  async getTicketReplies(ticketId: string): Promise<TicketReply[]> {
    if (isMockEnv()) {
      return MOCK_REPLIES.filter(r => r.ticket === ticketId);
    }

    try {
      return await pb.collection('ticket_replies').getFullList<TicketReply>({
        filter: `ticket = "${ticketId}"`,
        sort: 'created'
      });
    } catch (error) {
      console.error('Error fetching ticket replies:', error);
      return [];
    }
  },

  async addReply(data: Partial<TicketReply>): Promise<TicketReply | null> {
    if (isMockEnv()) {
      const newReply: TicketReply = {
        id: `reply-${Date.now()}`,
        ticket: data.ticket || '',
        user: data.user || '',
        message: data.message || '',
        is_staff: data.is_staff || false,
        created: new Date().toISOString()
      };
      MOCK_REPLIES.push(newReply);
      return newReply;
    }

    try {
      return await pb.collection('ticket_replies').create<TicketReply>(data);
    } catch (error) {
      console.error('Error adding reply:', error);
      return null;
    }
  },

  // Ticket Statistics
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionTime?: number;
  }> {
    if (isMockEnv()) {
      return {
        total: MOCK_TICKETS.length,
        open: MOCK_TICKETS.filter(t => t.status === 'Open').length,
        inProgress: MOCK_TICKETS.filter(t => t.status === 'In Progress').length,
        resolved: MOCK_TICKETS.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
      };
    }

    try {
      const [total, open, inProgress, resolved] = await Promise.all([
        pb.collection('tickets').getList(1, 1),
        pb.collection('tickets').getList(1, 1, { filter: 'status = "Open"' }),
        pb.collection('tickets').getList(1, 1, { filter: 'status = "In Progress"' }),
        pb.collection('tickets').getList(1, 1, { filter: 'status = "Resolved" || status = "Closed"' })
      ]);

      return {
        total: total.totalItems,
        open: open.totalItems,
        inProgress: inProgress.totalItems,
        resolved: resolved.totalItems
      };
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    }
  },

  // Knowledge Base
  async getArticles(category?: string) {
    if (isMockEnv()) {
      const filtered = category 
        ? MOCK_ARTICLES.filter(a => a.is_published && a.category === category)
        : MOCK_ARTICLES.filter(a => a.is_published);
      return { items: filtered, totalItems: filtered.length };
    }

    try {
      let filter = 'is_published = true';
      if (category) {
        filter += ` && category = "${category}"`;
      }
      return await pb.collection('knowledge_base').getList<KnowledgeBaseArticle>(1, 50, {
        sort: '-created',
        filter,
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      return { items: [], totalItems: 0 };
    }
  },

  async getArticle(id: string): Promise<KnowledgeBaseArticle | null> {
    if (isMockEnv()) {
      return MOCK_ARTICLES.find(a => a.id === id) || null;
    }

    try {
      return await pb.collection('knowledge_base').getOne<KnowledgeBaseArticle>(id);
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  },

  async searchArticles(query: string): Promise<KnowledgeBaseArticle[]> {
    if (isMockEnv()) {
      const lowerQuery = query.toLowerCase();
      return MOCK_ARTICLES.filter(a =>
        a.is_published && (
          a.title.toLowerCase().includes(lowerQuery) ||
          a.content.toLowerCase().includes(lowerQuery) ||
          a.tags.toLowerCase().includes(lowerQuery)
        )
      );
    }

    try {
      return await pb.collection('knowledge_base').getFullList<KnowledgeBaseArticle>({
        filter: `is_published = true && (title ~ "${query}" || content ~ "${query}" || tags ~ "${query}")`,
        sort: '-created'
      });
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  },

  async createArticle(data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle | null> {
    if (isMockEnv()) {
      const newArticle: KnowledgeBaseArticle = {
        id: `article-${Date.now()}`,
        title: data.title || '',
        content: data.content || '',
        category: data.category || 'General',
        tags: data.tags || '',
        author: data.author || '',
        is_published: data.is_published || false,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      MOCK_ARTICLES.push(newArticle);
      return newArticle;
    }

    try {
      return await pb.collection('knowledge_base').create<KnowledgeBaseArticle>(data);
    } catch (error) {
      console.error('Error creating article:', error);
      return null;
    }
  },

  async updateArticle(id: string, data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle | null> {
    if (isMockEnv()) {
      const article = MOCK_ARTICLES.find(a => a.id === id);
      if (article) {
        Object.assign(article, data, { updated: new Date().toISOString() });
      }
      return article || null;
    }

    try {
      return await pb.collection('knowledge_base').update<KnowledgeBaseArticle>(id, {
        ...data,
        updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating article:', error);
      return null;
    }
  },

  async deleteArticle(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_ARTICLES.findIndex(a => a.id === id);
      if (index !== -1) {
        MOCK_ARTICLES.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('knowledge_base').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      return false;
    }
  },

  async getArticleCategories(): Promise<string[]> {
    if (isMockEnv()) {
      return [...new Set(MOCK_ARTICLES.filter(a => a.is_published).map(a => a.category))];
    }

    try {
      const articles = await pb.collection('knowledge_base').getFullList<KnowledgeBaseArticle>({
        filter: 'is_published = true',
        fields: 'category'
      });
      return [...new Set(articles.map(a => a.category))];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
};
