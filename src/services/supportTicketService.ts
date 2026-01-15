import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { auditLogger } from './auditLogger';

/**
 * Support Ticket Service
 * Handles all support ticket operations with SLA tracking and automation
 */

export interface CoreSupportTicket extends RecordModel {
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    tenant_id?: string;
    tenant_name?: string;
    reporter_id: string;
    reporter_name?: string;
    reporter_email?: string;
    assigned_to?: string;
    assigned_to_name?: string;
    resolution?: string;
    resolved_at?: string;
    closed_at?: string;
    sla_due_date?: string;
    sla_status?: 'within_sla' | 'at_risk' | 'breached';
    tags?: string[];
    attachments?: string[];
}

export interface CreateTicketData {
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    tenant_id?: string;
    reporter_id: string;
    tags?: string[];
}

export interface UpdateTicketData {
    title?: string;
    description?: string;
    status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    assigned_to?: string;
    resolution?: string;
    tags?: string[];
}

export interface SupportTicketFilters {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
    tenant_id?: string;
    search?: string;
}

export interface SupportTicketStats {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    avgResolutionTime: number; // in hours
    slaBreachRate: number; // percentage
    openTickets: number;
    overdueTickets: number;
}

class SupportTicketService {
    private collection = 'support_tickets';

    // SLA response times in hours
    private SLA_TIMES = {
        critical: 1,    // 1 hour
        high: 4,        // 4 hours
        medium: 24,     // 24 hours
        low: 72         // 72 hours
    };

