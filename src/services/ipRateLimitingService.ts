import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import env from '../config/environment';

export interface IPRateLimit extends RecordModel {
    tenantId: string;
    tenantName: string;
    requestsPerHour: number;
    requestsPerDay: number;
    ipWhitelist: string[]; // Array of whitelisted IPs
    ipBlacklist: string[]; // Array of banned IPs
    enabled: boolean;
    violationThreshold: number; // Number of violations before auto-ban
    currentViolations: number;
}

export interface IPViolation extends RecordModel {
    tenantId: string;
    ipAddress: string;
    endpoint: string;
    requestCount: number;
    limit: number;
    timestamp: string;
    action: 'warn' | 'throttle' | 'ban';
    duration?: number; // Ban duration in minutes
}

export interface IPRateLimitStats {
    totalRequests: number;
    blockedRequests: number;
    activeViolations: number;
    bannedIPs: number;
    whitelistedIPs: number;
    topOffenders: Array<{ ip: string; violations: number }>;
}

export const ipRateLimitingService = {
    /**
     * Get rate limits for all tenants
     */
    async getAllRateLimits(): Promise<IPRateLimit[]> {
        try {
            return await pb.collection('ip_rate_limits').getFullList<IPRateLimit>({
                sort: '-currentViolations',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching rate limits:', error);
            return [];
        }
    },

    /**
     * Get rate limit for specific tenant
     */
    async getTenantRateLimit(tenantId: string): Promise<IPRateLimit | null> {
        try {
            const limits = await pb.collection('ip_rate_limits').getFullList<IPRateLimit>({
                filter: `tenantId = "${tenantId}"`,
                requestKey: null
            });
            return limits[0] || null;
        } catch (error) {
            console.error('Error fetching tenant rate limit:', error);
            return null;
        }
    },

    /**
     * Create or update rate limit for tenant
     */
    async setTenantRateLimit(
        tenantId: string,
        tenantName: string,
        requestsPerHour: number,
        requestsPerDay: number,
        violationThreshold: number = 3
    ): Promise<IPRateLimit> {
        try {
            const existing = await this.getTenantRateLimit(tenantId);

            if (existing) {
                return await pb.collection('ip_rate_limits').update<IPRateLimit>(existing.id, {
                    requestsPerHour,
                    requestsPerDay,
                    violationThreshold
                });
            } else {
                return await pb.collection('ip_rate_limits').create<IPRateLimit>({
                    tenantId,
                    tenantName,
                    requestsPerHour,
                    requestsPerDay,
                    ipWhitelist: [],
                    ipBlacklist: [],
                    enabled: true,
                    violationThreshold,
                    currentViolations: 0
                });
            }
        } catch (error) {
            console.error('Error setting rate limit:', error);
            throw error;
        }
    },

    /**
     * Add IP to whitelist
     */
    async whitelistIP(tenantId: string, ipAddress: string): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) {
                throw new Error('Rate limit not found for tenant');
            }

            const whitelist = [...new Set([...limit.ipWhitelist, ipAddress])];
            const blacklist = limit.ipBlacklist.filter(ip => ip !== ipAddress);

            await pb.collection('ip_rate_limits').update(limit.id, {
                ipWhitelist: whitelist,
                ipBlacklist: blacklist
            });

            console.log(`✓ IP ${ipAddress} whitelisted for tenant ${tenantId}`);
            return true;
        } catch (error) {
            console.error('Error whitelisting IP:', error);
            return false;
        }
    },

    /**
     * Remove IP from whitelist
     */
    async removeWhitelistIP(tenantId: string, ipAddress: string): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) return false;

            const whitelist = limit.ipWhitelist.filter(ip => ip !== ipAddress);

            await pb.collection('ip_rate_limits').update(limit.id, {
                ipWhitelist: whitelist
            });

            return true;
        } catch (error) {
            console.error('Error removing whitelisted IP:', error);
            return false;
        }
    },

    /**
     * Ban IP address
     */
    async banIP(tenantId: string, ipAddress: string, reason: string, duration?: number): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) {
                throw new Error('Rate limit not found for tenant');
            }

            const blacklist = [...new Set([...limit.ipBlacklist, ipAddress])];
            const whitelist = limit.ipWhitelist.filter(ip => ip !== ipAddress);

            await pb.collection('ip_rate_limits').update(limit.id, {
                ipBlacklist: blacklist,
                ipWhitelist: whitelist
            });

            // Record ban violation
            await pb.collection('ip_violations').create({
                tenantId,
                ipAddress,
                endpoint: 'manual_ban',
                requestCount: 0,
                limit: 0,
                timestamp: new Date().toISOString(),
                action: 'ban',
                duration,
                reason
            });

            console.log(`✓ IP ${ipAddress} banned for tenant ${tenantId}. Reason: ${reason}`);
            return true;
        } catch (error) {
            console.error('Error banning IP:', error);
            return false;
        }
    },

    /**
     * Unban IP address
     */
    async unbanIP(tenantId: string, ipAddress: string): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) return false;

            const blacklist = limit.ipBlacklist.filter(ip => ip !== ipAddress);

            await pb.collection('ip_rate_limits').update(limit.id, {
                ipBlacklist: blacklist,
                currentViolations: Math.max(0, limit.currentViolations - 1)
            });

            console.log(`✓ IP ${ipAddress} unbanned for tenant ${tenantId}`);
            return true;
        } catch (error) {
            console.error('Error unbanning IP:', error);
            return false;
        }
    },

    /**
     * Record rate limit violation
     */
    async recordViolation(
        tenantId: string,
        ipAddress: string,
        endpoint: string,
        requestCount: number,
        limit: number
    ): Promise<void> {
        try {
            await pb.collection('ip_violations').create({
                tenantId,
                ipAddress,
                endpoint,
                requestCount,
                limit,
                timestamp: new Date().toISOString(),
                action: 'throttle'
            });

            // Increment violation count
            const rateLimit = await this.getTenantRateLimit(tenantId);
            if (rateLimit) {
                const newViolationCount = rateLimit.currentViolations + 1;
                await pb.collection('ip_rate_limits').update(rateLimit.id, {
                    currentViolations: newViolationCount
                });

                // Auto-ban if threshold exceeded
                if (newViolationCount >= rateLimit.violationThreshold) {
                    await this.banIP(tenantId, ipAddress, 'Automatic ban: violation threshold exceeded', 60);
                }
            }
        } catch (error) {
            console.error('Error recording violation:', error);
        }
    },

    /**
     * Get violations for tenant
     */
    async getTenantViolations(tenantId: string, limit: number = 100): Promise<IPViolation[]> {
        try {
            return await pb.collection('ip_violations').getFullList<IPViolation>({
                filter: `tenantId = "${tenantId}"`,
                sort: '-timestamp',
                limit,
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching violations:', error);
            return [];
        }
    },

    /**
     * Get recent violations (last 24 hours)
     */
    async getRecentViolations(hours: number = 24): Promise<IPViolation[]> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - hours);

            const allViolations = await pb.collection('ip_violations').getFullList<IPViolation>({
                sort: '-timestamp',
                requestKey: null
            });

            return allViolations.filter(v => new Date(v.timestamp) >= cutoffDate);
        } catch (error) {
            console.error('Error fetching recent violations:', error);
            return [];
        }
    },

    /**
     * Get IP rate limiting statistics
     */
    async getRateLimitStats(): Promise<IPRateLimitStats> {
        try {
            const [limits, recentViolations] = await Promise.all([
                this.getAllRateLimits(),
                this.getRecentViolations(24)
            ]);

            // Count unique banned IPs
            const bannedIPs = new Set<string>();
            limits.forEach(limit => {
                limit.ipBlacklist.forEach(ip => bannedIPs.add(ip));
            });

            // Count unique whitelisted IPs
            const whitelistedIPs = new Set<string>();
            limits.forEach(limit => {
                limit.ipWhitelist.forEach(ip => whitelistedIPs.add(ip));
            });

            // Calculate total requests and blocked requests
            const totalRequests = recentViolations.reduce((sum, v) => sum + v.requestCount, 0);
            const blockedRequests = recentViolations.filter(v => v.action === 'ban').length;

            // Find top offenders
            const offenderMap = new Map<string, number>();
            recentViolations.forEach(v => {
                offenderMap.set(v.ipAddress, (offenderMap.get(v.ipAddress) || 0) + 1);
            });

            const topOffenders = Array.from(offenderMap.entries())
                .map(([ip, violations]) => ({ ip, violations }))
                .sort((a, b) => b.violations - a.violations)
                .slice(0, 10);

            return {
                totalRequests,
                blockedRequests,
                activeViolations: recentViolations.length,
                bannedIPs: bannedIPs.size,
                whitelistedIPs: whitelistedIPs.size,
                topOffenders
            };
        } catch (error) {
            console.error('Error calculating rate limit stats:', error);
            return {
                totalRequests: 0,
                blockedRequests: 0,
                activeViolations: 0,
                bannedIPs: 0,
                whitelistedIPs: 0,
                topOffenders: []
            };
        }
    },

    /**
     * Toggle rate limiting for tenant
     */
    async toggleRateLimit(tenantId: string, enabled: boolean): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) return false;

            await pb.collection('ip_rate_limits').update(limit.id, { enabled });
            console.log(`✓ Rate limiting ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`);
            return true;
        } catch (error) {
            console.error('Error toggling rate limit:', error);
            return false;
        }
    },

    /**
     * Check if IP is rate limited for server-side use
     */
    async checkRateLimit(tenantId: string, ipAddress: string): Promise<{
        allowed: boolean;
        reason?: string;
        limit?: number;
        remaining?: number;
    }> {
        try {
            const serverUrl = env.get('paymentServerUrl') || 'http://localhost:3001';
            
            const response = await fetch(`${serverUrl}/api/rate-limit/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, ipAddress })
            });

            return await response.json();
        } catch (error) {
            console.error('Error checking rate limit:', error);
            return { allowed: true }; // Fail open for availability
        }
    },

    /**
     * Clear all violations for tenant (reset counter)
     */
    async clearViolations(tenantId: string): Promise<boolean> {
        try {
            const limit = await this.getTenantRateLimit(tenantId);
            if (!limit) return false;

            await pb.collection('ip_rate_limits').update(limit.id, {
                currentViolations: 0
            });

            console.log(`✓ Violations cleared for tenant ${tenantId}`);
            return true;
        } catch (error) {
            console.error('Error clearing violations:', error);
            return false;
        }
    }
};
