import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface StorageQuota {
    used: number; // in bytes
    total: number; // in bytes
    percentage: number;
}

export interface StorageBreakdown {
    files: number;
    media: number;
    documents: number;
    other: number;
}

export interface UserStorageInfo {
    userId: string;
    quota: StorageQuota;
    breakdown: StorageBreakdown;
    recentUploads: number;
}

// Mock data
const MOCK_STORAGE: Record<string, UserStorageInfo> = {
    'user-1': {
        userId: 'user-1',
        quota: {
            used: 524288000, // 500MB
            total: 1073741824, // 1GB
            percentage: 48.8
        },
        breakdown: {
            files: 209715200, // 200MB
            media: 209715200, // 200MB
            documents: 78643200, // 75MB
            other: 26214400 // 25MB
        },
        recentUploads: 12
    },
    'user-2': {
        userId: 'user-2',
        quota: {
            used: 262144000, // 250MB
            total: 536870912, // 512MB
            percentage: 48.8
        },
        breakdown: {
            files: 104857600, // 100MB
            media: 104857600, // 100MB
            documents: 31457280, // 30MB
            other: 20971520 // 20MB
        },
        recentUploads: 5
    }
};

const DEFAULT_QUOTA: StorageQuota = {
    used: 0,
    total: 1073741824, // 1GB default
    percentage: 0
};

export const storageQuotaService = {
    /**
     * Get storage usage for a user
     */
    async getUsage(userId: string): Promise<StorageQuota> {
        if (isMockEnv()) {
            return MOCK_STORAGE[userId]?.quota || DEFAULT_QUOTA;
        }

        try {
            const user = await pb.collection('users').getOne(userId);
            
            const used = user.storage_used || 0;
            const total = user.storage_limit || 1073741824; // 1GB

            return {
                used,
                total,
                percentage: total > 0 ? (used / total) * 100 : 0
            };
        } catch (error) {
            console.error('Error fetching storage usage:', error);
            return DEFAULT_QUOTA;
        }
    },

    /**
     * Get detailed storage breakdown
     */
    async getBreakdown(userId: string): Promise<StorageBreakdown> {
        if (isMockEnv()) {
            return MOCK_STORAGE[userId]?.breakdown || {
                files: 0,
                media: 0,
                documents: 0,
                other: 0
            };
        }

        try {
            const user = await pb.collection('users').getOne(userId);
            return {
                files: user.storage_files || 0,
                media: user.storage_media || 0,
                documents: user.storage_documents || 0,
                other: user.storage_other || 0
            };
        } catch (error) {
            console.error('Error fetching storage breakdown:', error);
            return { files: 0, media: 0, documents: 0, other: 0 };
        }
    },

    /**
     * Get full storage info
     */
    async getFullStorageInfo(userId: string): Promise<UserStorageInfo> {
        if (isMockEnv()) {
            return MOCK_STORAGE[userId] || {
                userId,
                quota: DEFAULT_QUOTA,
                breakdown: { files: 0, media: 0, documents: 0, other: 0 },
                recentUploads: 0
            };
        }

        const quota = await this.getUsage(userId);
        const breakdown = await this.getBreakdown(userId);

        return {
            userId,
            quota,
            breakdown,
            recentUploads: 0 // Would need to query uploads collection
        };
    },

    /**
     * Check if user has enough space for a file
     */
    async checkQuota(userId: string, fileSize: number): Promise<boolean> {
        const usage = await this.getUsage(userId);
        return (usage.used + fileSize) <= usage.total;
    },

    /**
     * Get available space
     */
    async getAvailableSpace(userId: string): Promise<number> {
        const usage = await this.getUsage(userId);
        return Math.max(0, usage.total - usage.used);
    },

    /**
     * Update storage usage (e.g. after upload or delete)
     */
    async updateUsage(userId: string, delta: number): Promise<void> {
        if (isMockEnv()) {
            const storage = MOCK_STORAGE[userId];
            if (storage) {
                storage.quota.used = Math.max(0, storage.quota.used + delta);
                storage.quota.percentage = (storage.quota.used / storage.quota.total) * 100;
            }
            return;
        }

        try {
            const usage = await this.getUsage(userId);
            const newUsed = Math.max(0, usage.used + delta);
            
            await pb.collection('users').update(userId, {
                storage_used: newUsed
            });
        } catch (error) {
            console.error('Error updating storage usage:', error);
        }
    },

    /**
     * Set storage limit for a user
     */
    async setLimit(userId: string, limitBytes: number): Promise<void> {
        if (isMockEnv()) {
            const storage = MOCK_STORAGE[userId];
            if (storage) {
                storage.quota.total = limitBytes;
                storage.quota.percentage = (storage.quota.used / limitBytes) * 100;
            }
            return;
        }

        try {
            await pb.collection('users').update(userId, {
                storage_limit: limitBytes
            });
        } catch (error) {
            console.error('Error setting storage limit:', error);
        }
    },

    /**
     * Get quota warning level
     */
    getWarningLevel(percentage: number): 'ok' | 'warning' | 'critical' {
        if (percentage >= 90) return 'critical';
        if (percentage >= 75) return 'warning';
        return 'ok';
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
};
