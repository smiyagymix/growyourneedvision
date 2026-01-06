import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface FAQItem {
    id: string;
    category: string;
    question: string;
    answer: string;
    views: number;
    helpful_count: number;
    order: number;
    created: string;
}

export interface SupportTicket {
    id: string;
    user: string;
    subject: string;
    description: string;
    category: 'Technical' | 'Billing' | 'Feature Request' | 'Bug Report' | 'Other';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    status: 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
    assigned_to?: string;
    attachments?: string[];
    created: string;
    updated: string;
}

export interface TicketReply {
    id: string;
    ticket: string;
    user: string;
    message: string;
    is_staff: boolean;
    created: string;
}

export interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    views: number;
    helpful_count: number;
    author: string;
    published: boolean;
    created: string;
    updated: string;
}

const MOCK_FAQS: FAQItem[] = [
    {
        id: 'faq-1',
        category: 'Account',
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
        views: 150,
        helpful_count: 45,
        order: 1,
        created: new Date().toISOString()
    },
    {
        id: 'faq-2',
        category: 'Account',
        question: 'How do I update my profile information?',
        answer: 'Go to Settings > Profile and update your information. Click Save when done.',
        views: 120,
        helpful_count: 35,
        order: 2,
        created: new Date().toISOString()
    },
    {
        id: 'faq-3',
        category: 'Billing',
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit cards, PayPal, and bank transfers.',
        views: 90,
        helpful_count: 25,
        order: 1,
        created: new Date().toISOString()
    },
    {
        id: 'faq-4',
        category: 'Technical',
        question: 'Why is the platform running slowly?',
        answer: 'Try clearing your browser cache or using a different browser. Contact support if issues persist.',
        views: 75,
        helpful_count: 20,
        order: 1,
        created: new Date().toISOString()
    }
];

const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
    {
        id: 'support-1',
        user: 'user-1',
        subject: 'Cannot access course materials',
        description: 'I enrolled in the course but cannot see the materials.',
        category: 'Technical',
        priority: 'High',
        status: 'Open',
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'support-2',
        user: 'user-1',
        subject: 'Billing inquiry',
        description: 'Question about my last invoice.',
        category: 'Billing',
        priority: 'Medium',
        status: 'Resolved',
        assigned_to: 'staff-1',
        created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
    {
        id: 'ka-1',
        title: 'Getting Started Guide',
        content: '# Welcome to the Platform\n\nThis guide will help you get started...',
        category: 'Getting Started',
        tags: ['onboarding', 'new user', 'setup'],
        views: 500,
        helpful_count: 150,
        author: 'admin',
        published: true,
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: 'ka-2',
        title: 'Troubleshooting Common Issues',
        content: '# Common Issues\n\n## Login Problems\n...',
        category: 'Troubleshooting',
        tags: ['issues', 'problems', 'help'],
        views: 300,
        helpful_count: 80,
        author: 'admin',
        published: true,
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date().toISOString()
    }
];

