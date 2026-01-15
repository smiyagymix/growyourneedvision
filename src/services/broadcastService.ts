import pb from '../lib/pocketbase';
import { auditLog } from './auditLogger';
import { RecordModel } from 'pocketbase';
import { z } from 'zod';
import { notificationService } from './notificationService';
import { emailService } from './emailService';
import { smsService } from './smsService';

export interface BroadcastMessage extends RecordModel {
    id: string;
    subject: string;
    message: string;
    target_audience: 'all' | 'schools' | 'individuals' | 'active' | 'trial';
    priority: 'normal' | 'high' | 'urgent';
    channels: {
        email: boolean;
        inApp: boolean;
        sms: boolean;
    };
    sent_at?: string;
    sent_by: string;
    recipient_count?: number;
    status?: 'draft' | 'scheduled' | 'sent' | 'failed';
    scheduled_for?: string;
    created: string;
    updated: string;
}

export interface CreateBroadcastData {
    subject: string;
    message: string;
    target_audience: BroadcastMessage['target_audience'];
    priority: BroadcastMessage['priority'];
    channels: {
        email: boolean;
        inApp: boolean;
        sms: boolean;
    };
    sent_by: string;
    status?: 'draft' | 'scheduled' | 'sent' | 'failed';
    scheduled_for?: string;
}

const broadcastChannelsSchema = z.object({
    email: z.boolean(),
    inApp: z.boolean(),
    sms: z.boolean(),
});

export const broadcastMessageSchema = z.object({
    id: z.string(),
    collectionId: z.string().optional(),
    collectionName: z.string().optional(),
    subject: z.string(),
    message: z.string(),
    target_audience: z.union([z.literal('all'), z.literal('schools'), z.literal('individuals'), z.literal('active'), z.literal('trial')]),
    priority: z.union([z.literal('normal'), z.literal('high'), z.literal('urgent')]),
    channels: broadcastChannelsSchema,
    sent_at: z.string().optional(),
    sent_by: z.string(),
    recipient_count: z.number().optional(),
    status: z.union([z.literal('draft'), z.literal('scheduled'), z.literal('sent'), z.literal('failed')]).optional(),
    scheduled_for: z.string().optional(),
    created: z.string(),
    updated: z.string(),
}).passthrough();

export type BroadcastMessage = z.infer<typeof broadcastMessageSchema>;

function parseBroadcast(raw: unknown): BroadcastMessage | null {
    const res = broadcastMessageSchema.safeParse(raw);
    if (!res.success) {
        console.warn('broadcastService: failed to parse record', res.error);
        return null;
    }
    return res.data;
}

class BroadcastService {
    private collection = 'broadcast_messages';

    /**
     * Get all broadcast messages
     */
    async getAll(): Promise<BroadcastMessage[]> {
        try {
            const records = await pb.collection(this.collection).getFullList({
                sort: '-created',
                requestKey: null
            });
            return records.map(r => parseBroadcast(r)).filter((r): r is BroadcastMessage => r !== null);
        } catch (error) {
            console.error('Failed to fetch broadcast messages:', error);
            return [];
        }
    }

    /**
     * Get a single broadcast by ID
     */
    async getById(id: string): Promise<BroadcastMessage | null> {
        try {
            const record = await pb.collection(this.collection).getOne(id, {
                requestKey: null
            });
            return parseBroadcast(record);
        } catch (error) {
            console.error(`Failed to fetch broadcast ${id}:`, error);
            return null;
        }
    }

    /**
     * Create a draft broadcast (not sent yet)
     */
    async create(data: CreateBroadcastData): Promise<BroadcastMessage | null> {
        try {
            const record = await pb.collection(this.collection).create({
                ...data,
                status: data.status || 'draft'
            });

            await auditLog.log('broadcast.create', {
                broadcast_id: record.id,
                subject: data.subject,
                target: data.target_audience
            }, 'info');

            return parseBroadcast(record);
        } catch (error) {
            console.error('Failed to create broadcast:', error);
            return null;
        }
    }

