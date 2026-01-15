import { NotificationRecord, NotificationPreferences } from '../notificationService';

export const MOCK_NOTIFICATIONS: NotificationRecord[] = [
    {
        id: 'notif-1',
        collectionId: 'mock',
        collectionName: 'notifications',
        user: 'student-1',
        title: 'New Assignment Posted',
        message: 'Algebra Problem Set 3 is due on Friday',
        type: 'assignment_due',
        category: 'academic',
        priority: 'medium',
        status: 'delivered',
        is_read: false,
        action_url: '/student/assignments',
        channels: ['in_app', 'email'],
        delivery_status: {
          in_app: { status: 'delivered', attempts: 1, last_attempt: new Date().toISOString() },
          email: { status: 'sent', attempts: 1, last_attempt: new Date().toISOString() },
          sms: { status: 'pending', attempts: 0 },
          push: { status: 'pending', attempts: 0 },
          webhook: { status: 'pending', attempts: 0 },
          slack: { status: 'pending', attempts: 0 }
        },
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
        type: 'grade_posted',
        category: 'academic',
        priority: 'medium',
        status: 'read',
        is_read: true,
        read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        channels: ['in_app'],
        delivery_status: {
          in_app: { status: 'delivered', attempts: 1, last_attempt: new Date().toISOString() },
          email: { status: 'pending', attempts: 0 },
          sms: { status: 'pending', attempts: 0 },
          push: { status: 'pending', attempts: 0 },
          webhook: { status: 'pending', attempts: 0 },
          slack: { status: 'pending', attempts: 0 }
        },
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
        type: 'message',
        category: 'academic',
        priority: 'low',
        status: 'sent',
        is_read: false,
        channels: ['in_app'],
        delivery_status: {
          in_app: { status: 'sent', attempts: 1, last_attempt: new Date().toISOString() },
          email: { status: 'pending', attempts: 0 },
          sms: { status: 'pending', attempts: 0 },
          push: { status: 'pending', attempts: 0 },
          webhook: { status: 'pending', attempts: 0 },
          slack: { status: 'pending', attempts: 0 }
        },
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
        type: 'alert',
        category: 'academic',
        priority: 'high',
        status: 'pending',
        is_read: false,
        channels: ['in_app', 'email'],
        delivery_status: {
          in_app: { status: 'pending', attempts: 0 },
          email: { status: 'pending', attempts: 0 },
          sms: { status: 'pending', attempts: 0 },
          push: { status: 'pending', attempts: 0 },
          webhook: { status: 'pending', attempts: 0 },
          slack: { status: 'pending', attempts: 0 }
        },
        created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
];

export const MOCK_PREFERENCES: NotificationPreferences[] = [
    {
        userId: 'student-1',
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        webhookEnabled: false,
        slackEnabled: false,
        categories: {
            academic: true,
            system: true,
            social: true,
            finance: false,
            announcement: true,
            alert: true,
            reminder: true
        },
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00',
            timezone: 'UTC'
        },
        digest: {
            enabled: false,
            frequency: 'daily',
            time: '09:00'
        },
        priorityThreshold: 'low'
    }
];
