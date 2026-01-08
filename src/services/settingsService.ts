import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface AccountSettings {
    id?: string;
    username?: string;
    email?: string;
    name?: string;
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export interface ThemeSettings extends RecordModel {
    user: string;
    theme: 'light' | 'dark' | 'system';
    primaryColor: string;
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
    highContrast: boolean;
}

export interface NotificationSettings extends RecordModel {
    user: string;
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    weekly_digest: boolean;
    instant_alerts: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
}

export interface PrivacySettings extends RecordModel {
    user: string;
    profile_visibility: 'public' | 'private' | 'contacts';
    show_online_status: boolean;
    show_activity_status: boolean;
    allow_search_indexing: boolean;
    share_analytics: boolean;
}

export interface PlatformConfig extends RecordModel {
    key: string;
    value: string;
    category: string;
    description?: string;
}

export interface APIKey extends RecordModel {
    user: string;
    name: string;
    key: string;
    last_used?: string;
    expires?: string;
    permissions: string[];
    active: boolean;
}

// Mock Data
const MOCK_ACCOUNT_SETTINGS: AccountSettings = {
    id: 'user-1',
    username: 'johndoe',
    email: 'john@example.com',
    name: 'John Doe',
    avatar: '',
    phone: '+1234567890',
    timezone: 'America/New_York',
    language: 'en'
};

const MOCK_THEME_SETTINGS: ThemeSettings = {
    id: 'theme-1',
    user: 'user-1',
    theme: 'dark',
    primaryColor: '#6366f1',
    accentColor: '#22c55e',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    collectionId: '', collectionName: '', created: '', updated: ''
};

const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
    id: 'notif-1',
    user: 'user-1',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    weekly_digest: true,
    instant_alerts: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    collectionId: '', collectionName: '', created: '', updated: ''
};

const MOCK_PRIVACY_SETTINGS: PrivacySettings = {
    id: 'privacy-1',
    user: 'user-1',
    profile_visibility: 'contacts',
    show_online_status: true,
    show_activity_status: true,
    allow_search_indexing: false,
    share_analytics: true,
    collectionId: '', collectionName: '', created: '', updated: ''
};

const MOCK_PLATFORM_CONFIG: PlatformConfig[] = [
    { id: 'config-1', key: 'site_name', value: 'Grow Your Need', category: 'general', description: 'Platform name', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'config-2', key: 'maintenance_mode', value: 'false', category: 'system', description: 'Enable maintenance mode', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'config-3', key: 'max_upload_size', value: '10485760', category: 'limits', description: 'Max upload size in bytes (10MB)', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'config-4', key: 'enable_registration', value: 'true', category: 'auth', description: 'Allow new user registration', collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'config-5', key: 'default_theme', value: 'dark', category: 'appearance', description: 'Default theme for new users', collectionId: '', collectionName: '', created: '', updated: '' }
];

const MOCK_API_KEYS: APIKey[] = [
    {
        id: 'key-1',
        user: 'user-1',
        name: 'Production API Key',
        key: env.get('serviceApiKey') || 'gyn_prod_xxxxxxxxxxxxxxxxxxxx',
        last_used: '2024-01-25T10:30:00Z',
        expires: '2025-01-25T00:00:00Z',
        permissions: ['read', 'write'],
        active: true,
        collectionId: '', collectionName: '', created: '2024-01-01T00:00:00Z', updated: ''
    },
    {
        id: 'key-2',
        user: 'user-1',
        name: 'Development Key',
        key: 'gyn_dev_yyyyyyyyyyyyyyyyyyyy',
        last_used: '2024-01-20T15:45:00Z',
        permissions: ['read'],
        active: true,
        collectionId: '', collectionName: '', created: '2024-01-10T00:00:00Z', updated: ''
    }
];

