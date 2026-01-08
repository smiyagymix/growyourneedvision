/**
 * Health Monitoring Types
 * Proper types for system health metrics
 */

export interface HealthMetadata {
    version?: string;
    build?: string;
    environment?: string;
    region?: string;
    instanceId?: string;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    activeConnections?: number;
    queueLength?: number;
}
