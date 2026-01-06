import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';

export interface HealthMetric extends RecordModel {
    id: string;
    service_name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime_percentage: number;
    response_time_ms?: number;
    last_check: string;
    error_message?: string;
    metadata?: Record<string, unknown>;
    created: string;
    updated: string;
}

export interface ServiceConfig {
    name: string;
    endpoint: string;
    healthPath?: string;
    timeout_ms?: number;
    critical?: boolean;
    interval_ms?: number;
}

export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    error?: string;
    checkedAt: string;
}

// Default services to monitor
const DEFAULT_SERVICES: ServiceConfig[] = [
    { name: 'pocketbase', endpoint: 'http://localhost:8090', healthPath: '/api/health', critical: true },
    { name: 'ai_service', endpoint: 'http://localhost:8000', healthPath: '/health', critical: false },
    { name: 'payment_server', endpoint: 'http://localhost:3001', healthPath: '/health', critical: true },
    { name: 'frontend', endpoint: 'http://localhost:3000', healthPath: '/', critical: true }
];

const MOCK_METRICS: HealthMetric[] = [
    {
        id: 'metric-1',
        collectionId: 'mock',
        collectionName: 'system_health_metrics',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        service_name: 'pocketbase',
        status: 'healthy',
        uptime_percentage: 99.9,
        response_time_ms: 45,
        last_check: new Date().toISOString()
    },
    {
        id: 'metric-2',
        collectionId: 'mock',
        collectionName: 'system_health_metrics',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        service_name: 'ai_service',
        status: 'healthy',
        uptime_percentage: 98.5,
        response_time_ms: 120,
        last_check: new Date().toISOString()
    },
    {
        id: 'metric-3',
        collectionId: 'mock',
        collectionName: 'system_health_metrics',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        service_name: 'payment_server',
        status: 'degraded',
        uptime_percentage: 95.0,
        response_time_ms: 850,
        last_check: new Date().toISOString()
    }
];

class SystemHealthService {
    private collection = 'system_health_metrics';
    private services: ServiceConfig[] = DEFAULT_SERVICES;
    private healthCheckInterval: NodeJS.Timeout | null = null;

    /**
     * Configure monitored services
     */
    setServices(services: ServiceConfig[]): void {
        this.services = services;
    }

    /**
     * Get all configured services
     */
    getServices(): ServiceConfig[] {
        return this.services;
    }

