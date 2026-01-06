import { NotificationRecord, NotificationPreferences } from '../notificationService';

export const MOCK_NOTIFICATIONS: NotificationRecord[] = [
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

export const MOCK_PREFERENCES: NotificationPreferences[] = [
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
