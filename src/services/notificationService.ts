/**
 * Advanced Notification Service - Enterprise Production Implementation
 * Multi-channel, real-time notifications with delivery tracking, retries, and analytics
 * @version 2.2.0
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { User } from './userService';
import { Logger, LogLevel } from '../utils/logging';
import { TypedError, ErrorType, normalizeError } from '../utils/errorHandling';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import env from '../config/environment';
import { z } from 'zod';
import { EventEmitter } from 'events';
import { MetadataValue, MetadataValueSchema } from '../types/common';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

export type NotificationType =
  | 'assignment_due'
  | 'grade_posted'
  | 'message'
  | 'system'
  | 'announcement'
  | 'reminder'
  | 'course_update'
  | 'payment'
  | 'attendance'
  | 'achievement'
  | 'alert'
  | 'invitation'
  | 'deadline'
  | 'approval_required'
  | 'status_change';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook' | 'slack';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
export type NotificationCategory = 'academic' | 'system' | 'social' | 'finance' | 'announcement' | 'alert' | 'reminder';

const NotificationDataSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum([
    'assignment_due', 'grade_posted', 'message', 'system', 'announcement',
    'reminder', 'course_update', 'payment', 'attendance', 'achievement',
    'alert', 'invitation', 'deadline', 'approval_required', 'status_change'
  ]),
  actionUrl: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'urgent']).default('medium'),
  channels: z.array(z.enum(['in_app', 'email', 'sms', 'push', 'webhook', 'slack'])).default(['in_app']),
  category: z.enum(['academic', 'system', 'social', 'finance', 'announcement', 'alert', 'reminder']).default('system'),
  metadata: z.record(z.string(), MetadataValueSchema).optional(),
  tenantId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    type: z.string()
  })).optional(),
  actions: z.array(z.object({
    label: z.string(),
    url: z.string(),
    type: z.enum(['primary', 'secondary', 'danger'])
  })).optional()
});

const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  webhookEnabled: z.boolean().default(false),
  slackEnabled: z.boolean().default(false),
  categories: z.object({
    academic: z.boolean().default(true),
    system: z.boolean().default(true),
    social: z.boolean().default(true),
    finance: z.boolean().default(true),
    announcement: z.boolean().default(true),
    alert: z.boolean().default(true),
    reminder: z.boolean().default(true)
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string().default('UTC')
  }).optional(),
  digest: z.object({
    enabled: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00')
  }).optional(),
  priorityThreshold: z.enum(['low', 'medium', 'high', 'critical', 'urgent']).default('low')
});

export type NotificationData = z.infer<typeof NotificationDataSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export interface DeliveryStatus {
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  attempts: number;
  last_attempt?: string;
  error?: string;
}

export interface NotificationRecord extends RecordModel {
  user: string;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  scheduled_for?: string;
  sent_at?: string;
  delivered_at?: string;
  channels: NotificationChannel[];
  delivery_status: Record<NotificationChannel, DeliveryStatus>;
  metadata?: Record<string, MetadataValue>;
  attachments?: Array<{ url: string; name: string; type: string }>;
  actions?: Array<{ label: string; url: string; type: string }>;
  template_id?: string;
  tenant_id?: string;
  expand?: {
    user?: RecordModel & { name?: string; email?: string; phone?: string };
  };
}

export interface NotificationTemplate extends RecordModel {
  name: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  category: NotificationCategory;
  variables: string[];
  active: boolean;
}

export interface BulkNotificationResult {
  total: number;
  success: number;
  failed: number;
  pending: number;
  errors: Array<{ userId: string; error: string }>;
  jobId: string;
}

// ============================================================================
// EVENT EMITTER
// ============================================================================

class NotificationEventEmitter extends EventEmitter {
  emitNotificationSent(notification: NotificationRecord) {
    this.emit('notification:sent', notification);
  }
  
  emitNotificationDelivered(notification: NotificationRecord, channel: NotificationChannel) {
    this.emit('notification:delivered', { notification, channel });
  }
  
  emitNotificationRead(notification: NotificationRecord) {
    this.emit('notification:read', notification);
  }
  
  emitNotificationFailed(notification: NotificationRecord, channel: NotificationChannel, error: Error) {
    this.emit('notification:failed', { notification, channel, error });
  }
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

class NotificationService {
  private readonly logger = new Logger({ storageName: 'NotificationService', minLevel: LogLevel.INFO });
  private readonly events = new NotificationEventEmitter();
  private readonly deliveryQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly retryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  /**
   * Send notification with full validation and multi-channel support
   */
  async send(data: NotificationData): Promise<NotificationRecord> {
    try {
      const validated = NotificationDataSchema.parse(data);
      this.logger.info('Sending notification', { userId: validated.userId, type: validated.type });

      const preferences = await this.getPreferences(validated.userId);
      const allowedChannels = this.filterChannelsByPreferences(validated.channels, preferences, validated);

      if (allowedChannels.length === 0) {
        this.logger.warn('No allowed channels for notification', { userId: validated.userId });
        throw new TypedError('No notification channels enabled for user', ErrorType.VALIDATION, 400);
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        if (validated.priority !== 'critical' && validated.priority !== 'urgent') {
          const scheduledFor = this.calculateNextSendTime(preferences);
          validated.scheduledFor = scheduledFor;
          this.logger.info('Scheduling notification for after quiet hours', { scheduledFor });
        }
      }

      const recordData = {
        user: validated.userId,
        title: validated.title,
        message: validated.message,
        type: validated.type,
        action_url: validated.actionUrl,
        category: validated.category,
        priority: validated.priority,
        status: 'pending' as NotificationStatus,
        is_read: false,
        channels: allowedChannels,
        delivery_status: this.initializeDeliveryStatus(allowedChannels),
        expires_at: validated.expiresAt,
        scheduled_for: validated.scheduledFor,
        metadata: validated.metadata,
        attachments: validated.attachments,
        actions: validated.actions,
        template_id: validated.templateId,
        tenant_id: validated.tenantId
      };

      const notification = await pb.collection('notifications').create<NotificationRecord>(recordData);

      if (!validated.scheduledFor || new Date(validated.scheduledFor) <= new Date()) {
        // Run delivery in background
        this.deliverToChannels(notification, allowedChannels);
      } else {
        this.scheduleDelivery(notification);
      }

      this.events.emitNotificationSent(notification);
      return notification;
    } catch (error) {
      this.logger.error('Failed to send notification', { error, data });
      throw normalizeError(error);
    }
  }

  /**
   * Alias for send() to match some existing docs/code
   */
  async createNotification(data: NotificationData): Promise<NotificationRecord> {
    return this.send(data);
  }

  async sendFromTemplate(
    templateId: string,
    userId: string,
    templateData: Record<string, any>
  ): Promise<NotificationRecord> {
    const template = await this.getTemplate(templateId);
    
    if (!template.active) {
      throw new TypedError('Template is not active', ErrorType.VALIDATION, 400);
    }

    const title = this.renderTemplate(template.title_template, templateData);
    const message = this.renderTemplate(template.message_template, templateData);

    return this.send({
      userId,
      title,
      message,
      type: template.type,
      priority: template.priority,
      category: template.category,
      channels: template.channels,
      templateId,
      templateData
    });
  }

  async sendBulk(
    userIds: string[],
    data: Omit<NotificationData, 'userId'>,
    options: { batchSize?: number; delayMs?: number } = {}
  ): Promise<BulkNotificationResult> {
    const { batchSize = 50, delayMs = 100 } = options;
    const jobId = `bulk-${Date.now()}`;

    const result: BulkNotificationResult = {
      total: userIds.length,
      success: 0,
      failed: 0,
      pending: userIds.length,
      errors: [],
      jobId
    };

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(userId => this.send({ ...data, userId } as NotificationData))
      );

      results.forEach((r, idx) => {
        result.pending--;
        if (r.status === 'fulfilled') {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({
            userId: batch[idx],
            error: r.reason instanceof Error ? r.reason.message : 'Unknown error'
          });
        }
      });

      if (i + batchSize < userIds.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return result;
  }

  /**
   * Alias for sendBulk()
   */
  async sendBulkNotifications(userIds: string[], data: Omit<NotificationData, 'userId'>): Promise<BulkNotificationResult> {
    return this.sendBulk(userIds, data);
  }

  /**
   * Broadcast to all users
   */
  async broadcast(data: Omit<NotificationData, 'userId'>): Promise<BulkNotificationResult> {
    const users = await pb.collection('users').getFullList({ fields: 'id' });
    const userIds = users.map(u => u.id);
    return this.sendBulk(userIds, data);
  }

  async getNotifications(
    filter: { userId?: string; tenantId?: string; isRead?: boolean; category?: NotificationCategory },
    options: { page?: number; perPage?: number; sort?: string } = {}
  ) {
    const { page = 1, perPage = 50, sort = '-created' } = options;
    const filterParts: string[] = [];
    
    if (filter.userId) filterParts.push(`user = "${filter.userId}"`);
    if (filter.tenantId) filterParts.push(`tenant_id = "${filter.tenantId}"`);
    if (filter.isRead !== undefined) filterParts.push(`is_read = ${filter.isRead}`);
    if (filter.category) filterParts.push(`category = "${filter.category}"`);

    const result = await pb.collection('notifications').getList<NotificationRecord>(page, perPage, {
      filter: filterParts.join(' && '),
      sort,
      expand: 'user'
    });

    const unreadCount = await this.getUnreadCount(filter.userId || '');

    return {
      notifications: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      unreadCount
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;
    const result = await pb.collection('notifications').getList(1, 1, {
      filter: `user = "${userId}" && is_read = false`,
      fields: 'id'
    });
    return result.totalItems;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const record = await pb.collection('notification_preferences').getFirstListItem(`userId = "${userId}"`);
      return NotificationPreferencesSchema.parse(record);
    } catch {
      return NotificationPreferencesSchema.parse({ userId });
    }
  }

  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const existing = await pb.collection('notification_preferences').getFirstListItem(`userId = "${userId}"`);
      const updated = await pb.collection('notification_preferences').update(existing.id, updates);
      return NotificationPreferencesSchema.parse(updated);
    } catch {
      const created = await pb.collection('notification_preferences').create({ userId, ...updates });
      return NotificationPreferencesSchema.parse(created);
    }
  }

  /**
   * Alias for updatePreferences
   */
  async updateNotificationPreferences(userId: string, tenantId: string, updates: any): Promise<NotificationPreferences> {
    // tenantId is optional in our schema but kept for compatibility
    return this.updatePreferences(userId, updates);
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    return await pb.collection('notification_templates').getOne<NotificationTemplate>(templateId);
  }

  async markAsRead(notificationId: string): Promise<NotificationRecord> {
    const updated = await pb.collection('notifications').update<NotificationRecord>(notificationId, {
      is_read: true,
      read_at: new Date().toISOString(),
      status: 'read'
    });
    this.events.emitNotificationRead(updated);
    return updated;
  }

  async delete(notificationId: string): Promise<void> {
    await pb.collection('notifications').delete(notificationId);
  }

  async clearAllNotifications(userId: string, tenantId?: string): Promise<void> {
    const filter = tenantId ? `user = "${userId}" && tenant_id = "${tenantId}"` : `user = "${userId}"`;
    const notifications = await pb.collection('notifications').getFullList({ filter, fields: 'id' });
    await Promise.all(notifications.map(n => this.delete(n.id)));
  }

  /**
   * Real-time subscription
   */
  subscribeToRealtime(userId: string, callback: (notification: NotificationRecord) => void) {
    const filter = userId ? `user = "${userId}"` : '';
    pb.collection('notifications').subscribe('*', (e) => {
      if (e.action === 'create') {
        const record = e.record as unknown as NotificationRecord;
        if (!userId || record.user === userId) {
          callback(record);
        }
      }
    }, { filter });

    return () => pb.collection('notifications').unsubscribe('*');
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private initializeDeliveryStatus(channels: NotificationChannel[]): Record<string, DeliveryStatus> {
    const status: Record<string, DeliveryStatus> = {};
    channels.forEach(ch => {
      status[ch] = { status: 'pending', attempts: 0 };
    });
    return status;
  }

  private filterChannelsByPreferences(
    requested: NotificationChannel[],
    prefs: NotificationPreferences,
    data: NotificationData
  ): NotificationChannel[] {
    const allowed: NotificationChannel[] = ['in_app'];
    
    // Check priority threshold
    const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (priorities.indexOf(data.priority) < priorities.indexOf(prefs.priorityThreshold)) {
      return ['in_app'];
    }

    // Check category settings
    if (data.category && !prefs.categories[data.category as keyof typeof prefs.categories]) {
      return ['in_app'];
    }

    requested.forEach(ch => {
      if (ch === 'in_app') return;
      if (ch === 'email' && prefs.emailEnabled) allowed.push(ch);
      if (ch === 'sms' && prefs.smsEnabled) allowed.push(ch);
      if (ch === 'push' && prefs.pushEnabled) allowed.push(ch);
      if (ch === 'webhook' && prefs.webhookEnabled) allowed.push(ch);
      if (ch === 'slack' && prefs.slackEnabled) allowed.push(ch);
    });

    return allowed;
  }

  private isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours?.enabled) return false;
    
    const now = new Date();
    // Simple UTC-based hour comparison for now
    const currentHour = now.getUTCHours();
    const currentMin = now.getUTCMinutes();
    const currentTimeNum = currentHour * 60 + currentMin;

    const [startH, startM] = prefs.quietHours.start.split(':').map(Number);
    const [endH, endM] = prefs.quietHours.end.split(':').map(Number);
    
    const startNum = startH * 60 + startM;
    const endNum = endH * 60 + endM;

    if (startNum < endNum) {
      return currentTimeNum >= startNum && currentTimeNum < endNum;
    } else {
      return currentTimeNum >= startNum || currentTimeNum < endNum;
    }
  }

  private calculateNextSendTime(prefs: NotificationPreferences): string {
    const now = new Date();
    const [endH, endM] = prefs.quietHours!.end.split(':').map(Number);
    const next = new Date(now);
    next.setUTCHours(endH, endM, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
  }

  private async deliverToChannels(notification: NotificationRecord, channels: NotificationChannel[]) {
    await Promise.allSettled(channels.map(ch => this.deliverToChannel(notification, ch)));
  }

  private async deliverToChannel(notification: NotificationRecord, channel: NotificationChannel) {
    try {
      this.logger.debug(`Delivering to ${channel}`, { id: notification.id });
      
      switch (channel) {
        case 'email':
          await this.deliverEmail(notification);
          break;
        case 'sms':
          await this.deliverSms(notification);
          break;
        case 'push':
          await this.deliverPush(notification);
          break;
        case 'webhook':
          await this.deliverWebhook(notification);
          break;
        case 'slack':
          await this.deliverSlack(notification);
          break;
        case 'in_app':
          // Already in DB, no external call needed
          break;
      }

      await this.updateDeliveryStatus(notification.id, channel, 'delivered');
      this.events.emitNotificationDelivered(notification, channel);
    } catch (error) {
      this.logger.error(`Delivery failed for ${channel}`, { error, id: notification.id });
      await this.handleDeliveryFailure(notification, channel, error as Error);
    }
  }

  private async deliverEmail(n: NotificationRecord) {
    const user = n.expand?.user || await pb.collection('users').getOne<User>(n.user);
    if (!user.email) throw new Error('User has no email');
    await emailService.send({
      to: [user.email],
      subject: n.title,
      html_body: `<p>${n.message}</p>${n.action_url ? `<a href="${env.get('appUrl')}${n.action_url}">View</a>` : ''}`,
      tag: n.type
    });
  }

  private async deliverSms(n: NotificationRecord) {
    const user = n.expand?.user || await pb.collection('users').getOne<User>(n.user);
    if (!user.phone) throw new Error('User has no phone');
    await smsService.send({
      to: user.phone,
      message: `${n.title}: ${n.message}`
    });
  }

  private async deliverPush(n: NotificationRecord) {
    await pushService.sendToUser({
      userId: n.user,
      title: n.title,
      body: n.message,
      url: n.action_url,
      tag: n.type
    });
  }

  private async deliverWebhook(n: NotificationRecord) {
    const webhooks = await pb.collection('webhooks').getFullList({
      filter: `user = "${n.user}" && status = "active"`
    });
    await Promise.all(webhooks.map(w => fetch(w.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'notification', data: n })
    })));
  }

  private async deliverSlack(n: NotificationRecord) {
    const slackUrl = env.get('slackWebhookUrl');
    if (!slackUrl) return;
    await fetch(slackUrl, {
      method: 'POST',
      body: JSON.stringify({ text: `*${n.title}*\n${n.message}` })
    });
  }

  private async updateDeliveryStatus(id: string, channel: NotificationChannel, status: 'delivered' | 'failed', error?: string) {
    const n = await pb.collection('notifications').getOne<NotificationRecord>(id);
    const deliveryStatus = { ...n.delivery_status };
    deliveryStatus[channel] = {
      ...deliveryStatus[channel],
      status,
      attempts: (deliveryStatus[channel]?.attempts || 0) + 1,
      last_attempt: new Date().toISOString(),
      error
    };
    
    const updates: any = { delivery_status: deliveryStatus };
    if (status === 'delivered') {
      updates.status = 'delivered';
      updates.delivered_at = new Date().toISOString();
    }

    await pb.collection('notifications').update(id, updates);
  }

  private async handleDeliveryFailure(n: NotificationRecord, channel: NotificationChannel, error: Error) {
    const attempts = (n.delivery_status[channel]?.attempts || 0) + 1;
    if (attempts < this.retryConfig.maxAttempts) {
      const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempts);
      setTimeout(() => this.deliverToChannel(n, channel), delay);
    } else {
      await this.updateDeliveryStatus(n.id, channel, 'failed', error.message);
      this.events.emitNotificationFailed(n, channel, error);
    }
  }

  private scheduleDelivery(n: NotificationRecord) {
    const delay = new Date(n.scheduled_for!).getTime() - Date.now();
    if (delay <= 0) {
      this.deliverToChannels(n, n.channels);
      return;
    }
    const timeout = setTimeout(() => this.deliverToChannels(n, n.channels), delay);
    this.deliveryQueue.set(n.id, timeout);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/{{([\w.]+)}}/g, (match, key) => {
      const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], data);
      return value !== undefined ? String(value) : match;
    });
  }
}

export const notificationService = new NotificationService();
