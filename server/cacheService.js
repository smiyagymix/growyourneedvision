/**
 * Caching Service
 * Simple in-memory cache with TTL support
 * For production, consider using Redis or Memcached
 */

class CacheService {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
    }

    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            this.stats.misses++;
            this.stats.evictions++;
            return null;
        }

        this.stats.hits++;
        return entry.value;
    }

    /**
     * Set value in cache with optional TTL (in seconds)
     */
    set(key, value, ttl = 300) {
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;
        
        this.cache.set(key, {
            value,
            expiresAt,
            createdAt: Date.now()
        });

        // Set expiration timer
        if (ttl) {
            const timer = setTimeout(() => {
                this.delete(key);
                this.stats.evictions++;
            }, ttl * 1000);
            this.timers.set(key, timer);
        }

        this.stats.sets++;
        return true;
    }

    /**
     * Delete value from cache
     */
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }

    /**
     * Check if key exists in cache
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check expiration
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.delete(key);
            this.stats.evictions++;
            return false;
        }

        return true;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        
        this.timers.clear();
        this.cache.clear();
        
        console.log('[CACHE] Cleared all entries');
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
    }

    /**
     * Get or compute value
     * If key exists, return cached value
     * Otherwise, compute value, cache it, and return it
     */
    async getOrCompute(key, computeFn, ttl = 300) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        const value = await computeFn();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Invalidate cache entries by pattern
     */
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        let count = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.delete(key);
                count++;
            }
        }

        console.log(`[CACHE] Invalidated ${count} entries matching pattern: ${pattern}`);
        return count;
    }

    /**
     * Get cache size in bytes (approximate)
     */
    getSizeInBytes() {
        let size = 0;
        for (const entry of this.cache.values()) {
            size += JSON.stringify(entry.value).length * 2; // Rough estimate (UTF-16)
        }
        return size;
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                this.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[CACHE] Cleaned up ${cleaned} expired entries`);
        }

        return cleaned;
    }
}

// Create singleton instance
const cacheService = new CacheService();

// Run cleanup every 5 minutes
setInterval(() => {
    cacheService.cleanup();
}, 5 * 60 * 1000);

// Cache key generators
export const CacheKeys = {
    // MRR cache keys
    mrr: () => 'mrr:total',
    mrrByPlan: (plan) => `mrr:plan:${plan}`,
    
    // Revenue cache keys
    revenue: (months) => `revenue:${months}`,
    revenueByMonth: (year, month) => `revenue:${year}:${month}`,
    
    // Customer health cache keys
    customerHealth: (customerId) => `customer:health:${customerId}`,
    customerHealthAll: () => 'customer:health:all',
    customerHealthSegment: (segment) => `customer:health:segment:${segment}`,
    
    // Churn prediction cache keys
    churnRisk: (customerId) => `churn:risk:${customerId}`,
    churnRiskAll: () => 'churn:risk:all',
    churnRiskHigh: () => 'churn:risk:high',
    
    // Trial management cache keys
    trials: (status) => status ? `trials:status:${status}` : 'trials:all',
    trialConversion: () => 'trials:conversion:rate',
    
    // Subscription lifecycle cache keys
    subscriptions: (status) => status ? `subscriptions:status:${status}` : 'subscriptions:all',
    subscriptionStats: () => 'subscriptions:stats',
    
    // Analytics cache keys
    dashboardStats: () => 'analytics:dashboard:stats',
    customerSegments: () => 'analytics:customer:segments'
};

// Default TTLs (in seconds)
export const CacheTTL = {
    MRR: 300,           // 5 minutes
    REVENUE: 600,       // 10 minutes
    CUSTOMER_HEALTH: 600, // 10 minutes
    CHURN_RISK: 900,    // 15 minutes
    TRIALS: 180,        // 3 minutes
    SUBSCRIPTIONS: 300, // 5 minutes
    ANALYTICS: 600      // 10 minutes
};

export default cacheService;
