/**
 * API Rate Limiting Service
 * 
 * Track and enforce API rate limits per tenant
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface RateLimitConfig extends RecordModel {
    tenantId: string;
    endpoint?: string; // Optional for endpoint-specific limits
    maxRequests: number;
    windowSeconds: number;
    burstAllowed: boolean;
    burstLimit?: number;
    isEnabled: boolean;
}

export interface RateLimitUsage extends RecordModel {
    tenantId: string;
    endpoint: string;
    requestCount: number;
    windowStart: string;
    windowEnd: string;
    throttled: boolean;
    exceededAt?: string;
}

export interface RateLimitViolation extends RecordModel {
    tenantId: string;
    endpoint: string;
    requestCount: number;
    limit: number;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface RateLimitStats {
    tenantId: string;
    totalRequests: number;
    throttledRequests: number;
    violations: number;
    averageRequestsPerMinute: number;
    topEndpoints: {
        endpoint: string;
        count: number;
    }[];
}

// ==================== MOCK DATA ====================

const MOCK_CONFIGS: RateLimitConfig[] = [
    {
        id: '1',
        collectionId: 'rate_limit_configs',
        collectionName: 'rate_limit_configs',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
        tenantId: 'tenant1',
        maxRequests: 1000,
        windowSeconds: 60,
        burstAllowed: true,
        burstLimit: 100,
        isEnabled: true
    }
];

// ==================== SERVICE ====================

class APIRateLimitService {
    private cache = new Map<string, { count: number; resetAt: number }>();

    // ==================== CONFIGURATION ====================

    async getConfig(tenantId: string, endpoint?: string): Promise<RateLimitConfig | null> {
        if (isMockEnv()) return MOCK_CONFIGS[0];

        try {
            let filter = `tenantId = "${tenantId}" && isEnabled = true`;
            if (endpoint) {
                filter += ` && endpoint = "${endpoint}"`;
            }

            const configs = await pb.collection('rate_limit_configs').getFullList<RateLimitConfig>({
                filter,
                sort: '-created',
                requestKey: null
            });

            // Return endpoint-specific config if exists, otherwise default
            return configs.find(c => c.endpoint === endpoint) || configs.find(c => !c.endpoint) || null;
        } catch (error) {
            return null;
        }
    }

    async setConfig(config: Omit<RateLimitConfig, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<RateLimitConfig> {
        if (isMockEnv()) {
            return { ...MOCK_CONFIGS[0], ...config };
        }

        return await pb.collection('rate_limit_configs').create<RateLimitConfig>(config);
    }

    async updateConfig(id: string, updates: Partial<RateLimitConfig>): Promise<RateLimitConfig> {
        if (isMockEnv()) {
            return { ...MOCK_CONFIGS[0], ...updates, id };
        }

        return await pb.collection('rate_limit_configs').update<RateLimitConfig>(id, updates);
    }

    // ==================== RATE LIMITING ====================

    async checkRateLimit(tenantId: string, endpoint: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: number;
        retryAfter?: number;
    }> {
        if (isMockEnv()) {
            return {
                allowed: true,
                remaining: 950,
                resetAt: Date.now() + 60000
            };
        }

        return measurePerformance('checkRateLimit', async () => {
            try {
                const config = await this.getConfig(tenantId, endpoint);

                if (!config) {
                    // No rate limit configured - allow all
                    return {
                        allowed: true,
                        remaining: Infinity,
                        resetAt: Date.now() + 60000
                    };
                }

                const cacheKey = `${tenantId}:${endpoint}`;
                const now = Date.now();

                let usage = this.cache.get(cacheKey);

                // Initialize or reset window
                if (!usage || now >= usage.resetAt) {
                    usage = {
                        count: 0,
                        resetAt: now + (config.windowSeconds * 1000)
                    };
                    this.cache.set(cacheKey, usage);
                }

                // Check limits
                const allowed = usage.count < config.maxRequests;

                if (allowed) {
                    usage.count++;
                    this.cache.set(cacheKey, usage);

                    // Log usage to database (async, don't await)
                    this.logUsage(tenantId, endpoint, usage.count, false).catch(console.error);

                    return {
                        allowed: true,
                        remaining: config.maxRequests - usage.count,
                        resetAt: usage.resetAt
                    };
                } else {
                    // Rate limit exceeded
                    const retryAfter = Math.ceil((usage.resetAt - now) / 1000);

                    // Log violation (async)
                    this.logViolation(tenantId, endpoint, usage.count, config.maxRequests).catch(console.error);

                    return {
                        allowed: false,
                        remaining: 0,
                        resetAt: usage.resetAt,
                        retryAfter
                    };
                }
            } catch (error) {
                captureException(error as Error, {
                    feature: 'rate-limiting',
                    operation: 'checkRateLimit',
                    tenantId,
                    endpoint
                });

                // On error, allow request (fail open)
                return {
                    allowed: true,
                    remaining: 0,
                    resetAt: Date.now() + 60000
                };
            }
        }, { feature: 'rate-limiting', tenantId, endpoint });
    }

    private async logUsage(tenantId: string, endpoint: string, count: number, throttled: boolean): Promise<void> {
        try {
            const windowStart = new Date(Date.now() - 60000).toISOString();
            const windowEnd = new Date().toISOString();

            await pb.collection('rate_limit_usage').create({
                tenantId,
                endpoint,
                requestCount: count,
                windowStart,
                windowEnd,
                throttled,
                exceededAt: throttled ? new Date().toISOString() : undefined
            });
        } catch (error) {
            console.error('Failed to log rate limit usage:', error);
        }
    }

    private async logViolation(tenantId: string, endpoint: string, requestCount: number, limit: number): Promise<void> {
        try {
            await pb.collection('rate_limit_violations').create({
                tenantId,
                endpoint,
                requestCount,
                limit,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to log rate limit violation:', error);
        }
    }

    // ==================== STATISTICS ====================

    async getStats(tenantId: string, period?: { start: Date; end: Date }): Promise<RateLimitStats> {
        if (isMockEnv()) {
            return {
                tenantId,
                totalRequests: 45230,
                throttledRequests: 156,
                violations: 23,
                averageRequestsPerMinute: 31.4,
                topEndpoints: [
                    { endpoint: '/api/students', count: 12340 },
                    { endpoint: '/api/classes', count: 8920 },
                    { endpoint: '/api/assignments', count: 6540 }
                ]
            };
        }

        let filter = `tenantId = "${tenantId}"`;
        if (period) {
            filter += ` && windowStart >= "${period.start.toISOString()}" && windowEnd <= "${period.end.toISOString()}"`;
        }

        const usage = await pb.collection('rate_limit_usage').getFullList<RateLimitUsage>({
            filter,
            requestKey: null
        });

        const violations = await pb.collection('rate_limit_violations').getFullList<RateLimitViolation>({
            filter: `tenantId = "${tenantId}"`,
            requestKey: null
        });

        const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0);
        const throttledRequests = usage.filter(u => u.throttled).reduce((sum, u) => sum + u.requestCount, 0);

        // Calculate average per minute
        const duration = period 
            ? (period.end.getTime() - period.start.getTime()) / 60000
            : 60;
        const avgPerMinute = totalRequests / duration;

        // Top endpoints
        const endpointCounts: Record<string, number> = {};
        usage.forEach(u => {
            endpointCounts[u.endpoint] = (endpointCounts[u.endpoint] || 0) + u.requestCount;
        });

        const topEndpoints = Object.entries(endpointCounts)
            .map(([endpoint, count]) => ({ endpoint, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            tenantId,
            totalRequests,
            throttledRequests,
            violations: violations.length,
            averageRequestsPerMinute: Math.round(avgPerMinute * 10) / 10,
            topEndpoints
        };
    }

    async getViolations(tenantId: string, limit = 100): Promise<RateLimitViolation[]> {
        if (isMockEnv()) return [];

        return await pb.collection('rate_limit_violations').getFullList<RateLimitViolation>({
            filter: `tenantId = "${tenantId}"`,
            sort: '-timestamp',
            requestKey: null
        });
    }

    // ==================== MANAGEMENT ====================

    async resetLimits(tenantId: string): Promise<void> {
        // Clear cache for tenant
        for (const [key] of this.cache) {
            if (key.startsWith(`${tenantId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    async getAllConfigs(): Promise<RateLimitConfig[]> {
        if (isMockEnv()) return MOCK_CONFIGS;

        return await pb.collection('rate_limit_configs').getFullList<RateLimitConfig>({
            sort: 'tenantId,endpoint',
            requestKey: null
        });
    }
}

export const apiRateLimitService = new APIRateLimitService();