    /**
     * Calculate SLA due date based on priority
     */
    private calculateSLADueDate(priority: string): string {
        const hours = this.SLA_TIMES[priority as keyof typeof this.SLA_TIMES] || 24;
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + hours);
        return dueDate.toISOString();
    }

    /**
     * Calculate SLA status
     */
    private calculateSLAStatus(sla_due_date?: string): 'within_sla' | 'at_risk' | 'breached' {
        if (!sla_due_date) return 'within_sla';

        const now = new Date();
        const dueDate = new Date(sla_due_date);
        const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < 0) return 'breached';
        if (hoursRemaining < 2) return 'at_risk';
        return 'within_sla';
    }

    /**
     * Get all tickets with filtering and pagination
     */
    async getTickets(
        page: number = 1,
        pageSize: number = 50,
        filters?: SupportTicketFilters
    ): Promise<{ items: CoreSupportTicket[]; totalItems: number; totalPages: number }> {
        try {
            const filterParts: string[] = [];

            if (filters?.status && filters.status !== 'all') {
                filterParts.push(`status = "${filters.status}"`);
            }

            if (filters?.priority && filters.priority !== 'all') {
                filterParts.push(`priority = "${filters.priority}"`);
            }

            if (filters?.category && filters.category !== 'all') {
                filterParts.push(`category = "${filters.category}"`);
            }

            if (filters?.assigned_to) {
                filterParts.push(`assigned_to = "${filters.assigned_to}"`);
            }

            if (filters?.tenant_id) {
                filterParts.push(`tenant_id = "${filters.tenant_id}"`);
            }

            if (filters?.search) {
                const search = filters.search.toLowerCase();
                filterParts.push(`(title ~ "${search}" || description ~ "${search}")`);
            }

            const filterQuery = filterParts.join(' && ');

            const result = await pb.collection(this.collection).getList<CoreSupportTicket>(page, pageSize, {
                filter: filterQuery || undefined,
                sort: '-created',
                expand: 'tenant_id,assigned_to,reporter_id'
            });

            // Calculate SLA status for each ticket
            const itemsWithSLA = result.items.map(ticket => ({
                ...ticket,
                sla_status: this.calculateSLAStatus(ticket.sla_due_date)
            }));

            return {
                items: itemsWithSLA,
                totalItems: result.totalItems,
                totalPages: result.totalPages
            };
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            throw error;
        }
    }

    /**
     * Get a single ticket by ID
     */
    async getTicket(ticketId: string): Promise<CoreSupportTicket> {
        try {
            const ticket = await pb.collection(this.collection).getOne<CoreSupportTicket>(ticketId, {
                expand: 'tenant_id,assigned_to,reporter_id'
            });

            return {
                ...ticket,
                sla_status: this.calculateSLAStatus(ticket.sla_due_date)
            };
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            throw error;
        }
    }

    /**
     * Create a new support ticket
     */
    async createTicket(data: CreateTicketData, createdBy?: string): Promise<CoreSupportTicket> {
        try {
            const priority = data.priority || 'medium';
            const sla_due_date = this.calculateSLADueDate(priority);

            const ticketData = {
                title: data.title,
                description: data.description,
                status: 'open' as const,
                priority,
                category: data.category || 'general',
                tenant_id: data.tenant_id,
                reporter_id: data.reporter_id,
                sla_due_date,
                sla_status: 'within_sla' as const,
                tags: data.tags || []
            };

            const newTicket = await pb.collection(this.collection).create<CoreSupportTicket>(ticketData);

            // Auto-assign based on category or workload
            await this.autoAssignTicket(newTicket.id);

            // Audit log
            await auditLogger.log({
                action: 'ticket.created',
                resource_type: 'support_ticket',
                resource_id: newTicket.id,
                severity: 'info',
                metadata: {
                    title: newTicket.title,
                    priority: newTicket.priority,
                    created_by: createdBy || 'system'
                }
            });

            return newTicket;
        } catch (error) {
            console.error('Failed to create ticket:', error);
            throw error;
        }
    }

    /**
     * Update an existing ticket
     */
    async updateTicket(ticketId: string, data: UpdateTicketData, updatedBy?: string): Promise<CoreSupportTicket> {
        try {
            const updateData: any = { ...data };

            // If status is being changed to resolved, set resolved_at
            if (data.status === 'resolved' && !updateData.resolved_at) {
                updateData.resolved_at = new Date().toISOString();
            }

            // If status is being changed to closed, set closed_at
            if (data.status === 'closed' && !updateData.closed_at) {
                updateData.closed_at = new Date().toISOString();
            }

            // Recalculate SLA if priority changes
            if (data.priority) {
                const ticket = await pb.collection(this.collection).getOne(ticketId);
                if (ticket.status === 'open' || ticket.status === 'in_progress') {
                    updateData.sla_due_date = this.calculateSLADueDate(data.priority);
                }
            }

            const updatedTicket = await pb.collection(this.collection).update<CoreSupportTicket>(ticketId, updateData);

            // Audit log
            await auditLogger.log({
                action: 'ticket.updated',
                resource_type: 'support_ticket',
                resource_id: ticketId,
                severity: 'info',
                metadata: {
                    updated_fields: Object.keys(data),
                    updated_by: updatedBy || 'system'
                }
            });

            return {
                ...updatedTicket,
                sla_status: this.calculateSLAStatus(updatedTicket.sla_due_date)
            };
        } catch (error) {
            console.error('Failed to update ticket:', error);
            throw error;
        }
    }

    /**
     * Auto-assign ticket to available support staff
     */
    async autoAssignTicket(ticketId: string): Promise<void> {
        try {
            // Intelligent assignment based on workload, expertise, and availability
            // - Current workload
            // - Expertise/category
            // - Availability
            // For now, we'll leave unassigned for manual assignment

            console.log('Auto-assignment logic to be implemented for ticket:', ticketId);
        } catch (error) {
            console.error('Failed to auto-assign ticket:', error);
        }
    }

    /**
     * Assign ticket to a specific user
     */
    async assignTicket(ticketId: string, userId: string, assignedBy?: string): Promise<CoreSupportTicket> {
        try {
            const updatedTicket = await this.updateTicket(ticketId, {
                assigned_to: userId,
                status: 'in_progress'
            }, assignedBy);

            await auditLogger.log({
                action: 'ticket.assigned',
                resource_type: 'support_ticket',
                resource_id: ticketId,
                severity: 'info',
                metadata: {
                    assigned_to: userId,
                    assigned_by: assignedBy || 'system'
                }
            });

            return updatedTicket;
        } catch (error) {
            console.error('Failed to assign ticket:', error);
            throw error;
        }
    }

    /**
     * Escalate a ticket
     */
    async escalateTicket(ticketId: string, reason: string, escalatedBy?: string): Promise<CoreSupportTicket> {
        try {
            const updatedTicket = await this.updateTicket(ticketId, {
                status: 'escalated',
                priority: 'critical'
            }, escalatedBy);

            await auditLogger.log({
                action: 'ticket.escalated',
                resource_type: 'support_ticket',
                resource_id: ticketId,
                severity: 'warning',
                metadata: {
                    reason,
                    escalated_by: escalatedBy || 'system'
                }
            });

            return updatedTicket;
        } catch (error) {
            console.error('Failed to escalate ticket:', error);
            throw error;
        }
    }

    /**
     * Get ticket statistics
     */
    async getTicketStats(): Promise<SupportTicketStats> {
        try {
            const allTickets = await pb.collection(this.collection).getFullList<CoreSupportTicket>();

            const stats: SupportTicketStats = {
                total: allTickets.length,
                byStatus: {},
                byPriority: {},
                avgResolutionTime: 0,
                slaBreachRate: 0,
                openTickets: 0,
                overdueTickets: 0
            };

            let totalResolutionTime = 0;
            let resolvedCount = 0;
            let breachedCount = 0;

            allTickets.forEach(ticket => {
                // Count by status
                stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;

                // Count by priority
                stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;

                // Count open tickets
                if (ticket.status === 'open' || ticket.status === 'in_progress') {
                    stats.openTickets++;
                }

                // Calculate SLA status and count breaches
                const slaStatus = this.calculateSLAStatus(ticket.sla_due_date);
                if (slaStatus === 'breached') {
                    breachedCount++;
                    if (ticket.status === 'open' || ticket.status === 'in_progress') {
                        stats.overdueTickets++;
                    }
                }

                // Calculate resolution time
                if (ticket.resolved_at && ticket.created) {
                    const created = new Date(ticket.created);
                    const resolved = new Date(ticket.resolved_at);
                    const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
                    totalResolutionTime += hours;
                    resolvedCount++;
                }
            });

            stats.avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
            stats.slaBreachRate = allTickets.length > 0 ? (breachedCount / allTickets.length) * 100 : 0;

            return stats;
        } catch (error) {
            console.error('Failed to get ticket stats:', error);
            throw error;
        }
    }

    /**
     * Get overdue tickets (SLA breached)
     */
    async getOverdueTickets(): Promise<SupportTicket[]> {
        try {
            const openTickets = await pb.collection(this.collection).getFullList<SupportTicket>({
                filter: 'status = "open" || status = "in_progress"',
                sort: 'sla_due_date'
            });

            return openTickets
                .map(ticket => ({
                    ...ticket,
                    sla_status: this.calculateSLAStatus(ticket.sla_due_date)
                }))
                .filter(ticket => ticket.sla_status === 'breached' || ticket.sla_status === 'at_risk');
        } catch (error) {
            console.error('Failed to get overdue tickets:', error);
            throw error;
        }
    }
}

export const supportTicketService = new SupportTicketService();
export default supportTicketService;
