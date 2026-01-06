/**
 * Tenant Notification Service
 * 
 * Send notifications to tenants via multiple channels
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface TenantNotification extends RecordModel {
    tenantId?: string; // Optional for broadcast
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    channels: NotificationChannel[];
    status: 'pending' | 'sent' | 'failed';
    scheduledFor?: string;
    sentAt?: string;
    metadata?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: string;
    readBy?: string[]; // User IDs who read it
}

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push' | 'webhook';

export interface NotificationTemplate extends RecordModel {
    name: string;
    subject: string;
    body: string;
    type: string;
    channels: NotificationChannel[];
    variables: string[];
}

export interface NotificationStats {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<string, number>;
    readRate: number;
}

// ==================== MOCK DATA ====================

const MOCK_NOTIFICATIONS: TenantNotification[] = [
    {
        id: '1',
        collectionId: 'tenant_notifications',
        collectionName: 'tenant_notifications',
        created: '2025-12-28T10:00:00Z',
        updated: '2025-12-28T10:00:00Z',
        tenantId: 'tenant1',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance on Dec 30, 2025 from 2-4 AM EST',
        type: 'warning',
        priority: 'high',
        channels: ['in-app', 'email'],
        status: 'sent',
        sentAt: '2025-12-28T10:00:00Z',
        readBy: []
    }
];

// ==================== SERVICE ====================

class TenantNotificationService {
    // ==================== SEND NOTIFICATIONS ====================

    async sendNotification(notification: Omit<TenantNotification, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<TenantNotification> {
        if (isMockEnv()) {
            return { ...MOCK_NOTIFICATIONS[0], ...notification };
        }

        return measurePerformance('sendNotification', async () => {
            try {
                const newNotification = await pb.collection('tenant_notifications').create<TenantNotification>({
                    ...notification,
                    status: notification.scheduledFor ? 'pending' : 'sent',
                    sentAt: notification.scheduledFor ? undefined : new Date().toISOString(),
                    readBy: []
                });

                // Send via requested channels
                if (!notification.scheduledFor) {
                    await this.deliverNotification(newNotification);
                }

                addBreadcrumb('Tenant notification sent', 'info', {
                    tenantId: notification.tenantId,
                    type: notification.type,
                    channels: notification.channels
                });

                return newNotification;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'tenant-notifications',
                    operation: 'sendNotification'
                });
                throw error;
            }
        }, { feature: 'tenant-notifications' });
    }

    private async deliverNotification(notification: TenantNotification): Promise<void> {
        const deliveryPromises = notification.channels.map(channel => 
            this.deliverViaChannel(notification, channel)
        );

        await Promise.allSettled(deliveryPromises);
    }

    private async deliverViaChannel(notification: TenantNotification, channel: NotificationChannel): Promise<void> {
        try {
            switch (channel) {
                case 'in-app':
                    // Already stored in database
                    break;

                case 'email':
                    await this.sendEmail(notification);
                    break;

                case 'sms':
                    await this.sendSMS(notification);
                    break;

                case 'push':
                    await this.sendPushNotification(notification);
                    break;

                case 'webhook':
                    await this.sendWebhook(notification);
                    break;
            }
        } catch (error) {
            console.error(`Failed to deliver via ${channel}:`, error);
        }
    }

    private async sendEmail(notification: TenantNotification): Promise<void> {
        // Integrate with email service (already exists in server/index.js)
        console.log(`Sending email notification: ${notification.title}`);
    }

    private async sendSMS(notification: TenantNotification): Promise<void> {
        // Integrate with Twilio or similar
        console.log(`Sending SMS notification: ${notification.title}`);
    }

    private async sendPushNotification(notification: TenantNotification): Promise<void> {
        // Integrate with Firebase Cloud Messaging or similar
        console.log(`Sending push notification: ${notification.title}`);
    }

    private async sendWebhook(notification: TenantNotification): Promise<void> {
        // Send to tenant's configured webhook URL
        console.log(`Sending webhook notification: ${notification.title}`);
    }

    // ==================== BROADCAST ====================

    async broadcastToAllTenants(
        title: string,
        message: string,
        type: 'info' | 'warning' | 'error' | 'success',
        channels: NotificationChannel[]
    ): Promise<TenantNotification[]> {
        if (isMockEnv()) return [];

        const tenants = await pb.collection('tenants').getFullList({ requestKey: null });
        const notifications: TenantNotification[] = [];

        for (const tenant of tenants) {
            const notification = await this.sendNotification({
                tenantId: tenant.id,
                title,
                message,
                type,
                priority: 'normal',
                channels,
                status: 'pending'
            });
            notifications.push(notification);
        }

        return notifications;
    }

    async broadcastToTenantsByPlan(
        plans: string[],
        title: string,
        message: string,
        type: 'info' | 'warning' | 'error' | 'success',
        channels: NotificationChannel[]
    ): Promise<TenantNotification[]> {
        if (isMockEnv()) return [];

        const filter = plans.map(p => `plan = "${p}"`).join(' || ');
        const tenants = await pb.collection('tenants').getFullList({
            filter,
            requestKey: null
        });

        const notifications: TenantNotification[] = [];

        for (const tenant of tenants) {
            const notification = await this.sendNotification({
                tenantId: tenant.id,
                title,
                message,
                type,
                priority: 'normal',
                channels,
                status: 'pending'
            });
            notifications.push(notification);
        }

        return notifications;
    }

    // ==================== TEMPLATES ====================

    async getTemplates(): Promise<NotificationTemplate[]> {
        if (isMockEnv()) return [];

        return await pb.collection('notification_templates').getFullList<NotificationTemplate>({
            sort: 'name',
            requestKey: null
        });
    }

    async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<NotificationTemplate> {
        if (isMockEnv()) {
            return {
                id: '1',
                collectionId: 'notification_templates',
                collectionName: 'notification_templates',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                ...template
            } as unknown as NotificationTemplate;
        }

        return await pb.collection('notification_templates').create<NotificationTemplate>(template);
    }

    async sendFromTemplate(
        templateId: string,
        tenantId: string,
        variables: Record<string, string>
    ): Promise<TenantNotification> {
        const template = await pb.collection('notification_templates').getOne<NotificationTemplate>(templateId);

        let subject = template.subject;
        let body = template.body;

        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
            subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        return this.sendNotification({
            tenantId,
            title: subject,
            message: body,
            type: 'info',
            priority: 'normal',
            channels: template.channels,
            status: 'pending'
        });
    }

    // ==================== QUERIES ====================

    async getNotifications(tenantId?: string, unreadOnly = false): Promise<TenantNotification[]> {
        if (isMockEnv()) return MOCK_NOTIFICATIONS;

        let filter = '';
        if (tenantId) {
            filter = `tenantId = "${tenantId}"`;
        }

        return await pb.collection('tenant_notifications').getFullList<TenantNotification>({
            filter,
            sort: '-created',
            requestKey: null
        });
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        if (isMockEnv()) return;

        const notification = await pb.collection('tenant_notifications').getOne<TenantNotification>(notificationId);
        const readBy = notification.readBy || [];

        if (!readBy.includes(userId)) {
            await pb.collection('tenant_notifications').update(notificationId, {
                readBy: [...readBy, userId]
            });
        }
    }

    // ==================== SCHEDULED NOTIFICATIONS ====================

    async processScheduledNotifications(): Promise<void> {
        if (isMockEnv()) return;

        const now = new Date().toISOString();
        const scheduled = await pb.collection('tenant_notifications').getFullList<TenantNotification>({
            filter: `status = "pending" && scheduledFor <= "${now}"`,
            requestKey: null
        });

        for (const notification of scheduled) {
            try {
                await this.deliverNotification(notification);
                await pb.collection('tenant_notifications').update(notification.id, {
                    status: 'sent',
                    sentAt: new Date().toISOString()
                });
            } catch (error) {
                await pb.collection('tenant_notifications').update(notification.id, {
                    status: 'failed'
                });
            }
        }
    }

    // ==================== STATISTICS ====================

    async getNotificationStats(tenantId?: string): Promise<NotificationStats> {
        if (isMockEnv()) {
            return {
                total: 156,
                sent: 145,
                pending: 8,
                failed: 3,
                byChannel: {
                    'in-app': 156,
                    'email': 120,
                    'sms': 45,
                    'push': 89,
                    'webhook': 12
                },
                byType: {
                    info: 98,
                    warning: 34,
                    error: 12,
                    success: 12
                },
                readRate: 78
            };
        }

        let filter = '';
        if (tenantId) {
            filter = `tenantId = "${tenantId}"`;
        }

        const notifications = await pb.collection('tenant_notifications').getFullList<TenantNotification>({
            filter,
            requestKey: null
        });

        const stats: NotificationStats = {
            total: notifications.length,
            sent: notifications.filter(n => n.status === 'sent').length,
            pending: notifications.filter(n => n.status === 'pending').length,
            failed: notifications.filter(n => n.status === 'failed').length,
            byChannel: {
                'in-app': 0,
                'email': 0,
                'sms': 0,
                'push': 0,
                'webhook': 0
            },
            byType: {},
            readRate: 0
        };

        // Count by channel
        notifications.forEach(n => {
            n.channels.forEach(channel => {
                stats.byChannel[channel]++;
            });
            stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        });

        // Calculate read rate
        const totalReads = notifications.reduce((sum, n) => sum + (n.readBy?.length || 0), 0);
        stats.readRate = notifications.length > 0 ? Math.round((totalReads / notifications.length) * 100) : 0;

        return stats;
    }
}

export const tenantNotificationService = new TenantNotificationService();