export const helpService = {
    // FAQs
    getAllFAQs: async (): Promise<FAQItem[]> => {
        if (isMockEnv()) {
            return MOCK_FAQS;
        }

        return await pb.collection('help_faqs').getFullList<FAQItem>({
            sort: 'order,category'
        });
    },

    getFAQsByCategory: async (category: string): Promise<FAQItem[]> => {
        if (isMockEnv()) {
            return MOCK_FAQS.filter(f => f.category === category);
        }

        return await pb.collection('help_faqs').getFullList<FAQItem>({
            filter: `category = "${category}"`,
            sort: 'order'
        });
    },

    searchFAQs: async (query: string): Promise<FAQItem[]> => {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_FAQS.filter(f => 
                f.question.toLowerCase().includes(lowerQuery) || 
                f.answer.toLowerCase().includes(lowerQuery)
            );
        }

        return await pb.collection('help_faqs').getFullList<FAQItem>({
            filter: `question ~ "${query}" || answer ~ "${query}"`,
            sort: '-helpful_count'
        });
    },

    createFAQ: async (data: Partial<FAQItem>): Promise<FAQItem> => {
        if (isMockEnv()) {
            const newFAQ: FAQItem = {
                id: `faq-${Date.now()}`,
                category: data.category || 'General',
                question: data.question || '',
                answer: data.answer || '',
                views: 0,
                helpful_count: 0,
                order: data.order || 0,
                created: new Date().toISOString()
            };
            MOCK_FAQS.push(newFAQ);
            return newFAQ;
        }

        return await pb.collection('help_faqs').create(data);
    },

    updateFAQ: async (id: string, data: Partial<FAQItem>): Promise<FAQItem | null> => {
        if (isMockEnv()) {
            const faq = MOCK_FAQS.find(f => f.id === id);
            if (faq) {
                Object.assign(faq, data);
            }
            return faq || null;
        }

        return await pb.collection('help_faqs').update(id, data);
    },

    deleteFAQ: async (id: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_FAQS.findIndex(f => f.id === id);
            if (index !== -1) {
                MOCK_FAQS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('help_faqs').delete(id);
            return true;
        } catch {
            return false;
        }
    },

    markFAQHelpful: async (faqId: string): Promise<FAQItem | null> => {
        if (isMockEnv()) {
            const faq = MOCK_FAQS.find(f => f.id === faqId);
            if (faq) {
                faq.helpful_count++;
            }
            return faq || null;
        }

        const faq = await pb.collection('help_faqs').getOne(faqId);
        return await pb.collection('help_faqs').update(faqId, {
            helpful_count: (faq.helpful_count || 0) + 1
        });
    },

    incrementFAQViews: async (faqId: string): Promise<FAQItem | null> => {
        if (isMockEnv()) {
            const faq = MOCK_FAQS.find(f => f.id === faqId);
            if (faq) {
                faq.views++;
            }
            return faq || null;
        }

        const faq = await pb.collection('help_faqs').getOne(faqId);
        return await pb.collection('help_faqs').update(faqId, {
            views: (faq.views || 0) + 1
        });
    },

    // Support Tickets
    getAllTickets: async (): Promise<SupportTicket[]> => {
        if (isMockEnv()) {
            return MOCK_SUPPORT_TICKETS;
        }

        return await pb.collection('support_tickets').getFullList<SupportTicket>({
            sort: '-created',
            expand: 'user,assigned_to'
        });
    },

    getUserTickets: async (userId: string): Promise<SupportTicket[]> => {
        if (isMockEnv()) {
            return MOCK_SUPPORT_TICKETS.filter(t => t.user === userId);
        }

        return await pb.collection('support_tickets').getFullList<SupportTicket>({
            filter: `user = "${userId}"`,
            sort: '-created',
            expand: 'assigned_to'
        });
    },

    createTicket: async (data: Partial<SupportTicket>): Promise<SupportTicket> => {
        if (isMockEnv()) {
            const newTicket: SupportTicket = {
                id: `support-${Date.now()}`,
                user: data.user || '',
                subject: data.subject || '',
                description: data.description || '',
                category: data.category || 'Other',
                priority: data.priority || 'Medium',
                status: 'Open',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_SUPPORT_TICKETS.unshift(newTicket);
            return newTicket;
        }

        return await pb.collection('support_tickets').create(data);
    },

    updateTicket: async (id: string, data: Partial<SupportTicket>): Promise<SupportTicket | null> => {
        if (isMockEnv()) {
            const ticket = MOCK_SUPPORT_TICKETS.find(t => t.id === id);
            if (ticket) {
                Object.assign(ticket, data, { updated: new Date().toISOString() });
            }
            return ticket || null;
        }

        return await pb.collection('support_tickets').update(id, data);
    },

    getTicketReplies: async (ticketId: string): Promise<TicketReply[]> => {
        if (isMockEnv()) {
            return []; // Could add mock replies
        }

        return await pb.collection('ticket_replies').getFullList<TicketReply>({
            filter: `ticket = "${ticketId}"`,
            sort: 'created',
            expand: 'user'
        });
    },

    addTicketReply: async (ticketId: string, userId: string, message: string, isStaff: boolean = false): Promise<TicketReply> => {
        if (isMockEnv()) {
            return {
                id: `reply-${Date.now()}`,
                ticket: ticketId,
                user: userId,
                message,
                is_staff: isStaff,
                created: new Date().toISOString()
            };
        }

        return await pb.collection('ticket_replies').create({
            ticket: ticketId,
            user: userId,
            message,
            is_staff: isStaff
        });
    },

    // Knowledge Base
    getPublishedArticles: async (): Promise<KnowledgeArticle[]> => {
        if (isMockEnv()) {
            return MOCK_KNOWLEDGE_ARTICLES.filter(a => a.published);
        }

        return await pb.collection('knowledge_articles').getFullList<KnowledgeArticle>({
            filter: 'published = true',
            sort: '-created'
        });
    },

    getArticlesByCategory: async (category: string): Promise<KnowledgeArticle[]> => {
        if (isMockEnv()) {
            return MOCK_KNOWLEDGE_ARTICLES.filter(a => a.category === category && a.published);
        }

        return await pb.collection('knowledge_articles').getFullList<KnowledgeArticle>({
            filter: `category = "${category}" && published = true`,
            sort: '-views'
        });
    },

    searchArticles: async (query: string): Promise<KnowledgeArticle[]> => {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_KNOWLEDGE_ARTICLES.filter(a => 
                a.published && (
                    a.title.toLowerCase().includes(lowerQuery) || 
                    a.content.toLowerCase().includes(lowerQuery)
                )
            );
        }

        return await pb.collection('knowledge_articles').getFullList<KnowledgeArticle>({
            filter: `(title ~ "${query}" || content ~ "${query}") && published = true`,
            sort: '-helpful_count'
        });
    },

    getArticleById: async (id: string): Promise<KnowledgeArticle | null> => {
        if (isMockEnv()) {
            return MOCK_KNOWLEDGE_ARTICLES.find(a => a.id === id) || null;
        }

        try {
            return await pb.collection('knowledge_articles').getOne<KnowledgeArticle>(id, {
                expand: 'author'
            });
        } catch {
            return null;
        }
    },

    incrementArticleViews: async (articleId: string): Promise<KnowledgeArticle | null> => {
        if (isMockEnv()) {
            const article = MOCK_KNOWLEDGE_ARTICLES.find(a => a.id === articleId);
            if (article) {
                article.views++;
            }
            return article || null;
        }

        const article = await pb.collection('knowledge_articles').getOne(articleId);
        return await pb.collection('knowledge_articles').update(articleId, {
            views: (article.views || 0) + 1
        });
    },

    markArticleHelpful: async (articleId: string): Promise<KnowledgeArticle | null> => {
        if (isMockEnv()) {
            const article = MOCK_KNOWLEDGE_ARTICLES.find(a => a.id === articleId);
            if (article) {
                article.helpful_count++;
            }
            return article || null;
        }

        const article = await pb.collection('knowledge_articles').getOne(articleId);
        return await pb.collection('knowledge_articles').update(articleId, {
            helpful_count: (article.helpful_count || 0) + 1
        });
    },

    // Statistics
    getHelpStats: async (userId: string) => {
        if (isMockEnv()) {
            const userTickets = MOCK_SUPPORT_TICKETS.filter(t => t.user === userId);
            return {
                totalTickets: userTickets.length,
                openTickets: userTickets.filter(t => t.status === 'Open').length,
                resolvedTickets: userTickets.filter(t => t.status === 'Resolved').length,
                totalArticles: MOCK_KNOWLEDGE_ARTICLES.filter(a => a.published).length
            };
        }

        try {
            const [tickets, articles] = await Promise.all([
                pb.collection('support_tickets').getFullList({ filter: `user = "${userId}"` }),
                pb.collection('knowledge_articles').getFullList({ filter: 'published = true' })
            ]);

            return {
                totalTickets: tickets.length,
                openTickets: tickets.filter((t) => (t as unknown as SupportTicket).status === 'Open').length,
                resolvedTickets: tickets.filter((t) => (t as unknown as SupportTicket).status === 'Resolved').length,
                totalArticles: articles.length
            };
        } catch (error) {
            console.error('Failed to get help stats:', error);
            return {
                totalTickets: 0,
                openTickets: 0,
                resolvedTickets: 0,
                totalArticles: 0
            };
        }
    },

    getFAQCategories: async (): Promise<string[]> => {
        if (isMockEnv()) {
            return [...new Set(MOCK_FAQS.map(f => f.category))];
        }

        try {
            const faqs = await pb.collection('help_faqs').getFullList<FAQItem>({
                fields: 'category'
            });
            return [...new Set(faqs.map(f => f.category))];
        } catch {
            return [];
        }
    }
};