export const settingsService = {
    // Account Settings
    getAccountSettings: async (userId: string): Promise<AccountSettings | null> => {
        if (isMockEnv()) {
            return { ...MOCK_ACCOUNT_SETTINGS, id: userId };
        }

        try {
            return await pb.collection('users').getOne(userId);
        } catch {
            return null;
        }
    },

    updateAccountSettings: async (userId: string, data: AccountSettings): Promise<AccountSettings | null> => {
        if (isMockEnv()) {
            Object.assign(MOCK_ACCOUNT_SETTINGS, data);
            return MOCK_ACCOUNT_SETTINGS;
        }

        try {
            return await pb.collection('users').update(userId, data);
        } catch {
            return null;
        }
    },

    updatePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<boolean> => {
        if (isMockEnv()) {
            return true; // Always succeed in mock mode
        }

        try {
            await pb.collection('users').update(userId, {
                oldPassword,
                password: newPassword,
                passwordConfirm: newPassword
            });
            return true;
        } catch {
            return false;
        }
    },

    updateAvatar: async (userId: string, file: File): Promise<string | null> => {
        if (isMockEnv()) {
            return URL.createObjectURL(file);
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const user = await pb.collection('users').update(userId, formData);
            return user.avatar;
        } catch {
            return null;
        }
    },

    // Theme/Appearance Settings
    getThemeSettings: async (userId: string): Promise<ThemeSettings | null> => {
        if (isMockEnv()) {
            return { ...MOCK_THEME_SETTINGS, user: userId };
        }

        try {
            return await pb.collection('user_preferences').getFirstListItem<ThemeSettings>(`user="${userId}"`);
        } catch {
            // Return defaults if not found
            return {
                id: '',
                user: userId,
                theme: 'system',
                primaryColor: '#6366f1',
                accentColor: '#22c55e',
                fontSize: 'medium',
                reducedMotion: false,
                highContrast: false,
                collectionId: '', collectionName: '', created: '', updated: ''
            };
        }
    },

    updateThemeSettings: async (userId: string, data: Partial<ThemeSettings>): Promise<ThemeSettings | null> => {
        if (isMockEnv()) {
            Object.assign(MOCK_THEME_SETTINGS, data);
            return MOCK_THEME_SETTINGS;
        }

        try {
            const existing = await pb.collection('user_preferences').getFirstListItem<ThemeSettings>(`user="${userId}"`);
            return await pb.collection('user_preferences').update(existing.id, data);
        } catch {
            // Create if doesn't exist
            return await pb.collection('user_preferences').create({
                user: userId,
                ...data
            });
        }
    },

    // Notification Settings
    getNotificationSettings: async (userId: string): Promise<NotificationSettings | null> => {
        if (isMockEnv()) {
            return { ...MOCK_NOTIFICATION_SETTINGS, user: userId };
        }

        try {
            return await pb.collection('notification_settings').getFirstListItem<NotificationSettings>(`user="${userId}"`);
        } catch {
            return {
                id: '',
                user: userId,
                email_notifications: true,
                push_notifications: true,
                sms_notifications: false,
                marketing_emails: false,
                weekly_digest: true,
                instant_alerts: true,
                collectionId: '', collectionName: '', created: '', updated: ''
            };
        }
    },

    updateNotificationSettings: async (userId: string, data: Partial<NotificationSettings>): Promise<NotificationSettings | null> => {
        if (isMockEnv()) {
            Object.assign(MOCK_NOTIFICATION_SETTINGS, data);
            return MOCK_NOTIFICATION_SETTINGS;
        }

        try {
            const existing = await pb.collection('notification_settings').getFirstListItem<NotificationSettings>(`user="${userId}"`);
            return await pb.collection('notification_settings').update(existing.id, data);
        } catch {
            return await pb.collection('notification_settings').create({
                user: userId,
                ...data
            });
        }
    },

    // Privacy Settings
    getPrivacySettings: async (userId: string): Promise<PrivacySettings | null> => {
        if (isMockEnv()) {
            return { ...MOCK_PRIVACY_SETTINGS, user: userId };
        }

        try {
            return await pb.collection('privacy_settings').getFirstListItem<PrivacySettings>(`user="${userId}"`);
        } catch {
            return {
                id: '',
                user: userId,
                profile_visibility: 'contacts',
                show_online_status: true,
                show_activity_status: true,
                allow_search_indexing: false,
                share_analytics: true,
                collectionId: '', collectionName: '', created: '', updated: ''
            };
        }
    },

    updatePrivacySettings: async (userId: string, data: Partial<PrivacySettings>): Promise<PrivacySettings | null> => {
        if (isMockEnv()) {
            Object.assign(MOCK_PRIVACY_SETTINGS, data);
            return MOCK_PRIVACY_SETTINGS;
        }

        try {
            const existing = await pb.collection('privacy_settings').getFirstListItem<PrivacySettings>(`user="${userId}"`);
            return await pb.collection('privacy_settings').update(existing.id, data);
        } catch {
            return await pb.collection('privacy_settings').create({
                user: userId,
                ...data
            });
        }
    },

    // Platform Configuration
    getPlatformConfig: async (): Promise<PlatformConfig[]> => {
        if (isMockEnv()) {
            return MOCK_PLATFORM_CONFIG;
        }

        try {
            return await pb.collection('platform_config').getFullList<PlatformConfig>({
                sort: 'category,key'
            });
        } catch {
            return [];
        }
    },

    getConfigValue: async (key: string): Promise<string | null> => {
        if (isMockEnv()) {
            const config = MOCK_PLATFORM_CONFIG.find(c => c.key === key);
            return config?.value || null;
        }

        try {
            const config = await pb.collection('platform_config').getFirstListItem<PlatformConfig>(`key="${key}"`);
            return config.value;
        } catch {
            return null;
        }
    },

    updateConfigValue: async (key: string, value: string): Promise<boolean> => {
        if (isMockEnv()) {
            const config = MOCK_PLATFORM_CONFIG.find(c => c.key === key);
            if (config) {
                config.value = value;
            }
            return true;
        }

        try {
            const config = await pb.collection('platform_config').getFirstListItem<PlatformConfig>(`key="${key}"`);
            await pb.collection('platform_config').update(config.id, { value });
            return true;
        } catch {
            return false;
        }
    },

    getConfigByCategory: async (category: string): Promise<PlatformConfig[]> => {
        if (isMockEnv()) {
            return MOCK_PLATFORM_CONFIG.filter(c => c.category === category);
        }

        try {
            return await pb.collection('platform_config').getFullList<PlatformConfig>({
                filter: `category = "${category}"`,
                sort: 'key'
            });
        } catch {
            return [];
        }
    },

    // API Keys Management
    getAPIKeys: async (userId: string): Promise<APIKey[]> => {
        if (isMockEnv()) {
            return MOCK_API_KEYS.filter(k => k.user === userId);
        }

        try {
            return await pb.collection('api_keys').getFullList<APIKey>({
                filter: `user = "${userId}"`,
                sort: '-created'
            });
        } catch {
            return [];
        }
    },

    createAPIKey: async (userId: string, name: string, permissions: string[]): Promise<APIKey | null> => {
        if (isMockEnv()) {
            const newKey: APIKey = {
                id: `key-${Date.now()}`,
                user: userId,
                name,
                key: `gyn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`,
                permissions,
                active: true,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_API_KEYS.push(newKey);
            return newKey;
        }

        try {
            return await pb.collection('api_keys').create({
                user: userId,
                name,
                key: `gyn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`,
                permissions,
                active: true
            });
        } catch {
            return null;
        }
    },

    revokeAPIKey: async (keyId: string): Promise<boolean> => {
        if (isMockEnv()) {
            const key = MOCK_API_KEYS.find(k => k.id === keyId);
            if (key) {
                key.active = false;
            }
            return true;
        }

        try {
            await pb.collection('api_keys').update(keyId, { active: false });
            return true;
        } catch {
            return false;
        }
    },

    deleteAPIKey: async (keyId: string): Promise<boolean> => {
        if (isMockEnv()) {
            const index = MOCK_API_KEYS.findIndex(k => k.id === keyId);
            if (index !== -1) {
                MOCK_API_KEYS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('api_keys').delete(keyId);
            return true;
        } catch {
            return false;
        }
    },

    // Session Management
    getActiveSessions: async (userId: string) => {
        if (isMockEnv()) {
            return [
                {
                    id: 'session-1',
                    device: 'Chrome on Windows',
                    ip: '192.168.1.1',
                    location: 'New York, US',
                    last_active: new Date().toISOString(),
                    current: true
                },
                {
                    id: 'session-2',
                    device: 'Safari on iPhone',
                    ip: '192.168.1.2',
                    location: 'New York, US',
                    last_active: new Date(Date.now() - 86400000).toISOString(),
                    current: false
                }
            ];
        }

        try {
            return await pb.collection('user_sessions').getFullList({
                filter: `user = "${userId}"`,
                sort: '-last_active'
            });
        } catch {
            return [];
        }
    },

    terminateSession: async (sessionId: string): Promise<boolean> => {
        if (isMockEnv()) {
            return true;
        }

        try {
            await pb.collection('user_sessions').delete(sessionId);
            return true;
        } catch {
            return false;
        }
    },

    terminateAllOtherSessions: async (userId: string, currentSessionId: string): Promise<boolean> => {
        if (isMockEnv()) {
            return true;
        }

        try {
            const sessions = await pb.collection('user_sessions').getFullList({
                filter: `user = "${userId}" && id != "${currentSessionId}"`
            });

            for (const session of sessions) {
                await pb.collection('user_sessions').delete(session.id);
            }
            return true;
        } catch {
            return false;
        }
    },

    // Export Data
    exportUserData: async (userId: string): Promise<Result<{ data: UserExportData }, AppError>> => {
        if (isMockEnv()) {
            return {
                success: true,
                data: {
                    account: MOCK_ACCOUNT_SETTINGS,
                    theme: MOCK_THEME_SETTINGS,
                    notifications: MOCK_NOTIFICATION_SETTINGS,
                    privacy: MOCK_PRIVACY_SETTINGS,
                    exportDate: new Date().toISOString()
                }
            };
        }

        try {
            const [account, theme, notifications, privacy] = await Promise.all([
                settingsService.getAccountSettings(userId),
                settingsService.getThemeSettings(userId),
                settingsService.getNotificationSettings(userId),
                settingsService.getPrivacySettings(userId)
            ]);

            return {
                success: true,
                data: {
                    account,
                    theme,
                    notifications,
                    privacy,
                    exportDate: new Date().toISOString()
                }
            };
        } catch {
            return { success: false };
        }
    },

    // Delete Account
    requestAccountDeletion: async (userId: string, password: string): Promise<boolean> => {
        if (isMockEnv()) {
            return true;
        }

        try {
            // In production, this would trigger a deletion workflow
            await pb.collection('account_deletion_requests').create({
                user: userId,
                password_verified: true,
                status: 'pending',
                requested_at: new Date().toISOString()
            });
            return true;
        } catch {
            return false;
        }
    }
};
