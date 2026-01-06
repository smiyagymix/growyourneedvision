import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Ticket extends RecordModel {
    subject: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    tenantId: string;
    created_by: string; // User ID
    assigned_to?: string; // User ID
    category: 'Technical' | 'Billing' | 'Feature Request' | 'Other';
    resolution?: string;
    tags?: string[];
}

export interface TicketComment extends RecordModel {
    ticket_id: string;
    user_id: string;
    content: string;
    is_internal?: boolean;
}

// Mock Data
const MOCK_TICKETS: Ticket[] = [
    {
        id: 'ticket-1',
        collectionId: 'mock',
        collectionName: 'tickets',
        subject: 'Unable to access dashboard',
        description: 'Getting a 403 error when trying to access the admin dashboard.',
        status: 'Open',
        priority: 'High',
        tenantId: 'tenant-1',
        created_by: 'user-1',
        category: 'Technical',
        tags: ['access', 'dashboard'],
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ticket-2',
        collectionId: 'mock',
        collectionName: 'tickets',
        subject: 'Billing discrepancy',
        description: 'Charged twice for the monthly subscription in March.',
        status: 'In Progress',
        priority: 'Medium',
        tenantId: 'tenant-1',
        created_by: 'user-2',
        assigned_to: 'support-1',
        category: 'Billing',
        tags: ['billing', 'duplicate-charge'],
        created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ticket-3',
        collectionId: 'mock',
        collectionName: 'tickets',
        subject: 'Request: Dark mode support',
        description: 'Would love to see a dark mode option for the platform.',
        status: 'Open',
        priority: 'Low',
        tenantId: 'tenant-2',
        created_by: 'user-3',
        category: 'Feature Request',
        tags: ['ui', 'dark-mode'],
        created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ticket-4',
        collectionId: 'mock',
        collectionName: 'tickets',
        subject: 'System down - Critical',
        description: 'The entire system is unresponsive. Multiple users affected.',
        status: 'Resolved',
        priority: 'Critical',
        tenantId: 'tenant-1',
        created_by: 'user-1',
        assigned_to: 'support-2',
        category: 'Technical',
        resolution: 'Server restart resolved the issue. Root cause was memory leak.',
        tags: ['outage', 'critical'],
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ticket-5',
        collectionId: 'mock',
        collectionName: 'tickets',
        subject: 'Export feature not working',
        description: 'PDF export generates blank documents.',
        status: 'Closed',
        priority: 'Medium',
        tenantId: 'tenant-2',
        created_by: 'user-4',
        assigned_to: 'support-1',
        category: 'Technical',
        resolution: 'Fixed in v2.3.1 release',
        created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_COMMENTS: TicketComment[] = [
    {
        id: 'comment-1',
        collectionId: 'mock',
        collectionName: 'ticket_comments',
        ticket_id: 'ticket-2',
        user_id: 'support-1',
        content: 'I have found the duplicate charge and am processing a refund.',
        is_internal: false,
        created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'comment-2',
        collectionId: 'mock',
        collectionName: 'ticket_comments',
        ticket_id: 'ticket-4',
        user_id: 'support-2',
        content: 'Investigating the issue. Initial analysis shows high memory usage.',
        is_internal: true,
        created: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const ticketService = {
    async getTickets(filter?: string): Promise<Ticket[]> {
        if (isMockEnv()) {
            if (!filter) return [...MOCK_TICKETS];
            // Simple filter parsing for mock
            if (filter.includes('tenantId')) {
                const match = filter.match(/tenantId\s*=\s*"([^"]+)"/);
                if (match) {
                    return MOCK_TICKETS.filter(t => t.tenantId === match[1]);
                }
            }
            if (filter.includes('status')) {
                const match = filter.match(/status\s*=\s*"([^"]+)"/);
                if (match) {
                    return MOCK_TICKETS.filter(t => t.status === match[1]);
                }
            }
            return [...MOCK_TICKETS];
        }

        return await pb.collection('tickets').getFullList<Ticket>({
            sort: '-created',
            filter: filter || '',
            expand: 'tenantId,created_by,assigned_to'
        });
    },

    async getTicketById(id: string): Promise<Ticket | null> {
        if (isMockEnv()) {
            return MOCK_TICKETS.find(t => t.id === id) || null;
        }

        try {
            return await pb.collection('tickets').getOne<Ticket>(id, {
                expand: 'tenantId,created_by,assigned_to'
            });
        } catch (error) {
            console.error('Error fetching ticket:', error);
            return null;
        }
    },

    async getTicketsByTenant(tenantId: string): Promise<Ticket[]> {
        return this.getTickets(`tenantId = "${tenantId}"`);
    },

    async getTicketsByStatus(status: Ticket['status']): Promise<Ticket[]> {
        if (isMockEnv()) {
            return MOCK_TICKETS.filter(t => t.status === status);
        }

        return this.getTickets(`status = "${status}"`);
    },

    async getTicketsByPriority(priority: Ticket['priority']): Promise<Ticket[]> {
        if (isMockEnv()) {
            return MOCK_TICKETS.filter(t => t.priority === priority);
        }

        return this.getTickets(`priority = "${priority}"`);
    },

    async getTicketsByCategory(category: Ticket['category']): Promise<Ticket[]> {
        if (isMockEnv()) {
            return MOCK_TICKETS.filter(t => t.category === category);
        }

        return this.getTickets(`category = "${category}"`);
    },

    async getTicketsByUser(userId: string): Promise<Ticket[]> {
        if (isMockEnv()) {
            return MOCK_TICKETS.filter(t => t.created_by === userId);
        }

        return this.getTickets(`created_by = "${userId}"`);
    },

    async getAssignedTickets(userId: string): Promise<Ticket[]> {
        if (isMockEnv()) {
            return MOCK_TICKETS.filter(t => t.assigned_to === userId);
        }

        return this.getTickets(`assigned_to = "${userId}"`);
    },

    async searchTickets(query: string): Promise<Ticket[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            return MOCK_TICKETS.filter(t =>
                t.subject.toLowerCase().includes(lowerQuery) ||
                t.description.toLowerCase().includes(lowerQuery) ||
                t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }

        return await pb.collection('tickets').getFullList<Ticket>({
            filter: `subject ~ "${query}" || description ~ "${query}"`,
            sort: '-created'
        });
    },

    async createTicket(data: Partial<Ticket>): Promise<Ticket> {
        if (isMockEnv()) {
            const newTicket: Ticket = {
                id: `ticket-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'tickets',
                subject: data.subject || 'New Ticket',
                description: data.description || '',
                status: data.status || 'Open',
                priority: data.priority || 'Medium',
                tenantId: data.tenantId || 'tenant-1',
                created_by: data.created_by || 'user-1',
                assigned_to: data.assigned_to,
                category: data.category || 'Other',
                tags: data.tags,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_TICKETS.push(newTicket);
            return newTicket;
        }

        return await pb.collection('tickets').create<Ticket>(data);
    },

    async updateTicket(id: string, data: Partial<Ticket>): Promise<Ticket> {
        if (isMockEnv()) {
            const ticket = MOCK_TICKETS.find(t => t.id === id);
            if (ticket) {
                Object.assign(ticket, data, { updated: new Date().toISOString() });
                return ticket;
            }
            throw new Error('Ticket not found');
        }

        return await pb.collection('tickets').update<Ticket>(id, data);
    },

    async assignTicket(ticketId: string, userId: string): Promise<Ticket> {
        return this.updateTicket(ticketId, { 
            assigned_to: userId, 
            status: 'In Progress' 
        });
    },

    async resolveTicket(ticketId: string, resolution: string): Promise<Ticket> {
        return this.updateTicket(ticketId, { 
            status: 'Resolved', 
            resolution 
        });
    },

    async closeTicket(ticketId: string): Promise<Ticket> {
        return this.updateTicket(ticketId, { status: 'Closed' });
    },

    async reopenTicket(ticketId: string): Promise<Ticket> {
        return this.updateTicket(ticketId, { status: 'Open', resolution: undefined });
    },

    async deleteTicket(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_TICKETS.findIndex(t => t.id === id);
            if (index !== -1) {
                MOCK_TICKETS.splice(index, 1);
            }
            return true;
        }

        return await pb.collection('tickets').delete(id);
    },

    // Comments
    async getComments(ticketId: string): Promise<TicketComment[]> {
        if (isMockEnv()) {
            return MOCK_COMMENTS.filter(c => c.ticket_id === ticketId);
        }

        return await pb.collection('ticket_comments').getFullList<TicketComment>({
            filter: `ticket_id = "${ticketId}"`,
            sort: 'created',
            expand: 'user_id'
        });
    },

    async addComment(ticketId: string, userId: string, content: string, isInternal: boolean = false): Promise<TicketComment> {
        if (isMockEnv()) {
            const newComment: TicketComment = {
                id: `comment-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'ticket_comments',
                ticket_id: ticketId,
                user_id: userId,
                content,
                is_internal: isInternal,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_COMMENTS.push(newComment);
            return newComment;
        }

        return await pb.collection('ticket_comments').create<TicketComment>({
            ticket_id: ticketId,
            user_id: userId,
            content,
            is_internal: isInternal
        });
    },

    // Statistics
    async getStats(): Promise<{ 
        open: number; 
        critical: number; 
        avgResponseTime: string;
        total: number;
        byStatus: Record<Ticket['status'], number>;
        byPriority: Record<Ticket['priority'], number>;
        byCategory: Record<Ticket['category'], number>;
    }> {
        const tickets = await this.getTickets();
        const open = tickets.filter(t => t.status === 'Open').length;
        const critical = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
        
        // Calculate average response time for resolved tickets
        const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
        let avgResponseTime = 'N/A';

        if (resolvedTickets.length > 0) {
            const totalTimeMs = resolvedTickets.reduce((acc, t) => {
                const created = new Date(t.created).getTime();
                const updated = new Date(t.updated).getTime();
                return acc + (updated - created);
            }, 0);
            
            const avgHours = totalTimeMs / resolvedTickets.length / (1000 * 60 * 60);
            avgResponseTime = `${avgHours.toFixed(1)}h`;
        }

        // Calculate by status
        const byStatus = {
            'Open': tickets.filter(t => t.status === 'Open').length,
            'In Progress': tickets.filter(t => t.status === 'In Progress').length,
            'Resolved': tickets.filter(t => t.status === 'Resolved').length,
            'Closed': tickets.filter(t => t.status === 'Closed').length
        };

        // Calculate by priority
        const byPriority = {
            'Low': tickets.filter(t => t.priority === 'Low').length,
            'Medium': tickets.filter(t => t.priority === 'Medium').length,
            'High': tickets.filter(t => t.priority === 'High').length,
            'Critical': tickets.filter(t => t.priority === 'Critical').length
        };

        // Calculate by category
        const byCategory = {
            'Technical': tickets.filter(t => t.category === 'Technical').length,
            'Billing': tickets.filter(t => t.category === 'Billing').length,
            'Feature Request': tickets.filter(t => t.category === 'Feature Request').length,
            'Other': tickets.filter(t => t.category === 'Other').length
        };
        
        return {
            total: tickets.length,
            open,
            critical,
            avgResponseTime,
            byStatus,
            byPriority,
            byCategory
        };
    },

    // Utility methods
    getStatuses(): Ticket['status'][] {
        return ['Open', 'In Progress', 'Resolved', 'Closed'];
    },

    getPriorities(): Ticket['priority'][] {
        return ['Low', 'Medium', 'High', 'Critical'];
    },

    getCategories(): Ticket['category'][] {
        return ['Technical', 'Billing', 'Feature Request', 'Other'];
    }
};
