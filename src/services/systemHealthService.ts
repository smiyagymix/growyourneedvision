import { pocketBaseClient } from '../lib/pocketbase';
import { createTypedCollection } from '../lib/pocketbase-types';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';
import env from '../config/environment';
import { Result, Ok, Err, Option, Some, None } from '../lib/types';
import { AppError } from './errorHandler';
import { HealthMetadata } from '../types/health';

export interface HealthMetric extends RecordModel {
    id: string;
    service_name: string;
    status: 'healthy' | 'degraded' | 'down';
    uptime_percentage: number;
    response_time_ms?: number;
    last_check: string;
    error_message?: string;
    metadata?: HealthMetadata;
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

// Default services to monitor - using environment configuration
const getDefaultServices = (): ServiceConfig[] => [
    { name: 'pocketbase', endpoint: env.get('pocketbaseUrl'), healthPath: env.get('pocketbaseHealthPath'), critical: true },
    { name: 'ai_service', endpoint: env.get('aiServiceUrl'), healthPath: env.get('aiServiceHealthPath'), critical: false },
    { name: 'payment_server', endpoint: env.get('paymentServerUrl'), healthPath: env.get('paymentServerHealthPath'), critical: true },
    { name: 'frontend', endpoint: env.get('frontendUrl'), healthPath: '/', critical: true }
];

const DEFAULT_SERVICES: ServiceConfig[] = getDefaultServices();

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
    private services: ServiceConfig[] = getDefaultServices();
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private pb = pocketBaseClient.getRawClient();
    private metricsService = createTypedCollection<HealthMetric>(this.pb, this.collection);

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
    async getAllMetrics(): Promise<Result<HealthMetric[], AppError>> {
        if (isMockEnv()) {
            return Ok(MOCK_METRICS);
        }

        try {
            const result = await this.metricsService.getFullList({
                sort: 'service_name',
                requestKey: null
            }) as HealthMetric[];
            return Ok(result);
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to fetch health metrics',
                'METRICS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Get the most recent metric for each service
     */
    async getLatestMetrics(): Promise<Result<HealthMetric[], AppError>> {
        if (isMockEnv()) {
            return Ok(MOCK_METRICS);
        }

        try {
            const allMetricsResult = await this.getAllMetrics();
            if (!allMetricsResult.ok) {
                return allMetricsResult;
            }

            const allMetrics = allMetricsResult.value;
            const latestByService = new Map<string, HealthMetric>();

            allMetrics.forEach(metric => {
                const existing = latestByService.get(metric.service_name);
                if (!existing || new Date(metric.last_check) > new Date(existing.last_check)) {
                    latestByService.set(metric.service_name, metric);
                }
            });

            return Ok(Array.from(latestByService.values()));
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to fetch latest metrics',
                'LATEST_METRICS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Get metrics history for a specific service
     */
    async getByService(serviceName: string, limit = 100): Promise<Result<HealthMetric[], AppError>> {
        if (isMockEnv()) {
            return Ok(MOCK_METRICS.filter(m => m.service_name === serviceName));
        }

        try {
            const result = await this.metricsService.getList(1, limit, {
                filter: `service_name = "${serviceName}"`,
                sort: '-last_check',
                requestKey: null
            });
            // Result from getList has items property directly
            return Ok((result as any).items as HealthMetric[]);
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : `Failed to fetch metrics for ${serviceName}`,
                'SERVICE_METRICS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Record a health metric
     */
    async recordMetric(data: Omit<HealthMetric, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'>): Promise<Result<HealthMetric, AppError>> {
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
            return Ok(newMetric);
        }

        try {
            const result = await this.metricsService.create(data as Partial<HealthMetric>) as HealthMetric;
            return Ok(result);
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to record health metric',
                'METRIC_RECORD_FAILED',
                500
            ));
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
        const recordResult = await this.recordMetric({
            service_name: config.name,
            status,
            uptime_percentage: uptime,
            response_time_ms: responseTime,
            last_check: new Date().toISOString(),
            error_message: errorMessage
        });
        if (!recordResult.ok) {
            console.error('Failed to record metric:', recordResult.error);
        }

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
    async getOverallHealth(): Promise<Result<{
        status: 'healthy' | 'degraded' | 'down';
        healthy_count: number;
        degraded_count: number;
        down_count: number;
        total_count: number;
        message: string;
        critical_down: boolean;
    }, AppError>> {
        const metricsResult = await this.getLatestMetrics();
        if (!metricsResult.ok) {
            return metricsResult;
        }
        const metrics = metricsResult.value;
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

        return Ok({
            status,
            healthy_count: healthyCount,
            degraded_count: degradedCount,
            down_count: downCount,
            total_count: totalCount,
            message,
            critical_down: criticalDown
        });
    }

    /**
     * Get uptime statistics for a service
     */
    async getUptimeStats(serviceName: string, days = 30): Promise<Result<{
        uptime_percentage: number;
        avg_response_time: number;
        incidents: number;
        last_incident?: string;
    }, AppError>> {
        const metricsResult = await this.getByService(serviceName, days * 24); // Assuming hourly checks
        if (!metricsResult.ok) {
            return metricsResult;
        }
        const metrics = metricsResult.value;

        if (metrics.length === 0) {
            return Ok({
                uptime_percentage: 100,
                avg_response_time: 0,
                incidents: 0
            });
        }

        const healthyCount = metrics.filter(m => m.status === 'healthy').length;
        const uptimePercentage = (healthyCount / metrics.length) * 100;

        const avgResponseTime = metrics
            .filter(m => m.response_time_ms !== undefined)
            .reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / metrics.length;

        const incidents = metrics.filter(m => m.status === 'down').length;
        const lastIncident = metrics.find(m => m.status === 'down');

        return Ok({
            uptime_percentage: Math.round(uptimePercentage * 100) / 100,
            avg_response_time: Math.round(avgResponseTime),
            incidents,
            last_incident: lastIncident?.last_check
        });
    }

    /**
     * Get system health dashboard data
     */
    async getDashboardData(): Promise<Result<{
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
    }, AppError>> {
        const overallResult = await this.getOverallHealth();
        if (!overallResult.ok) {
            return overallResult;
        }
        const overall = overallResult.value;

        const latestMetricsResult = await this.getLatestMetrics();
        if (!latestMetricsResult.ok) {
            return latestMetricsResult;
        }
        const latestMetrics = latestMetricsResult.value;

        const services = latestMetrics.map(m => ({
            ...m,
            config: this.services.find(s => s.name === m.service_name)
        }));

        // Get response time history for charts
        const history = new Map<string, number[]>();
        for (const service of this.services) {
            const serviceMetricsResult = await this.getByService(service.name, 24);
            if (serviceMetricsResult.ok) {
                history.set(
                    service.name,
                    serviceMetricsResult.value.map(m => m.response_time_ms || 0).reverse()
                );
            }
        }

        return Ok({ overall, services, history });
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

            const oldMetricsResult = await this.metricsService.getFullList({
                filter: `created < "${cutoffDate.toISOString()}"`,
                requestKey: null
            });
            const oldMetrics = (oldMetricsResult as any) as HealthMetric[];

            let deletedCount = 0;
            for (const metric of oldMetrics) {
                try {
                    await this.metricsService.delete(metric.id);
                    deletedCount++;
                } catch (err) {
                    console.error(`Failed to delete metric ${metric.id}`, err);
                }
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