    /**
     * Update a broadcast (only drafts can be updated)
     */
    async update(id: string, data: Partial<CreateBroadcastData>): Promise<BroadcastMessage | null> {
        try {
            const existing = await this.getById(id);
            if (existing?.status !== 'draft') {
                throw new Error('Only draft broadcasts can be updated');
            }

            const record = await pb.collection(this.collection).update(id, data);
            return parseBroadcast(record);
        } catch (error) {
            console.error('Failed to update broadcast:', error);
            return null;
        }
    }

    /**
     * Delete a broadcast (only drafts can be deleted)
     */
    async delete(id: string): Promise<boolean> {
        try {
            const existing = await this.getById(id);
            if (existing?.status !== 'draft') {
                throw new Error('Only draft broadcasts can be deleted');
            }

            await pb.collection(this.collection).delete(id);
            await auditLog.log('broadcast.delete', { broadcast_id: id }, 'warning');
            return true;
        } catch (error) {
            console.error('Failed to delete broadcast:', error);
            return false;
        }
    }

    /**
     * Send a broadcast immediately
     */
    async send(data: CreateBroadcastData): Promise<BroadcastMessage | null> {
        try {
            const recipientCount = await this.estimateRecipientCount(data.target_audience);

            const record = await pb.collection(this.collection).create({
                ...data,
                sent_at: new Date().toISOString(),
                recipient_count: recipientCount,
                status: 'sent'
            });

            await auditLog.log('broadcast.send', {
                broadcast_id: record.id,
                subject: data.subject,
                target: data.target_audience,
                channels: data.channels,
                priority: data.priority,
                recipient_count: recipientCount
            }, 'critical');

            // Dispatch to channels
            await this.dispatchToChannels(data, recipientCount);

            return parseBroadcast(record);
        } catch (error) {
            console.error('Failed to send broadcast:', error);
            return null;
        }
    }

    /**
     * Send an existing draft
     */
    async sendDraft(id: string): Promise<BroadcastMessage | null> {
        const draft = await this.getById(id);
        if (!draft || draft.status !== 'draft') {
            console.error('Broadcast not found or already sent');
            return null;
        }

        try {
            const recipientCount = await this.estimateRecipientCount(draft.target_audience);

            const record = await pb.collection(this.collection).update(id, {
                sent_at: new Date().toISOString(),
                recipient_count: recipientCount,
                status: 'sent'
            });

            await auditLog.log('broadcast.send', {
                broadcast_id: id,
                subject: draft.subject,
                target: draft.target_audience,
                recipient_count: recipientCount
            }, 'critical');

            await this.dispatchToChannels(draft, recipientCount);

            return parseBroadcast(record);
        } catch (error) {
            console.error('Failed to send draft:', error);
            return null;
        }
    }

    /**
     * Schedule a broadcast for later
     */
    async schedule(id: string, scheduledFor: string): Promise<BroadcastMessage | null> {
        try {
            const record = await pb.collection(this.collection).update(id, {
                scheduled_for: scheduledFor,
                status: 'scheduled'
            });

            await auditLog.log('broadcast.schedule', {
                broadcast_id: id,
                scheduled_for: scheduledFor
            }, 'info');

            return parseBroadcast(record);
        } catch (error) {
            console.error('Failed to schedule broadcast:', error);
            return null;
        }
    }

