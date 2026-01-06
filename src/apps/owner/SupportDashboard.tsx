import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon, Modal } from '../../components/shared/ui/CommonUI';
import { useToast } from '../../hooks/useToast';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useRateLimit, RateLimitPresets } from '../../hooks/useRateLimit';
import { useAuth } from '../../context/AuthContext';
import { supportTicketService, SupportTicket, TicketStats } from '../../services/supportTicketService';
import { TableSkeleton, StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['technical', 'billing', 'feature_request', 'bug_report', 'other']),
  reporter_id: z.string().min(1, 'Reporter ID required')
});

export const SupportDashboard: React.FC = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [stats, setStats] = useState<TicketStats | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium' as const,
        category: 'technical' as const
    });

    const { executeIfAllowed } = useRateLimit(RateLimitPresets.FORM_SUBMIT);

    useEffect(() => {
        loadTickets();
        loadStats();
    }, [filter]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const result = await supportTicketService.getTickets(1, 50, {
                status: filter !== 'all' ? filter : undefined
            });

            setTickets(result.items);
        } catch (error) {
            console.error('Failed to load tickets:', error);
            showToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await supportTicketService.getTicketStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleCreateTicket = async () => {
        if (!user?.id) {
            showToast('User not authenticated', 'error');
            return;
        }

        await executeIfAllowed(async () => {
            try {
                // Sanitize inputs to prevent XSS
                const sanitized = {
                    title: sanitizeText(formData.title),
                    description: sanitizeHtml(formData.description, 'BASIC'),
                    priority: formData.priority,
                    category: formData.category,
                    reporter_id: user.id
                };
                
                // Validate
                const result = ticketSchema.safeParse(sanitized);
                if (!result.success) {
                    showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
                    return;
                }

                await supportTicketService.createTicket(result.data, user.id);

                showToast('Ticket created successfully!', 'success');
                setIsCreateModalOpen(false);
                setFormData({ title: '', description: '', priority: 'medium', category: 'technical' });
                await loadTickets();
                await loadStats();
            } catch (error) {
                console.error('Failed to create ticket:', error);
                showToast('Failed to create ticket', 'error');
            }
        });
    };

    const updateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated') => {
        // Optimistic UI update
        const previousTickets = [...tickets];
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));

        try {
            await supportTicketService.updateTicket(ticketId, {
                status: newStatus
            }, user?.id);

            showToast('Ticket updated!', 'success');
            // Refresh stats in background
            loadStats();
        } catch (error) {
            console.error('Failed to update ticket:', error);
            showToast('Failed to update ticket', 'error');
            // Rollback on failure
            setTickets(previousTickets);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-purple-100 text-purple-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            case 'escalated': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSLAStatusColor = (slaStatus?: string) => {
        switch (slaStatus) {
            case 'breached': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'at_risk': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'within_sla': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const displayStats = stats || {
        total: loading ? 0 : tickets.length,
        byStatus: {},
        byPriority: {},
        avgResolutionTime: 0,
        slaBreachRate: 0,
        openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        overdueTickets: 0
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Support Tickets</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer support requests with SLA tracking</p>
                </div>
                <Button name="create-ticket" aria-label="Create new support ticket" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Create Ticket
                </Button>
            </div>

            {/* Stats */}
            {!stats && loading ? (
                <div className="mb-8">
                    <StatsSkeleton cols={5} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <Card className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{displayStats.total}</p>
                    </Card>
                    <Card className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{displayStats.openTickets}</p>
                    </Card>
                    <Card className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{displayStats.overdueTickets}</p>
                    </Card>
                    <Card className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Resolution</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{displayStats.avgResolutionTime.toFixed(1)}h</p>
                    </Card>
                    <Card className="p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">SLA Breach Rate</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{displayStats.slaBreachRate.toFixed(1)}%</p>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['all', 'open', 'in_progress', 'resolved'] as const).map(filterOption => (
                    <button
                        name={`filter-${filterOption}`}
                        aria-label={`Filter by ${filterOption}`}
                        key={filterOption}
                        onClick={() => setFilter(filterOption)}
                        className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${filter === filterOption
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {filterOption.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                    <TableSkeleton rows={3} />
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <Card key={ticket.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.title}</h3>
                                        <span aria-label={`Priority: ${ticket.priority}`} className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span aria-label={`Status: ${ticket.status}`} className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{ticket.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Category: {ticket.category}</span>
                                        <span>•</span>
                                        <span>Created: {new Date(ticket.created).toLocaleDateString()}</span>
                                        {ticket.expand?.created_by && (
                                            <>
                                                <span>•</span>
                                                <span>By: {ticket.expand.created_by.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {ticket.status === 'open' && (
                                        <Button name="start-ticket" aria-label="Start working on ticket" variant="outline" size="sm" onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>
                                            Start
                                        </Button>
                                    )}
                                    {ticket.status === 'in_progress' && (
                                        <Button name="resolve-ticket" aria-label="Mark ticket as resolved" variant="primary" size="sm" onClick={() => updateTicketStatus(ticket.id, 'resolved')}>
                                            Resolve
                                        </Button>
                                    )}
                                    <Button name="view-ticket" aria-label="View ticket details" variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                                        View
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {tickets.length === 0 && (
                        <Card className="p-12 text-center">
                            <Icon name="TicketIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tickets found</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {filter === 'all' ? 'No support tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
                            </p>
                        </Card>
                    )}
                </div>
            )}

            {/* Create Ticket Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Support Ticket"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Subject *</label>
                        <input
                            name="ticket-title"
                            type="text"
                            className="w-full border-2 p-3 rounded-lg bg-white dark:bg-gray-800"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief description of the issue"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Description *</label>
                        <textarea
                            name="ticket-description"
                            className="w-full border-2 p-3 rounded-lg"
                            rows={4}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed description of the issue"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Priority</label>
                            <select
                                name="ticket-priority"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Category</label>
                            <select
                                name="ticket-category"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="technical">Technical</option>
                                <option value="billing">Billing</option>
                                <option value="feature">Feature Request</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button name="modal-create-ticket" variant="primary" onClick={handleCreateTicket} className="flex-1">
                            Create Ticket
                        </Button>
                        <Button name="modal-cancel" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
