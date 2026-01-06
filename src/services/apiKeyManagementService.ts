/**
 * API Key Management Service
 * 
 * Manage API keys with permissions and usage tracking
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import * as Sentry from '@sentry/react';

export interface APIKey extends RecordModel {
    name: string;
    key: string;
    tenantId: string;
    tenantName: string;
    permissions: string[];
    status: 'active' | 'suspended' | 'revoked';
    expiresAt?: Date;
    lastUsed?: Date;
    usageCount: number;
    rateLimit: number; // requests per minute
    createdBy: string;
    ipWhitelist?: string[];
    allowedOrigins?: string[];
}

export interface APIKeyUsage extends RecordModel {
    keyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    ipAddress: string;
    userAgent?: string;
    timestamp: Date;
}

export interface UsageStatistics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByEndpoint: { endpoint: string; count: number }[];
    requestsByDay: { date: string; count: number }[];
    topIPs: { ip: string; count: number }[];
    errorRate: number;
}

// Mock data
const MOCK_KEYS: APIKey[] = [
    {
        id: '1',
        name: 'Production API',
        key: 'gyn_sk_prod_1234567890abcdef',
        tenantId: 'tenant1',
        tenantName: 'Example School',
        permissions: ['read:users', 'write:users', 'read:courses'],
        status: 'active',
        expiresAt: new Date('2025-12-31'),
        lastUsed: new Date(),
        usageCount: 12345,
        rateLimit: 1000,
        createdBy: 'admin1',
        ipWhitelist: ['192.168.1.0/24'],
        allowedOrigins: ['https://example.com'],
        created: '2024-01-01',
        updated: '2024-01-15',
        collectionId: 'api_keys',
        collectionName: 'api_keys'
    }
];

class APIKeyManagementService {
    /**
     * Generate new API key
     */
    async createKey(
        tenantId: string,
        name: string,
        permissions: string[],
        options: {
            expiresAt?: Date;
            rateLimit?: number;
            ipWhitelist?: string[];
            allowedOrigins?: string[];
        } = {}
    ): Promise<{ key: APIKey; plainKey: string }> {
        return await Sentry.startSpan(
            {
                name: 'Create API Key',
                op: 'apikey.create'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                return {
                    key: MOCK_KEYS[0],
                    plainKey: 'gyn_sk_test_' + Math.random().toString(36).substring(7)
                };
            }

            // Generate secure key
            const prefix = 'gyn_sk_';
            const env = process.env.NODE_ENV === 'production' ? 'prod' : 'test';
            const randomPart = this.generateSecureRandom(32);
            const plainKey = `${prefix}${env}_${randomPart}`;

            // Hash the key for storage
            const hashedKey = await this.hashKey(plainKey);

            // Get tenant info
            const tenant = await pb.collection('tenants').getOne(tenantId);

            // Create key record
            const keyRecord = await pb.collection('api_keys').create({
                name,
                key: hashedKey,
                tenantId,
                tenantName: tenant.name,
                permissions,
                status: 'active',
                expiresAt: options.expiresAt,
                usageCount: 0,
                rateLimit: options.rateLimit || 1000,
                createdBy: pb.authStore.model?.id,
                ipWhitelist: options.ipWhitelist || [],
                allowedOrigins: options.allowedOrigins || []
            }) as unknown as APIKey;

            // Return both the record and plain key (only time it's visible)
            return {
                key: keyRecord,
                plainKey
            };
        } catch (error) {
            console.error('Failed to create API key:', error);
            throw error;
        }
            }
        );
    }

    /**
     * Get all keys for a tenant
     */
    async getKeys(
        tenantId?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<{ items: APIKey[]; totalPages: number }> {
        try {
            if (isMockEnv()) {
                return { items: MOCK_KEYS, totalPages: 1 };
            }

            const filter = tenantId ? `tenantId = "${tenantId}"` : '';

            const result = await pb.collection('api_keys').getList<APIKey>(
                page,
                perPage,
                {
                    filter,
                    sort: '-created',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get API keys:', error);
            throw error;
        }
    }

    /**
     * Update key status
     */
    async updateKeyStatus(
        keyId: string,
        status: APIKey['status']
    ): Promise<APIKey> {
        try {
            if (isMockEnv()) {
                return { ...MOCK_KEYS[0], status };
            }

            return await pb.collection('api_keys').update(keyId, { status });
        } catch (error) {
            console.error('Failed to update key status:', error);
            throw error;
        }
    }

    /**
     * Revoke key
     */
    async revokeKey(keyId: string): Promise<void> {
        try {
            if (isMockEnv()) {
                return;
            }

            await pb.collection('api_keys').update(keyId, {
                status: 'revoked',
                revokedAt: new Date()
            });
        } catch (error) {
            console.error('Failed to revoke key:', error);
            throw error;
        }
    }

    /**
     * Update key permissions
     */
    async updatePermissions(
        keyId: string,
        permissions: string[]
    ): Promise<APIKey> {
        try {
            if (isMockEnv()) {
                return { ...MOCK_KEYS[0], permissions };
            }

            return await pb.collection('api_keys').update(keyId, { permissions });
        } catch (error) {
            console.error('Failed to update permissions:', error);
            throw error;
        }
    }

    /**
     * Get usage statistics
     */
    async getUsageStatistics(
        keyId: string,
        days: number = 30
    ): Promise<UsageStatistics> {
        return await Sentry.startSpan(
            {
                name: 'Get API Key Usage',
                op: 'apikey.usage'
            },
            async () => {
                try {
            if (isMockEnv()) {
                return {
                    totalRequests: 12345,
                    successfulRequests: 12100,
                    failedRequests: 245,
                    averageResponseTime: 145,
                    requestsByEndpoint: [
                        { endpoint: '/api/users', count: 5000 },
                        { endpoint: '/api/courses', count: 3500 },
                        { endpoint: '/api/assignments', count: 3845 }
                    ],
                    requestsByDay: Array.from({ length: 7 }, (_, i) => ({
                        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        count: Math.floor(Math.random() * 2000) + 1000
                    })),
                    topIPs: [
                        { ip: '192.168.1.100', count: 8000 },
                        { ip: '10.0.0.50', count: 4345 }
                    ],
                    errorRate: 1.98
                };
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const usage = await pb.collection('api_key_usage').getFullList<APIKeyUsage>({
                filter: `keyId = "${keyId}" && timestamp >= "${startDate.toISOString()}"`,
                requestKey: null
            });

            const totalRequests = usage.length;
            const successfulRequests = usage.filter(u => u.statusCode >= 200 && u.statusCode < 400).length;
            const failedRequests = totalRequests - successfulRequests;
            const averageResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0) / totalRequests;

            // Requests by endpoint
            const endpointCounts = new Map<string, number>();
            usage.forEach(u => {
                endpointCounts.set(u.endpoint, (endpointCounts.get(u.endpoint) || 0) + 1);
            });
            const requestsByEndpoint = Array.from(endpointCounts.entries())
                .map(([endpoint, count]) => ({ endpoint, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Requests by day
            const dayCounts = new Map<string, number>();
            usage.forEach(u => {
                const day = new Date(u.timestamp).toISOString().split('T')[0];
                dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
            });
            const requestsByDay = Array.from(dayCounts.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Top IPs
            const ipCounts = new Map<string, number>();
            usage.forEach(u => {
                ipCounts.set(u.ipAddress, (ipCounts.get(u.ipAddress) || 0) + 1);
            });
            const topIPs = Array.from(ipCounts.entries())
                .map(([ip, count]) => ({ ip, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

            return {
                totalRequests,
                successfulRequests,
                failedRequests,
                averageResponseTime,
                requestsByEndpoint,
                requestsByDay,
                topIPs,
                errorRate
            };
        } catch (error) {
            console.error('Failed to get usage statistics:', error);
            throw error;
        }
            }
        );
    }

    /**
     * Rotate key
     */
    async rotateKey(keyId: string): Promise<{ key: APIKey; plainKey: string }> {
        try {
            if (isMockEnv()) {
                return {
                    key: MOCK_KEYS[0],
                    plainKey: 'gyn_sk_test_rotated_' + Math.random().toString(36).substring(7)
                };
            }

            const oldKey = await pb.collection('api_keys').getOne<APIKey>(keyId);

            // Generate new key
            const prefix = 'gyn_sk_';
            const env = process.env.NODE_ENV === 'production' ? 'prod' : 'test';
            const randomPart = this.generateSecureRandom(32);
            const plainKey = `${prefix}${env}_${randomPart}`;
            const hashedKey = await this.hashKey(plainKey);

            // Update with new key
            const updatedKey = await pb.collection('api_keys').update(keyId, {
                key: hashedKey,
                rotatedAt: new Date()
            }) as unknown as APIKey;

            return {
                key: updatedKey,
                plainKey
            };
        } catch (error) {
            console.error('Failed to rotate key:', error);
            throw error;
        }
    }

    /**
     * Generate secure random string
     */
    private generateSecureRandom(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        
        return result;
    }

    /**
     * Hash API key for storage
     */
    private async hashKey(key: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(key);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate key format
     */
    validateKeyFormat(key: string): boolean {
        return /^gyn_sk_(prod|test)_[A-Za-z0-9]{32}$/.test(key);
    }

    /**
     * Get available permissions
     */
    getAvailablePermissions(): string[] {
        return [
            'read:users',
            'write:users',
            'delete:users',
            'read:courses',
            'write:courses',
            'delete:courses',
            'read:assignments',
            'write:assignments',
            'delete:assignments',
            'read:grades',
            'write:grades',
            'read:analytics',
            'write:settings',
            'admin:all'
        ];
    }
}

export const apiKeyManagementService = new APIKeyManagementService();