    /**
     * Get all health metrics
     */
    async getAllMetrics(): Promise<HealthMetric[]> {
        if (isMockEnv()) {
            return MOCK_METRICS;
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                sort: 'service_name',
                requestKey: null
            });
            return records as unknown as HealthMetric[];
        } catch (error) {
            console.error('Failed to fetch health metrics:', error);
            return [];
        }
    }

    /**
     * Get the most recent metric for each service
     */
    async getLatestMetrics(): Promise<HealthMetric[]> {
        if (isMockEnv()) {
            // Return one metric per service (mock already has this)
            return MOCK_METRICS;
        }

        try {
            const allMetrics = await this.getAllMetrics();
            const latestByService = new Map<string, HealthMetric>();

            allMetrics.forEach(metric => {
                const existing = latestByService.get(metric.service_name);
                if (!existing || new Date(metric.last_check) > new Date(existing.last_check)) {
                    latestByService.set(metric.service_name, metric);
                }
            });

            return Array.from(latestByService.values());
        } catch (error) {
            console.error('Failed to fetch latest metrics:', error);
            return [];
        }
    }

    /**
     * Get metrics history for a specific service
     */
    async getByService(serviceName: string, limit = 100): Promise<HealthMetric[]> {
        if (isMockEnv()) {
            return MOCK_METRICS.filter(m => m.service_name === serviceName);
        }

        try {
            const records = await pb.collection(this.collection).getList(1, limit, {
                filter: `service_name = "${serviceName}"`,
                sort: '-last_check',
                requestKey: null
            });
            return records.items as unknown as HealthMetric[];
        } catch (error) {
            console.error(`Failed to fetch metrics for ${serviceName}:`, error);
            return [];
        }
    }

    /**
     * Record a health metric
     */
    async recordMetric(data: Omit<HealthMetric, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'>): Promise<HealthMetric | null> {
        if (isMockEnv()) {
            const newMetric: HealthMetric = {
                service_name: data.service_name,
                status: data.status,
                uptime_percentage: data.uptime_percentage,
                last_check: data.last_check,
                response_time_ms: data.response_time_ms,
                error_message: data.error_message,
                metadata: data.metadata,
                id: `metric-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'system_health_metrics',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_METRICS.unshift(newMetric);
            return newMetric;
        }

        try {
            const record = await pb.collection(this.collection).create(data);
            return record as unknown as HealthMetric;
        } catch (error) {
            console.error('Failed to record health metric:', error);
            return null;
        }
    }

    /**
     * Perform a health check on a single service
     */
    async checkService(config: ServiceConfig): Promise<HealthCheckResult> {
        const startTime = Date.now();
        let status: HealthMetric['status'] = 'healthy';
        let errorMessage: string | undefined;
        let responseTime = 0;

        if (isMockEnv()) {
            // Simulate check
            responseTime = Math.floor(Math.random() * 200);
            status = responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'down';
        } else {
            try {
                const url = `${config.endpoint}${config.healthPath || '/health'}`;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), config.timeout_ms || 5000);

                const response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeout);

                responseTime = Date.now() - startTime;

                if (!response.ok) {
                    status = 'degraded';
                    errorMessage = `HTTP ${response.status}`;
                } else if (responseTime > 1000) {
                    status = 'degraded';
                    errorMessage = 'Slow response time';
                }
            } catch (error) {
                status = 'down';
                responseTime = Date.now() - startTime;
                errorMessage = error instanceof Error ? error.message : 'Connection failed';
            }
        }

        // Record the metric
        const uptime = status === 'healthy' ? 99.9 : status === 'degraded' ? 95.0 : 0;
        await this.recordMetric({
            service_name: config.name,
            status,
            uptime_percentage: uptime,
            response_time_ms: responseTime,
            last_check: new Date().toISOString(),
            error_message: errorMessage
        });

        return {
            service: config.name,
            status,
            responseTime,
            error: errorMessage,
            checkedAt: new Date().toISOString()
        };
    }

    /**
     * Check all configured services
     */
    async checkAllServices(): Promise<HealthCheckResult[]> {
        const results: HealthCheckResult[] = [];
        
        for (const service of this.services) {
            const result = await this.checkService(service);
            results.push(result);
        }

        return results;
    }

    /**
     * Start automated health monitoring
     */
    startMonitoring(intervalMs = 60000): void {
        if (this.healthCheckInterval) {
            this.stopMonitoring();
        }

        console.log(`Starting health monitoring with ${intervalMs}ms interval`);
        
        // Initial check
        this.checkAllServices();

        // Schedule recurring checks
        this.healthCheckInterval = setInterval(() => {
            this.checkAllServices();
        }, intervalMs);
    }

    /**
     * Stop automated health monitoring
     */
    stopMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('Health monitoring stopped');
        }
    }

    /**
     * Get overall system health status
     */
    async getOverallHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'down';
        healthy_count: number;
        degraded_count: number;
        down_count: number;
        total_count: number;
        message: string;
        critical_down: boolean;
    }> {
        const metrics = await this.getLatestMetrics();
        const healthyCount = metrics.filter(m => m.status === 'healthy').length;
        const degradedCount = metrics.filter(m => m.status === 'degraded').length;
        const downCount = metrics.filter(m => m.status === 'down').length;
        const totalCount = metrics.length;

        // Check if any critical service is down
        const criticalServices = this.services.filter(s => s.critical).map(s => s.name);
        const criticalDown = metrics.some(m => 
            m.status === 'down' && criticalServices.includes(m.service_name)
        );

        let status: 'healthy' | 'degraded' | 'down' = 'healthy';
        let message = 'All Systems Operational';

        if (criticalDown || downCount > 0) {
            status = 'down';
            message = criticalDown 
                ? 'Critical Service(s) Down' 
                : `${downCount} Service(s) Down`;
        } else if (degradedCount > 0) {
            status = 'degraded';
            message = `${degradedCount} Service(s) Degraded`;
        }

        return {
            status,
            healthy_count: healthyCount,
            degraded_count: degradedCount,
            down_count: downCount,
            total_count: totalCount,
            message,
            critical_down: criticalDown
        };
    }

    /**
     * Get uptime statistics for a service
     */
    async getUptimeStats(serviceName: string, days = 30): Promise<{
        uptime_percentage: number;
        avg_response_time: number;
        incidents: number;
        last_incident?: string;
    }> {
        const metrics = await this.getByService(serviceName, days * 24); // Assuming hourly checks
        
        if (metrics.length === 0) {
            return {
                uptime_percentage: 100,
                avg_response_time: 0,
                incidents: 0
            };
        }

        const healthyCount = metrics.filter(m => m.status === 'healthy').length;
        const uptimePercentage = (healthyCount / metrics.length) * 100;
        
        const avgResponseTime = metrics
            .filter(m => m.response_time_ms !== undefined)
            .reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / metrics.length;

        const incidents = metrics.filter(m => m.status === 'down').length;
        const lastIncident = metrics.find(m => m.status === 'down');

        return {
            uptime_percentage: Math.round(uptimePercentage * 100) / 100,
            avg_response_time: Math.round(avgResponseTime),
            incidents,
            last_incident: lastIncident?.last_check
        };
    }

    /**
     * Get system health dashboard data
     */
    async getDashboardData(): Promise<{
        overall: {
            status: 'healthy' | 'degraded' | 'down';
            healthy_count: number;
            degraded_count: number;
            down_count: number;
            total_count: number;
            message: string;
            critical_down: boolean;
        };
        services: Array<HealthMetric & { config: ServiceConfig | undefined }>;
        history: Map<string, number[]>;
    }> {
        const overall = await this.getOverallHealth();
        const latestMetrics = await this.getLatestMetrics();
        
        const services = latestMetrics.map(m => ({
            ...m,
            config: this.services.find(s => s.name === m.service_name)
        }));

        // Get response time history for charts
        const history = new Map<string, number[]>();
        for (const service of this.services) {
            const serviceMetrics = await this.getByService(service.name, 24);
            history.set(
                service.name, 
                serviceMetrics.map(m => m.response_time_ms || 0).reverse()
            );
        }

        return { overall, services, history };
    }

    /**
     * Create incident alert
     */
    async createIncidentAlert(serviceName: string, status: 'degraded' | 'down', message: string): Promise<void> {
        await auditLog.log('system.incident', {
            service: serviceName,
            status,
            message,
            timestamp: new Date().toISOString()
        }, status === 'down' ? 'critical' : 'warning');

        // Integrate with monitoring and notification system
        console.error(`[INCIDENT] ${serviceName}: ${status.toUpperCase()} - ${message}`);
        
        try {
            // Send alert via monitoring service
            const { monitoringService } = await import('./monitoringService');
            await monitoringService.sendAlert({
                title: `Service ${status === 'down' ? 'Down' : 'Degraded'}: ${serviceName}`,
                message: `${serviceName} is currently ${status}. ${message}`,
                severity: status === 'down' ? 'critical' : 'warning',
                service: serviceName,
                metadata: {
                    timestamp: new Date().toISOString(),
                    status
                }
            });
        } catch (error) {
            console.error('[SystemHealth] Failed to send incident alert:', error);
        }
    }

    /**
     * Clean up old metrics (data retention)
     */
    async cleanupOldMetrics(daysToKeep = 90): Promise<number> {
        if (isMockEnv()) {
            return 0;
        }

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const oldMetrics = await pb.collection(this.collection).getFullList({
                filter: `created < "${cutoffDate.toISOString()}"`,
                requestKey: null
            });

            let deletedCount = 0;
            for (const metric of oldMetrics) {
                await pb.collection(this.collection).delete(metric.id);
                deletedCount++;
            }

            if (deletedCount > 0) {
                await auditLog.log('system.cleanup', {
                    collection: this.collection,
                    deleted: deletedCount,
                    cutoff_date: cutoffDate.toISOString()
                }, 'info');
            }

            return deletedCount;
        } catch (error) {
            console.error('Failed to cleanup old metrics:', error);
            return 0;
        }
    }
}

export const systemHealthService = new SystemHealthService();
