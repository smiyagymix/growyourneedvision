/**
 * Rate Limiting Service
 * Implements rate limiting for API endpoints and user actions
 */

import { ownerService } from './ownerService';
import { isMockEnv } from '../utils/mockData';

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimitService {
    private storage = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    // Rate limit configurations by endpoint type
    private limits: Record<string, RateLimitConfig> = {
        'owner:admin': { windowMs: 60 * 1000, maxRequests: 100 },  // 100 req/min for owner
        'api:public': { windowMs: 60 * 1000, maxRequests: 20 },     // 20 req/min for public
        'api:authenticated': { windowMs: 60 * 1000, maxRequests: 60 },  // 60 req/min for authenticated
        'ai:query': { windowMs: 60 * 1000, maxRequests: 10 },       // 10 AI queries/min
        'email:send': { windowMs: 60 * 1000, maxRequests: 5 },      // 5 emails/min
        'export:data': { windowMs: 60 * 1000, maxRequests: 3 },     // 3 exports/min
    };

    constructor() {
        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Check if request is allowed under rate limit
     * @param identifier - Unique identifier (e.g., userId, IP address)
     * @param limitType - Type of rate limit to apply
     * @returns { allowed: boolean, remaining: number, resetTime: number }
     */
    checkLimit(identifier: string, limitType: string): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
        if (isMockEnv()) {
            return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
        }

        const config = this.limits[limitType];
        if (!config) {
            console.warn(`Unknown rate limit type: ${limitType}`);
            return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
        }

        const key = `${limitType}:${identifier}`;
        const now = Date.now();
        const entry = this.storage.get(key);

        // No entry or expired window - allow and create new entry
        if (!entry || now >= entry.resetTime) {
            this.storage.set(key, {
                count: 1,
                resetTime: now + config.windowMs
            });
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs
            };
        }

        // Within window - check if under limit
        if (entry.count < config.maxRequests) {
            entry.count++;
            this.storage.set(key, entry);
            return {
                allowed: true,
                remaining: config.maxRequests - entry.count,
                resetTime: entry.resetTime
            };
        }

        // Over limit
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)  // seconds
        };
    }

    /**
     * Record API usage for analytics
     */
    async recordAPIUsage(
        endpoint: string,
        method: string,
        userId: string | null,
        tenantId: string | null,
        statusCode: number,
        durationMs: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        if (isMockEnv()) {
            console.log(`[MOCK] Record API usage: ${method} ${endpoint} - ${statusCode}`);
            return;
        }

        try {
            // This would be logged to api_usage collection
            // In production, you might want to batch these or use a queue
            await ownerService.getAPIUsageMetrics(); // This ensures collection exists
            
            // In real implementation, you'd create a record here
            // For now, we're just tracking in memory
            console.log(`📊 API Usage: ${method} ${endpoint} - ${statusCode} (${durationMs}ms)`);
        } catch (error) {
            console.error('Error recording API usage:', error);
        }
    }

    /**
     * Get rate limit info without incrementing counter
     */
    getRateLimitInfo(identifier: string, limitType: string): { remaining: number; resetTime: number; limit: number } {
        const config = this.limits[limitType];
        if (!config) {
            return { remaining: 100, resetTime: Date.now() + 60000, limit: 100 };
        }

        const key = `${limitType}:${identifier}`;
        const entry = this.storage.get(key);
        const now = Date.now();

        if (!entry || now >= entry.resetTime) {
            return {
                remaining: config.maxRequests,
                resetTime: now + config.windowMs,
                limit: config.maxRequests
            };
        }

        return {
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime,
            limit: config.maxRequests
        };
    }

    /**
     * Reset rate limit for specific identifier
     */
    resetLimit(identifier: string, limitType: string): void {
        const key = `${limitType}:${identifier}`;
        this.storage.delete(key);
    }

    /**
     * Update rate limit configuration
     */
    updateLimitConfig(limitType: string, config: RateLimitConfig): void {
        this.limits[limitType] = config;
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.storage.entries()) {
            if (now >= entry.resetTime) {
                this.storage.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
        }
    }

    /**
     * Get current storage size
     */
    getStorageSize(): number {
        return this.storage.size;
    }

    /**
     * Clear all rate limits (use carefully!)
     */
    clearAll(): void {
        this.storage.clear();
        console.log('⚠️  All rate limits cleared');
    }

    /**
     * Destroy service and cleanup
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.storage.clear();
    }
}

export const rateLimitService = new RateLimitService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        rateLimitService.destroy();
    });
}
