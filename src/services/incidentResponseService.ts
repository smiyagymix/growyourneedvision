/**
 * Incident Response Service
 * 
 * Automated incident detection, escalation, and resolution tracking
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface Incident extends RecordModel {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'closed';
    category: 'performance' | 'security' | 'availability' | 'data' | 'integration' | 'other';
    affectedServices: string[];
    affectedTenants?: string[];
    detectedBy: 'auto' | 'user' | 'monitoring' | 'manual';
    detectedAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    closedAt?: string;
    assignedTo?: string;
    priority: number; // 1-5 (1 = highest)
    impact: 'none' | 'minor' | 'major' | 'critical';
    timeline: IncidentEvent[];
    resolution?: string;
    rootCause?: string;
    preventionSteps?: string[];
    metrics: {
        responseTime?: number; // seconds
        resolutionTime?: number; // seconds
        affectedUsers?: number;
        downtimeMinutes?: number;
    };
}

export interface IncidentEvent {
    timestamp: string;
    type: 'detected' | 'acknowledged' | 'update' | 'escalated' | 'resolved' | 'closed';
    message: string;
    userId?: string;
    data?: Record<string, any>;
}

export interface IncidentRule extends RecordModel {
    name: string;
    description: string;
    enabled: boolean;
    trigger: {
        type: 'metric' | 'error' | 'availability' | 'threshold';
        metric?: string;
        threshold?: number;
        operator?: 'gt' | 'lt' | 'eq';
        duration?: number; // seconds
    };
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    autoAssign?: string; // User ID
    notifyChannels: string[]; // email, slack, sms
    escalationPolicy?: {
        after: number; // minutes
        assignTo: string;
    };
}

export interface IncidentStats {
    total: number;
    open: number;
    resolved: number;
    critical: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    mttr: number; // Mean time to resolution
}

// ==================== MOCK DATA ====================

const MOCK_INCIDENTS: Incident[] = [
    {
        id: '1',
        collectionId: 'incidents',
        collectionName: 'incidents',
        created: '2025-12-28T10:00:00Z',
        updated: '2025-12-28T10:30:00Z',
        title: 'Database Connection Pool Exhaustion',
        description: 'PocketBase connection pool saturated, causing request timeouts',
        severity: 'critical',
        status: 'investigating',
        category: 'performance',
        affectedServices: ['pocketbase', 'api'],
        affectedTenants: ['tenant1', 'tenant2'],
        detectedBy: 'auto',
        detectedAt: '2025-12-28T10:00:00Z',
        acknowledgedAt: '2025-12-28T10:05:00Z',
        assignedTo: 'owner1',
        priority: 1,
        impact: 'critical',
        timeline: [
            {
                timestamp: '2025-12-28T10:00:00Z',
                type: 'detected',
                message: 'Alert triggered: DB connection pool > 95% for 5 minutes'
            },
            {
                timestamp: '2025-12-28T10:05:00Z',
                type: 'acknowledged',
                message: 'Incident acknowledged by owner1',
                userId: 'owner1'
            },
            {
                timestamp: '2025-12-28T10:15:00Z',
                type: 'update',
                message: 'Root cause identified: Long-running query in analytics service',
                userId: 'owner1'
            }
        ],
        metrics: {
            responseTime: 300,
            affectedUsers: 156
        }
    }
];

// ==================== SERVICE ====================

class IncidentResponseService {
    // ==================== INCIDENT MANAGEMENT ====================

    async createIncident(incident: Omit<Incident, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName' | 'timeline'>): Promise<Incident> {
        if (isMockEnv()) {
            return { ...MOCK_INCIDENTS[0], ...incident };
        }

        return measurePerformance('createIncident', async () => {
            try {
                const newIncident = await pb.collection('incidents').create<Incident>({
                    ...incident,
                    timeline: [{
                        timestamp: new Date().toISOString(),
                        type: 'detected',
                        message: `Incident created: ${incident.title}`
                    }]
                });

                addBreadcrumb('Incident created', 'error', {
                    incidentId: newIncident.id,
                    severity: incident.severity,
                    category: incident.category
                });

                // Auto-assign based on rules
                if (incident.severity === 'critical') {
                    await this.escalateIncident(newIncident.id);
                }

                // Send notifications
                await this.notifyIncident(newIncident);

                return newIncident;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'incident-response',
                    operation: 'createIncident'
                });
                throw error;
            }
        }, { feature: 'incident-response', severity: incident.severity });
    }

    async detectIncidents(): Promise<Incident[]> {
        if (isMockEnv()) return [];

        const newIncidents: Incident[] = [];

        try {
            // Check monitoring metrics
            const systemHealth = await this.checkSystemHealth();

            if (systemHealth.dbConnectionPool > 90) {
                const incident = await this.createIncident({
                    title: 'Database Connection Pool High',
                    description: `Connection pool at ${systemHealth.dbConnectionPool}%`,
                    severity: systemHealth.dbConnectionPool > 95 ? 'critical' : 'high',
                    status: 'open',
                    category: 'performance',
                    affectedServices: ['pocketbase'],
                    detectedBy: 'auto',
                    detectedAt: new Date().toISOString(),
                    priority: systemHealth.dbConnectionPool > 95 ? 1 : 2,
                    impact: systemHealth.dbConnectionPool > 95 ? 'critical' : 'major',
                    metrics: {}
                });
                newIncidents.push(incident);
            }

            if (systemHealth.errorRate > 5) {
                const incident = await this.createIncident({
                    title: 'High Error Rate Detected',
                    description: `Error rate at ${systemHealth.errorRate}%`,
                    severity: 'high',
                    status: 'open',
                    category: 'availability',
                    affectedServices: ['api'],
                    detectedBy: 'auto',
                    detectedAt: new Date().toISOString(),
                    priority: 2,
                    impact: 'major',
                    metrics: {}
                });
                newIncidents.push(incident);
            }

            return newIncidents;
        } catch (error) {
            console.error('Incident detection failed:', error);
            return [];
        }
    }

    private async checkSystemHealth(): Promise<{
        dbConnectionPool: number;
        errorRate: number;
        responseTime: number;
    }> {
        // In production, fetch from monitoring service
        return {
            dbConnectionPool: Math.random() * 100,
            errorRate: Math.random() * 10,
            responseTime: Math.random() * 1000
        };
    }

    async getIncidents(filters?: {
        status?: string;
        severity?: string;
        category?: string;
        assignedTo?: string;
    }): Promise<Incident[]> {
        if (isMockEnv()) return MOCK_INCIDENTS;

        const filterParts: string[] = [];
        if (filters?.status) filterParts.push(`status = "${filters.status}"`);
        if (filters?.severity) filterParts.push(`severity = "${filters.severity}"`);
        if (filters?.category) filterParts.push(`category = "${filters.category}"`);
        if (filters?.assignedTo) filterParts.push(`assignedTo = "${filters.assignedTo}"`);

        return await pb.collection('incidents').getFullList<Incident>({
            filter: filterParts.join(' && '),
            sort: '-priority,-created',
            requestKey: null
        });
    }

    async getIncident(id: string): Promise<Incident> {
        if (isMockEnv()) return MOCK_INCIDENTS[0];
        return await pb.collection('incidents').getOne<Incident>(id);
    }

    async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident> {
        if (isMockEnv()) {
            return { ...MOCK_INCIDENTS[0], ...updates, id };
        }

        return await pb.collection('incidents').update<Incident>(id, updates);
    }

    // ==================== INCIDENT LIFECYCLE ====================

    async acknowledgeIncident(id: string, userId: string): Promise<Incident> {
        const incident = await this.getIncident(id);

        const newEvent: IncidentEvent = {
            timestamp: new Date().toISOString(),
            type: 'acknowledged',
            message: `Incident acknowledged by ${userId}`,
            userId
        };

        return await this.updateIncident(id, {
            status: 'investigating',
            acknowledgedAt: new Date().toISOString(),
            assignedTo: userId,
            timeline: [...incident.timeline, newEvent]
        });
    }

    async addUpdate(id: string, message: string, userId: string, data?: Record<string, any>): Promise<Incident> {
        const incident = await this.getIncident(id);

        const newEvent: IncidentEvent = {
            timestamp: new Date().toISOString(),
            type: 'update',
            message,
            userId,
            data
        };

        return await this.updateIncident(id, {
            timeline: [...incident.timeline, newEvent]
        });
    }

    async escalateIncident(id: string, assignTo?: string): Promise<Incident> {
        const incident = await this.getIncident(id);

        const newEvent: IncidentEvent = {
            timestamp: new Date().toISOString(),
            type: 'escalated',
            message: assignTo ? `Escalated to ${assignTo}` : 'Escalated to on-call engineer'
        };

        return await this.updateIncident(id, {
            priority: Math.max(1, incident.priority - 1),
            assignedTo: assignTo,
            timeline: [...incident.timeline, newEvent]
        });
    }

    async resolveIncident(id: string, resolution: string, rootCause: string, preventionSteps: string[]): Promise<Incident> {
        const incident = await this.getIncident(id);
        const resolvedAt = new Date().toISOString();

        const responseTime = incident.acknowledgedAt 
            ? (new Date(resolvedAt).getTime() - new Date(incident.detectedAt).getTime()) / 1000
            : undefined;

        const resolutionTime = (new Date(resolvedAt).getTime() - new Date(incident.detectedAt).getTime()) / 1000;

        const newEvent: IncidentEvent = {
            timestamp: resolvedAt,
            type: 'resolved',
            message: `Incident resolved: ${resolution}`
        };

        return await this.updateIncident(id, {
            status: 'resolved',
            resolvedAt,
            resolution,
            rootCause,
            preventionSteps,
            timeline: [...incident.timeline, newEvent],
            metrics: {
                ...incident.metrics,
                responseTime,
                resolutionTime
            }
        });
    }

    async closeIncident(id: string): Promise<Incident> {
        const incident = await this.getIncident(id);

        const newEvent: IncidentEvent = {
            timestamp: new Date().toISOString(),
            type: 'closed',
            message: 'Incident closed'
        };

        return await this.updateIncident(id, {
            status: 'closed',
            closedAt: new Date().toISOString(),
            timeline: [...incident.timeline, newEvent]
        });
    }

    // ==================== NOTIFICATIONS ====================

    private async notifyIncident(incident: Incident): Promise<void> {
        try {
            // Send email notification (integrate with email service)
            console.log(`Incident notification: ${incident.title} [${incident.severity}]`);

            // In production, integrate with:
            // - Email service
            // - Slack webhooks
            // - SMS (Twilio)
            // - PagerDuty
        } catch (error) {
            console.error('Failed to send incident notification:', error);
        }
    }

    // ==================== RULES & AUTOMATION ====================

    async createRule(rule: Omit<IncidentRule, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<IncidentRule> {
        if (isMockEnv()) {
            return {
                ...rule,
                id: '1',
                collectionId: 'incident_rules',
                collectionName: 'incident_rules',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            } as unknown as IncidentRule;
        }

        return await pb.collection('incident_rules').create<IncidentRule>(rule);
    }

    async getRules(): Promise<IncidentRule[]> {
        if (isMockEnv()) {
            const MOCK_RULES: IncidentRule[] = [
                {
                    id: '1',
                    collectionId: 'incident_rules',
                    collectionName: 'incident_rules',
                    created: '2025-12-28T10:00:00Z',
                    updated: '2025-12-28T10:00:00Z',
                    name: 'Database Connection Pool Alert',
                    description: 'Trigger when DB connection pool exceeds 95% for 5 minutes',
                    enabled: true,
                    trigger: {
                        type: 'threshold',
                        metric: 'db_connection_pool',
                        threshold: 95,
                        operator: 'gt',
                        duration: 300
                    },
                    severity: 'critical',
                    category: 'performance',
                    notifyChannels: ['email', 'slack']
                }
            ];
            return MOCK_RULES;
        }

        return await pb.collection('incident_rules').getFullList<IncidentRule>({
            filter: 'enabled = true',
            requestKey: null
        });
    }

    // ==================== STATISTICS ====================

    async getIncidentStats(period?: { start: Date; end: Date }): Promise<IncidentStats> {
        if (isMockEnv()) {
            return {
                total: 23,
                open: 4,
                resolved: 19,
                critical: 2,
                averageResponseTime: 285,
                averageResolutionTime: 1820,
                byCategory: {
                    performance: 8,
                    security: 3,
                    availability: 7,
                    data: 2,
                    integration: 3
                },
                bySeverity: {
                    critical: 2,
                    high: 8,
                    medium: 10,
                    low: 3
                },
                mttr: 1820
            };
        }

        let filter = '';
        if (period) {
            filter = `created >= "${period.start.toISOString()}" && created <= "${period.end.toISOString()}"`;
        }

        const incidents = await pb.collection('incidents').getFullList<Incident>({
            filter,
            requestKey: null
        });

        const stats: IncidentStats = {
            total: incidents.length,
            open: incidents.filter(i => ['open', 'investigating', 'identified', 'monitoring'].includes(i.status)).length,
            resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length,
            critical: incidents.filter(i => i.severity === 'critical').length,
            averageResponseTime: 0,
            averageResolutionTime: 0,
            byCategory: {},
            bySeverity: {},
            mttr: 0
        };

        // Calculate averages
        const responseTimes = incidents
            .filter(i => i.metrics.responseTime)
            .map(i => i.metrics.responseTime!);
        stats.averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        const resolutionTimes = incidents
            .filter(i => i.metrics.resolutionTime)
            .map(i => i.metrics.resolutionTime!);
        stats.averageResolutionTime = resolutionTimes.length > 0
            ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
            : 0;

        stats.mttr = stats.averageResolutionTime;

        // Group by category and severity
        incidents.forEach(incident => {
            stats.byCategory[incident.category] = (stats.byCategory[incident.category] || 0) + 1;
            stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
        });

        return stats;
    }
}

export const incidentResponseService = new IncidentResponseService();
