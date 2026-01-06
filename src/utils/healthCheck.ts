/**
 * Health Check Utility
 * Monitor system health and dependencies
 */

import pb from '../lib/pocketbase';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: {
        database: CheckResult;
        auth: CheckResult;
        memory: CheckResult;
        environment: CheckResult;
    };
    uptime: number;
    version: string;
}

interface CheckResult {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
}

class HealthCheck {
    private startTime = Date.now();

    /**
     * Perform complete health check
     */
    async check(): Promise<HealthStatus> {
        const checks = await Promise.all([
            this.checkDatabase(),
            this.checkAuth(),
            this.checkMemory(),
            this.checkEnvironment()
        ]);

        const [database, auth, memory, environment] = checks;

        const failed = checks.filter(c => c.status === 'fail').length;
        const warnings = checks.filter(c => c.status === 'warn').length;

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
        if (failed > 0) {
            overallStatus = 'unhealthy';
        } else if (warnings > 0) {
            overallStatus = 'degraded';
        } else {
            overallStatus = 'healthy';
        }

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: { database, auth, memory, environment },
            uptime: Date.now() - this.startTime,
            version: process.env.REACT_APP_VERSION || '1.0.0'
        };
    }

    /**
     * Check database connectivity
     */
    private async checkDatabase(): Promise<CheckResult> {
        try {
            const startTime = performance.now();
            await pb.health.check();
            const responseTime = performance.now() - startTime;

            return {
                status: 'pass',
                message: 'Database connected',
                responseTime
            };
        } catch (error) {
            return {
                status: 'fail',
                message: `Database error: ${error}`
            };
        }
    }

    /**
     * Check authentication status
     */
    private async checkAuth(): Promise<CheckResult> {
        try {
            const isValid = pb.authStore.isValid;

            if (isValid) {
                return {
                    status: 'pass',
                    message: 'Auth valid'
                };
            } else {
                return {
                    status: 'warn',
                    message: 'No active session'
                };
            }
        } catch (error) {
            return {
                status: 'fail',
                message: `Auth check failed: ${error}`
            };
        }
    }

    /**
     * Check memory usage
     */
    private async checkMemory(): Promise<CheckResult> {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            const memory = (performance as any).memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

            if (usageRatio > 0.9) {
                return {
                    status: 'fail',
                    message: `Memory usage critical: ${(usageRatio * 100).toFixed(1)}%`
                };
            } else if (usageRatio > 0.7) {
                return {
                    status: 'warn',
                    message: `Memory usage high: ${(usageRatio * 100).toFixed(1)}%`
                };
            } else {
                return {
                    status: 'pass',
                    message: `Memory usage: ${(usageRatio * 100).toFixed(1)}%`
                };
            }
        }

        return {
            status: 'pass',
            message: 'Memory monitoring not available'
        };
    }

    /**
     * Check environment configuration
     */
    private async checkEnvironment(): Promise<CheckResult> {
        const required = ['VITE_POCKETBASE_URL'];
        const missing = required.filter(key => !import.meta.env[key]);

        if (missing.length > 0) {
            return {
                status: 'fail',
                message: `Missing env vars: ${missing.join(', ')}`
            };
        }

        return {
            status: 'pass',
            message: 'Environment configured'
        };
    }

    /**
     * Quick health check (lightweight)
     */
    async quickCheck(): Promise<boolean> {
        try {
            await pb.health.check();
            return true;
        } catch {
            return false;
        }
    }
}

export const healthCheck = new HealthCheck();