    /**
     * Dispatch messages to enabled channels
     */
    private async dispatchToChannels(data: CreateBroadcastData | BroadcastMessage, recipientCount: number): Promise<void> {
        const results: { channel: string; success: boolean; error?: string }[] = [];

        try {
            if (data.channels.email) {
                try {
                    console.log('[Broadcast] Sending email broadcast to', recipientCount, 'recipients');
                    await notificationService.broadcast({
                        title: data.subject,
                        message: data.message,
                        type: 'announcement',
                        category: 'announcement',
                        priority: data.priority === 'urgent' ? 'high' : data.priority === 'high' ? 'medium' : 'low',
                        channels: ['email']
                    });
                    results.push({ channel: 'email', success: true });
                } catch (err) {
                    results.push({ channel: 'email', success: false, error: String(err) });
                }
            }

            if (data.channels.inApp) {
                try {
                    console.log('[Broadcast] Creating in-app notifications for', recipientCount, 'users');
                    await notificationService.broadcast({
                        title: data.subject,
                        message: data.message,
                        type: 'announcement',
                        category: 'announcement',
                        priority: data.priority === 'urgent' ? 'high' : data.priority === 'high' ? 'medium' : 'low',
                        channels: ['in_app']
                    });
                    results.push({ channel: 'inApp', success: true });
                } catch (err) {
                    results.push({ channel: 'inApp', success: false, error: String(err) });
                }
            }

            if (data.channels.sms) {
                try {
                    console.log('[Broadcast] Sending SMS to', recipientCount, 'recipients');
                    await notificationService.broadcast({
                        title: data.subject,
                        message: data.message,
                        type: 'announcement',
                        category: 'announcement',
                        priority: data.priority === 'urgent' ? 'high' : data.priority === 'high' ? 'medium' : 'low',
                        channels: ['sms']
                    });
                    results.push({ channel: 'sms', success: true });
                } catch (err) {
                    results.push({ channel: 'sms', success: false, error: String(err) });
                }
            }

            // Log dispatch results
            await auditLog.log('broadcast.dispatch', {
                channels: results,
                recipient_count: recipientCount
            }, results.some(r => !r.success) ? 'warning' : 'info');

        } catch (error) {
            console.error('[Broadcast] Dispatch error:', error);
            throw error;
        }
    }

    /**
     * Estimate recipient count based on target audience
     */
    async estimateRecipientCount(target: BroadcastMessage['target_audience']): Promise<number> {
        try {
            const tenants = await pb.collection('tenants').getList(1, 1, { requestKey: null });
            const totalTenants = tenants.totalItems;

            switch (target) {
                case 'all': return totalTenants;
                case 'schools': return Math.floor(totalTenants * 0.7);
                case 'individuals': return Math.floor(totalTenants * 0.3);
                case 'active': return Math.floor(totalTenants * 0.8);
                case 'trial': return Math.floor(totalTenants * 0.2);
                default: return totalTenants;
            }
        } catch (error) {
            console.error('Failed to estimate recipient count:', error);
            return 0;
        }
    }

    /**
     * Get sent messages only
     */
    async getSentMessages(): Promise<BroadcastMessage[]> {
        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "sent"',
                sort: '-sent_at',
                requestKey: null
            });
            return records.map(r => parseBroadcast(r)).filter((r): r is BroadcastMessage => r !== null);
        } catch (error) {
            console.error('Failed to fetch sent messages:', error);
            return [];
        }
    }

    /**
     * Get drafts only
     */
    async getDrafts(): Promise<BroadcastMessage[]> {
        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "draft"',
                sort: '-created',
                requestKey: null
            });
            return records.map(r => parseBroadcast(r)).filter((r): r is BroadcastMessage => r !== null);
        } catch (error) {
            console.error('Failed to fetch drafts:', error);
            return [];
        }
    }

    /**
     * Get scheduled messages
     */
    async getScheduled(): Promise<BroadcastMessage[]> {
        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "scheduled"',
                sort: 'scheduled_for',
                requestKey: null
            });
            return records.map(r => parseBroadcast(r)).filter((r): r is BroadcastMessage => r !== null);
        } catch (error) {
            console.error('Failed to fetch scheduled messages:', error);
            return [];
        }
    }

    /**
     * Get messages by priority
     */
    async getByPriority(priority: BroadcastMessage['priority']): Promise<BroadcastMessage[]> {
        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: `priority = "${priority}"`,
                sort: '-created',
                requestKey: null
            });
            return records.map(r => parseBroadcast(r)).filter((r): r is BroadcastMessage => r !== null);
        } catch (error) {
            console.error(`Failed to fetch ${priority} messages:`, error);
            return [];
        }
    }

    /**
     * Get broadcast analytics
     */
    async getAnalytics(): Promise<{
        total: number;
        sent: number;
        drafts: number;
        scheduled: number;
        totalRecipients: number;
    }> {
        const all = await this.getAll();
        return {
            total: all.length,
            sent: all.filter(b => b.status === 'sent').length,
            drafts: all.filter(b => b.status === 'draft').length,
            scheduled: all.filter(b => b.status === 'scheduled').length,
            totalRecipients: all.reduce((sum, b) => sum + (b.recipient_count || 0), 0)
        };
    }
}

export const broadcastService = new BroadcastService();
