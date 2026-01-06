/**
 * Security Audit Log Service
 * 
 * Comprehensive security audit logging for sensitive operations
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import * as Sentry from '@sentry/react';

export interface AuditLogEntry extends RecordModel {
    userId: string;
    userEmail: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
    severity: 'info' | 'warning' | 'critical';
    ipAddress?: string;
    userAgent?: string;
    details: any;
    tenantId?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    timestamp: Date;
}

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    status?: string;
    tenantId?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
}

export interface AuditAnalytics {
    totalLogs: number;
    criticalEvents: number;
    failedAttempts: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
    topResources: { resource: string; count: number }[];
    activityByHour: { hour: number; count: number }[];
    securityIncidents: AuditLogEntry[];
}

// Mock data for development
const MOCK_LOGS: AuditLogEntry[] = [
    {
        id: '1',
        userId: 'user1',
        userEmail: 'admin@school.com',
        userName: 'Admin User',
        action: 'user.login',
        resource: 'authentication',
        severity: 'info',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        details: { method: 'password' },
        status: 'success',
        timestamp: new Date('2024-01-15T08:00:00'),
        created: '2024-01-15T08:00:00',
        updated: '2024-01-15T08:00:00',
        collectionId: 'audit_logs',
        collectionName: 'audit_logs'
    },
    {
        id: '2',
        userId: 'user2',
        userEmail: 'hacker@example.com',
        userName: 'Unknown',
        action: 'user.login',
        resource: 'authentication',
        severity: 'critical',
        ipAddress: '10.0.0.50',
        userAgent: 'curl/7.64.1',
        details: { attempts: 5 },
        status: 'failure',
        errorMessage: 'Invalid credentials',
        timestamp: new Date('2024-01-15T09:30:00'),
        created: '2024-01-15T09:30:00',
        updated: '2024-01-15T09:30:00',
        collectionId: 'audit_logs',
        collectionName: 'audit_logs'
    },
    {
        id: '3',
        userId: 'user1',
        userEmail: 'admin@school.com',
        userName: 'Admin User',
        action: 'data.export',
        resource: 'students',
        resourceId: 'student123',
        severity: 'warning',
        ipAddress: '192.168.1.100',
        details: { exportType: 'CSV', recordCount: 1500 },
        tenantId: 'school1',
        status: 'success',
        timestamp: new Date('2024-01-15T10:00:00'),
        created: '2024-01-15T10:00:00',
        updated: '2024-01-15T10:00:00',
        collectionId: 'audit_logs',
        collectionName: 'audit_logs'
    }
];

class SecurityAuditLogService {
    /**
     * Log an audit event
     */
    async logEvent(
        userId: string,
        action: string,
        resource: string,
        options: {
            resourceId?: string;
            severity?: 'info' | 'warning' | 'critical';
            details?: any;
            tenantId?: string;
            status?: 'success' | 'failure';
            errorMessage?: string;
        } = {}
    ): Promise<AuditLogEntry> {
        return await Sentry.startSpan(
            {
                name: 'Security Audit Log',
                op: 'security.audit'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                        return MOCK_LOGS[0];
                    }

                    // Get user details
                    const user = await pb.collection('users').getOne(userId);

                    // Get IP and user agent from browser
                    const ipAddress = await this.getClientIP();
                    const userAgent = navigator.userAgent;

                    const logEntry = await pb.collection('audit_logs').create({
                        userId,
                        userEmail: user.email,
                        userName: user.name || user.username,
                        action,
                        resource,
                        resourceId: options.resourceId,
                        severity: options.severity || 'info',
                        ipAddress,
                        userAgent,
                        details: options.details || {},
                        tenantId: options.tenantId,
                        status: options.status || 'success',
                        errorMessage: options.errorMessage,
                        timestamp: new Date()
                    }) as unknown as AuditLogEntry;

                    // Send critical events to Sentry
                    if (options.severity === 'critical') {
                        Sentry.captureMessage(`Critical audit event: ${action}`, {
                            level: 'warning',
                            extra: {
                                userId,
                                action,
                                resource,
                                details: options.details
                            }
                        });
                    }

                    return logEntry;
                } catch (error) {
                    console.error('Failed to log audit event:', error);
                    throw error;
                }
            }
        );
    }

    /**
     * Get audit logs with filters
     */
    async getLogs(
        filters: AuditLogFilters = {},
        page: number = 1,
        perPage: number = 50
    ): Promise<{ items: AuditLogEntry[]; totalPages: number; totalItems: number }> {
        return await Sentry.startSpan(
            {
                name: 'Get Audit Logs',
                op: 'audit.query'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                return {
                    items: MOCK_LOGS,
                    totalPages: 1,
                    totalItems: MOCK_LOGS.length
                };
            }

            // Build filter query
            const filterParts: string[] = [];

            if (filters.userId) {
                filterParts.push(`userId = "${filters.userId}"`);
            }
            if (filters.action) {
                filterParts.push(`action = "${filters.action}"`);
            }
            if (filters.resource) {
                filterParts.push(`resource = "${filters.resource}"`);
            }
            if (filters.severity) {
                filterParts.push(`severity = "${filters.severity}"`);
            }
            if (filters.status) {
                filterParts.push(`status = "${filters.status}"`);
            }
            if (filters.tenantId) {
                filterParts.push(`tenantId = "${filters.tenantId}"`);
            }
            if (filters.ipAddress) {
                filterParts.push(`ipAddress = "${filters.ipAddress}"`);
            }
            if (filters.startDate) {
                filterParts.push(`timestamp >= "${filters.startDate.toISOString()}"`);
            }
            if (filters.endDate) {
                filterParts.push(`timestamp <= "${filters.endDate.toISOString()}"`);
            }

            const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';

            const result = await pb.collection('audit_logs').getList<AuditLogEntry>(
                page,
                perPage,
                {
                    filter: filterQuery,
                    sort: '-timestamp',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get audit logs:', error);
            throw error;
        }
            }
        );
    }

    /**
     * Get audit analytics
     */
    async getAnalytics(
        tenantId?: string,
        days: number = 30
    ): Promise<AuditAnalytics> {
        return await Sentry.startSpan(
            {
                name: 'Audit Analytics',
                op: 'audit.analytics'
            },
            async () => {
                try {
                    if (isMockEnv()) {
                return {
                    totalLogs: 1234,
                    criticalEvents: 5,
                    failedAttempts: 12,
                    uniqueUsers: 45,
                    topActions: [
                        { action: 'user.login', count: 450 },
                        { action: 'data.export', count: 23 },
                        { action: 'user.delete', count: 8 }
                    ],
                    topResources: [
                        { resource: 'authentication', count: 500 },
                        { resource: 'students', count: 45 },
                        { resource: 'grades', count: 30 }
                    ],
                    activityByHour: Array.from({ length: 24 }, (_, i) => ({
                        hour: i,
                        count: Math.floor(Math.random() * 100)
                    })),
                    securityIncidents: MOCK_LOGS.filter(log => log.severity === 'critical')
                };
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Build base filter
            let baseFilter = `timestamp >= "${startDate.toISOString()}"`;
            if (tenantId) {
                baseFilter += ` && tenantId = "${tenantId}"`;
            }

            // Get all logs for the period
            const allLogs = await pb.collection('audit_logs').getFullList<AuditLogEntry>({
                filter: baseFilter,
                requestKey: null
            });

            // Calculate metrics
            const totalLogs = allLogs.length;
            const criticalEvents = allLogs.filter(log => log.severity === 'critical').length;
            const failedAttempts = allLogs.filter(log => log.status === 'failure').length;
            const uniqueUsers = new Set(allLogs.map(log => log.userId)).size;

            // Top actions
            const actionCounts = new Map<string, number>();
            allLogs.forEach(log => {
                actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
            });
            const topActions = Array.from(actionCounts.entries())
                .map(([action, count]) => ({ action, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Top resources
            const resourceCounts = new Map<string, number>();
            allLogs.forEach(log => {
                resourceCounts.set(log.resource, (resourceCounts.get(log.resource) || 0) + 1);
            });
            const topResources = Array.from(resourceCounts.entries())
                .map(([resource, count]) => ({ resource, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Activity by hour
            const hourCounts = new Map<number, number>();
            allLogs.forEach(log => {
                const hour = new Date(log.timestamp).getHours();
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });
            const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
                hour,
                count: hourCounts.get(hour) || 0
            }));

            // Security incidents
            const securityIncidents = allLogs
                .filter(log => log.severity === 'critical' || log.status === 'failure')
                .slice(0, 20);

            return {
                totalLogs,
                criticalEvents,
                failedAttempts,
                uniqueUsers,
                topActions,
                topResources,
                activityByHour,
                securityIncidents
            };
        } catch (error) {
            console.error('Failed to get audit analytics:', error);
            throw error;
        }
            }
        );
    }

    /**
     * Export audit logs
     */
    async exportLogs(
        filters: AuditLogFilters = {},
        format: 'csv' | 'json' = 'csv'
    ): Promise<Blob> {
        try {
            if (isMockEnv()) {
                const data = format === 'json'
                    ? JSON.stringify(MOCK_LOGS, null, 2)
                    : this.convertToCSV(MOCK_LOGS);
                return new Blob([data], {
                    type: format === 'json' ? 'application/json' : 'text/csv'
                });
            }

            // Get all logs matching filters
            const allLogs: AuditLogEntry[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const result = await this.getLogs(filters, page, 500);
                allLogs.push(...result.items);
                hasMore = page < result.totalPages;
                page++;
            }

            if (format === 'json') {
                const data = JSON.stringify(allLogs, null, 2);
                return new Blob([data], { type: 'application/json' });
            } else {
                const csv = this.convertToCSV(allLogs);
                return new Blob([csv], { type: 'text/csv' });
            }
        } catch (error) {
            console.error('Failed to export logs:', error);
            throw error;
        }
    }

    /**
     * Get client IP address
     */
    private async getClientIP(): Promise<string> {
        try {
            // In production, this should be handled by backend
            // For now, return placeholder
            return 'client-ip';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Convert logs to CSV format
     */
    private convertToCSV(logs: AuditLogEntry[]): string {
        const headers = [
            'Timestamp',
            'User ID',
            'User Email',
            'User Name',
            'Action',
            'Resource',
            'Resource ID',
            'Severity',
            'Status',
            'IP Address',
            'Tenant ID',
            'Details',
            'Error Message'
        ];

        const rows = logs.map(log => [
            new Date(log.timestamp).toISOString(),
            log.userId,
            log.userEmail,
            log.userName,
            log.action,
            log.resource,
            log.resourceId || '',
            log.severity,
            log.status,
            log.ipAddress || '',
            log.tenantId || '',
            JSON.stringify(log.details),
            log.errorMessage || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Delete old logs
     */
    async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
        try {
            if (isMockEnv()) {
                return 0;
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const oldLogs = await pb.collection('audit_logs').getFullList({
                filter: `timestamp < "${cutoffDate.toISOString()}"`,
                requestKey: null
            });

            let deletedCount = 0;
            for (const log of oldLogs) {
                await pb.collection('audit_logs').delete(log.id);
                deletedCount++;
            }

            return deletedCount;
        } catch (error) {
            console.error('Failed to delete old logs:', error);
            throw error;
        }
    }
}

export const securityAuditLogService = new SecurityAuditLogService();
