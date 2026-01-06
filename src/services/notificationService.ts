import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

/**
 * Notification Service
 * Handles in-app, email, SMS, and push notifications
 */

export interface NotificationData {
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    action_url?: string;
    category?: 'academic' | 'system' | 'social' | 'finance' | 'announcement';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    expires_at?: string;
}

export interface NotificationRecord extends RecordModel {
    user: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    action_url?: string;
    category?: string;
    priority?: string;
    is_read: boolean;
    read_at?: string;
    expires_at?: string;
    expand?: {
        user?: RecordModel & { name?: string };
    };
}

export interface NotificationPreferences {
    userId: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    categories: {
        academic: boolean;
        system: boolean;
        social: boolean;
        finance: boolean;
        announcement: boolean;
    };
    quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
    {
        id: 'notif-1',
        collectionId: 'mock',
        collectionName: 'notifications',
        user: 'student-1',
        title: 'New Assignment Posted',
        message: 'Algebra Problem Set 3 is due on Friday',
        type: 'info',
        category: 'academic',
        priority: 'normal',
        is_read: false,
        action_url: '/student/assignments',
        created: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'notif-2',
        collectionId: 'mock',
        collectionName: 'notifications',
        user: 'student-1',
        title: 'Grade Posted',
        message: 'Your grade for "Physics Lab Report" is 92',
        type: 'success',
        category: 'academic',
        priority: 'normal',
        is_read: true,
        read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'notif-3',
        collectionId: 'mock',
        collectionName: 'notifications',
        user: 'teacher-1',
        title: 'New Submission',
        message: 'John Smith submitted "Algebra Problem Set 2"',
        type: 'info',
        category: 'academic',
        priority: 'normal',
        is_read: false,
        created: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
        id: 'notif-4',
        collectionId: 'mock',
        collectionName: 'notifications',
        user: 'parent-1',
        title: 'Attendance Alert',
        message: 'Your child was marked Late today',
        type: 'warning',
        category: 'academic',
        priority: 'high',
        is_read: false,
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_PREFERENCES: NotificationPreferences[] = [
    {
        userId: 'student-1',
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        categories: {
            academic: true,
            system: true,
            social: true,
            finance: false,
            announcement: true
        }
    }
];

class NotificationService {
    /**
     * Send in-app notification
     */
    async sendInApp(data: NotificationData): Promise<NotificationRecord> {
        if (isMockEnv()) {
            const newNotif: NotificationRecord = {
                id: `notif-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'notifications',
                user: data.user_id,
                title: data.title,
                message: data.message,
                type: data.type,
                action_url: data.action_url,
                category: data.category,
                priority: data.priority || 'normal',
                is_read: false,
                expires_at: data.expires_at,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_NOTIFICATIONS.push(newNotif);
            return newNotif;
        }

        try {
            return await pb.collection('notifications').create<NotificationRecord>({
                user: data.user_id,
                title: data.title,
                message: data.message,
                type: data.type,
                action_url: data.action_url,
                category: data.category,
                priority: data.priority || 'normal',
                is_read: false,
                expires_at: data.expires_at
            });
        } catch (error) {
            console.error('Failed to send in-app notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user
     */
    async getNotifications(userId: string, page = 1, perPage = 20): Promise<{
        items: NotificationRecord[];
        page: number;
        perPage: number;
        totalItems: number;
        totalPages: number;
    }> {
        if (isMockEnv()) {
            const filtered = MOCK_NOTIFICATIONS.filter(n => n.user === userId)
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
            const start = (page - 1) * perPage;
            const items = filtered.slice(start, start + perPage);
            return {
                items,
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        return await pb.collection('notifications').getList<NotificationRecord>(page, perPage, {
            filter: `user = "${userId}"`,
            sort: '-created',
            requestKey: null
        });
    }

    /**
     * Get notification by ID
     */
    async getNotification(id: string): Promise<NotificationRecord> {
        if (isMockEnv()) {
            const notif = MOCK_NOTIFICATIONS.find(n => n.id === id);
            if (!notif) throw new Error('Notification not found');
            return notif;
        }
        return await pb.collection('notifications').getOne<NotificationRecord>(id, {
            requestKey: null
        });
    }

    /**
     * Send notification to multiple users
     */
    async sendBulkInApp(userIds: string[], data: Omit<NotificationData, 'user_id'>): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const userId of userIds) {
            try {
                await this.sendInApp({ ...data, user_id: userId });
                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Send notification to all users with a specific role
     */
    async sendToRole(role: string, data: Omit<NotificationData, 'user_id'>): Promise<{ success: number; failed: number }> {
        if (isMockEnv()) {
            // Mock: assume we sent to 5 users
            return { success: 5, failed: 0 };
        }

        try {
            // Fetch all users with the specified role
            const users = await pb.collection('users').getFullList({
                filter: `role = "${role}"`,
                requestKey: null
            });

            const userIds = users.map(user => user.id);
            return await this.sendBulkInApp(userIds, data);
        } catch (error) {
            console.error(`Failed to send notifications to role ${role}:`, error);
            throw error;
        }
    }

    /**
     * Send notification to a tenant
     */
    async sendToTenant(tenantId: string, data: Omit<NotificationData, 'user_id'>): Promise<{ success: number; failed: number }> {
        if (isMockEnv()) {
            return { success: 10, failed: 0 };
        }

        try {
            const users = await pb.collection('users').getFullList({
                filter: `tenantId = "${tenantId}"`,
                requestKey: null
            });

            const userIds = users.map(user => user.id);
            return await this.sendBulkInApp(userIds, data);
        } catch (error) {
            console.error(`Failed to send notifications to tenant ${tenantId}:`, error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        if (isMockEnv()) {
            const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                MOCK_NOTIFICATIONS[index].is_read = true;
                MOCK_NOTIFICATIONS[index].read_at = new Date().toISOString();
            }
            return;
        }

        try {
            await pb.collection('notifications').update(notificationId, {
                is_read: true,
                read_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        if (isMockEnv()) {
            let count = 0;
            MOCK_NOTIFICATIONS.forEach(n => {
                if (n.user === userId && !n.is_read) {
                    n.is_read = true;
                    n.read_at = new Date().toISOString();
                    count++;
                }
            });
            return count;
        }

        try {
            const notifications = await pb.collection('notifications').getFullList<NotificationRecord>({
                filter: `user = "${userId}" && is_read = false`,
                requestKey: null
            });

            const promises = notifications.map(notif =>
                this.markAsRead(notif.id)
            );

            await Promise.all(promises);
            return notifications.length;
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string): Promise<void> {
        if (isMockEnv()) {
            const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                MOCK_NOTIFICATIONS.splice(index, 1);
            }
            return;
        }

        try {
            await pb.collection('notifications').delete(notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    }

    /**
     * Delete all read notifications for a user
     */
    async clearReadNotifications(userId: string): Promise<number> {
        if (isMockEnv()) {
            const before = MOCK_NOTIFICATIONS.length;
            const indices = MOCK_NOTIFICATIONS
                .map((n, i) => n.user === userId && n.is_read ? i : -1)
                .filter(i => i !== -1);
            indices.reverse().forEach(i => MOCK_NOTIFICATIONS.splice(i, 1));
            return before - MOCK_NOTIFICATIONS.length;
        }

        const notifications = await pb.collection('notifications').getFullList<NotificationRecord>({
            filter: `user = "${userId}" && is_read = true`,
            requestKey: null
        });

        for (const notif of notifications) {
            await pb.collection('notifications').delete(notif.id);
        }

        return notifications.length;
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        if (isMockEnv()) {
            return MOCK_NOTIFICATIONS.filter(n => n.user === userId && !n.is_read).length;
        }

        try {
            const result = await pb.collection('notifications').getList(1, 1, {
                filter: `user = "${userId}" && is_read = false`,
                requestKey: null
            });
            return result.totalItems;
        } catch (error) {
            console.error('Failed to get unread count:', error);
            return 0;
        }
    }

    /**
     * Get notification statistics for a user
     */
    async getStats(userId: string): Promise<{
        total: number;
        unread: number;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
    }> {
        const { items } = await this.getNotifications(userId, 1, 1000);

        const byType: Record<string, number> = {};
        const byCategory: Record<string, number> = {};

        for (const notif of items) {
            byType[notif.type] = (byType[notif.type] || 0) + 1;
            if (notif.category) {
                byCategory[notif.category] = (byCategory[notif.category] || 0) + 1;
            }
        }

        return {
            total: items.length,
            unread: items.filter(n => !n.is_read).length,
            byType,
            byCategory
        };
    }

    /**
     * Get notification preferences for a user
     */
    async getPreferences(userId: string): Promise<NotificationPreferences> {
        if (isMockEnv()) {
            return MOCK_PREFERENCES.find(p => p.userId === userId) || {
                userId,
                emailEnabled: true,
                pushEnabled: true,
                smsEnabled: false,
                categories: {
                    academic: true,
                    system: true,
                    social: true,
                    finance: true,
                    announcement: true
                }
            };
        }

        try {
            const prefs = await pb.collection('notification_preferences').getFirstListItem<NotificationPreferences>(
                `userId = "${userId}"`,
                { requestKey: null }
            );
            return prefs;
        } catch {
            // Return defaults if not found
            return {
                userId,
                emailEnabled: true,
                pushEnabled: true,
                smsEnabled: false,
                categories: {
                    academic: true,
                    system: true,
                    social: true,
                    finance: true,
                    announcement: true
                }
            };
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
        if (isMockEnv()) {
            const index = MOCK_PREFERENCES.findIndex(p => p.userId === userId);
            if (index !== -1) {
                MOCK_PREFERENCES[index] = { ...MOCK_PREFERENCES[index], ...prefs };
                return MOCK_PREFERENCES[index];
            }
            const newPrefs: NotificationPreferences = {
                userId,
                emailEnabled: prefs.emailEnabled ?? true,
                pushEnabled: prefs.pushEnabled ?? true,
                smsEnabled: prefs.smsEnabled ?? false,
                categories: prefs.categories ?? {
                    academic: true,
                    system: true,
                    social: true,
                    finance: true,
                    announcement: true
                }
            };
            MOCK_PREFERENCES.push(newPrefs);
            return newPrefs;
        }

        try {
            const existing = await pb.collection('notification_preferences').getFirstListItem(
                `userId = "${userId}"`,
                { requestKey: null }
            );
            return await pb.collection('notification_preferences').update<NotificationPreferences>(existing.id, prefs);
        } catch {
            return await pb.collection('notification_preferences').create<NotificationPreferences>({
                userId,
                ...prefs
            });
        }
    }

    /**
     * Clean up expired notifications
     */
    async cleanupExpired(): Promise<number> {
        const now = new Date().toISOString();

        if (isMockEnv()) {
            const before = MOCK_NOTIFICATIONS.length;
            const indices = MOCK_NOTIFICATIONS
                .map((n, i) => n.expires_at && n.expires_at < now ? i : -1)
                .filter(i => i !== -1);
            indices.reverse().forEach(i => MOCK_NOTIFICATIONS.splice(i, 1));
            return before - MOCK_NOTIFICATIONS.length;
        }

        const expired = await pb.collection('notifications').getFullList<NotificationRecord>({
            filter: `expires_at < "${now}"`,
            requestKey: null
        });

        for (const notif of expired) {
            await pb.collection('notifications').delete(notif.id);
        }

        return expired.length;
    }

    /**
     * Helper: Notify student about new assignment
     */
    async notifyNewAssignment(studentIds: string[], assignmentTitle: string, dueDate: string): Promise<void> {
        await this.sendBulkInApp(studentIds, {
            title: 'New Assignment',
            message: `${assignmentTitle} is due on ${new Date(dueDate).toLocaleDateString()}`,
            type: 'info'
        });
    }

    /**
     * Helper: Notify student about grade posted
     */
    async notifyGradePosted(studentId: string, assignmentTitle: string, score: number): Promise<void> {
        await this.sendInApp({
            user_id: studentId,
            title: 'Grade Posted',
            message: `Your grade for "${assignmentTitle}" is ${score}`,
            type: 'success'
        });
    }

    /**
     * Helper: Notify teacher about new submission
     */
    async notifyNewSubmission(teacherId: string, studentName: string, assignmentTitle: string): Promise<void> {
        await this.sendInApp({
            user_id: teacherId,
            title: 'New Submission',
            message: `${studentName} submitted "${assignmentTitle}"`,
            type: 'info'
        });
    }

    /**
     * Helper: Notify parent about student attendance
     */
    async notifyAttendance(parentId: string, studentName: string, status: string, date: string): Promise<void> {
        const type = status === 'Absent' ? 'warning' : 'info';
        await this.sendInApp({
            user_id: parentId,
            title: 'Attendance Update',
            message: `${studentName} was marked ${status} on ${new Date(date).toLocaleDateString()}`,
            type
        });
    }
}

export const notificationService = new NotificationService();
