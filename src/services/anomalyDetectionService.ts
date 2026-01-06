import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import env from '../config/environment';

export interface Anomaly extends RecordModel {
    tenantId?: string;
    type: 'revenue_drop' | 'usage_spike' | 'error_rate' | 'response_time' | 'user_churn' | 'storage_spike' | 'api_abuse';
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    currentValue: number;
    expectedValue: number;
    threshold: number;
    deviation: number; // Percentage deviation from expected
    detectedAt: string;
    status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
    acknowledgedBy?: string;
    resolvedAt?: string;
    description: string;
    affectedEntities: string[]; // Tenant IDs or user IDs affected
}

export interface AnomalyPattern {
    metric: string;
    baseline: number;
    stdDev: number;
    upperThreshold: number;
    lowerThreshold: number;
    dataPoints: number;
    lastUpdated: string;
}

export interface AnomalyStats {
    totalAnomalies: number;
    activeAnomalies: number;
    criticalAnomalies: number;
    resolvedToday: number;
    falsePositives: number;
    averageResolutionTime: number; // minutes
    topAnomalyTypes: Array<{ type: string; count: number }>;
}

export const anomalyDetectionService = {
    /**
     * Get all anomalies with optional filtering
     */
    async getAnomalies(filter?: {
        status?: string;
        severity?: string;
        type?: string;
        tenantId?: string;
        limit?: number;
    }): Promise<Anomaly[]> {
        try {
            let filterString = '';
            const conditions: string[] = [];

            if (filter?.status) conditions.push(`status = "${filter.status}"`);
            if (filter?.severity) conditions.push(`severity = "${filter.severity}"`);
            if (filter?.type) conditions.push(`type = "${filter.type}"`);
            if (filter?.tenantId) conditions.push(`tenantId = "${filter.tenantId}"`);

            if (conditions.length > 0) {
                filterString = conditions.join(' && ');
            }

            return await pb.collection('anomaly_detections').getFullList<Anomaly>({
                filter: filterString || undefined,
                sort: '-detectedAt',
                limit: filter?.limit,
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching anomalies:', error);
            return [];
        }
    },

    /**
     * Get active anomalies (not resolved or acknowledged)
     */
    async getActiveAnomalies(): Promise<Anomaly[]> {
        return this.getAnomalies({ status: 'active' });
    },

    /**
     * Get critical anomalies
     */
    async getCriticalAnomalies(): Promise<Anomaly[]> {
        return this.getAnomalies({ severity: 'critical', status: 'active' });
    },

    /**
     * Create new anomaly
     */
    async createAnomaly(anomaly: Omit<Anomaly, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<Anomaly> {
        try {
            const created = await pb.collection('anomaly_detections').create<Anomaly>(anomaly);
            
            // If critical, create system alert
            if (anomaly.severity === 'critical') {
                await this.createSystemAlert(created);
            }

            console.log(`🚨 Anomaly detected: ${anomaly.type} (${anomaly.severity})`);
            return created;
        } catch (error) {
            console.error('Error creating anomaly:', error);
            throw error;
        }
    },

    /**
     * Create system alert for critical anomaly
     */
    async createSystemAlert(anomaly: Anomaly): Promise<void> {
        try {
            await pb.collection('system_alerts').create({
                type: 'anomaly',
                severity: anomaly.severity,
                message: anomaly.description,
                category: anomaly.type,
                isAcknowledged: false,
                metadata: {
                    anomalyId: anomaly.id,
                    metric: anomaly.metric,
                    currentValue: anomaly.currentValue,
                    expectedValue: anomaly.expectedValue,
                    deviation: anomaly.deviation
                }
            });
        } catch (error) {
            console.error('Error creating system alert:', error);
        }
    },

    /**
     * Acknowledge anomaly
     */
    async acknowledgeAnomaly(anomalyId: string, userId: string): Promise<boolean> {
        try {
            await pb.collection('anomaly_detections').update(anomalyId, {
                status: 'acknowledged',
                acknowledgedBy: userId
            });
            return true;
        } catch (error) {
            console.error('Error acknowledging anomaly:', error);
            return false;
        }
    },

    /**
     * Resolve anomaly
     */
    async resolveAnomaly(anomalyId: string): Promise<boolean> {
        try {
            await pb.collection('anomaly_detections').update(anomalyId, {
                status: 'resolved',
                resolvedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error resolving anomaly:', error);
            return false;
        }
    },

    /**
     * Mark anomaly as false positive
     */
    async markFalsePositive(anomalyId: string): Promise<boolean> {
        try {
            await pb.collection('anomaly_detections').update(anomalyId, {
                status: 'false_positive',
                resolvedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error marking false positive:', error);
            return false;
        }
    },

    /**
     * Get anomaly statistics
     */
    async getAnomalyStats(): Promise<AnomalyStats> {
        try {
            const allAnomalies = await pb.collection('anomaly_detections').getFullList<Anomaly>({
                requestKey: null
            });

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const activeAnomalies = allAnomalies.filter(a => a.status === 'active');
            const criticalAnomalies = activeAnomalies.filter(a => a.severity === 'critical');
            const resolvedToday = allAnomalies.filter(a => 
                a.status === 'resolved' && 
                a.resolvedAt && 
                new Date(a.resolvedAt) >= today
            );
            const falsePositives = allAnomalies.filter(a => a.status === 'false_positive');

            // Calculate average resolution time
            const resolvedAnomalies = allAnomalies.filter(a => a.status === 'resolved' && a.resolvedAt);
            let totalResolutionTime = 0;
            resolvedAnomalies.forEach(a => {
                if (a.resolvedAt) {
                    const detectedTime = new Date(a.detectedAt).getTime();
                    const resolvedTime = new Date(a.resolvedAt).getTime();
                    totalResolutionTime += (resolvedTime - detectedTime) / (1000 * 60); // minutes
                }
            });
            const averageResolutionTime = resolvedAnomalies.length > 0 
                ? Math.round(totalResolutionTime / resolvedAnomalies.length) 
                : 0;

            // Count anomaly types
            const typeCounts = new Map<string, number>();
            allAnomalies.forEach(a => {
                typeCounts.set(a.type, (typeCounts.get(a.type) || 0) + 1);
            });

            const topAnomalyTypes = Array.from(typeCounts.entries())
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return {
                totalAnomalies: allAnomalies.length,
                activeAnomalies: activeAnomalies.length,
                criticalAnomalies: criticalAnomalies.length,
                resolvedToday: resolvedToday.length,
                falsePositives: falsePositives.length,
                averageResolutionTime,
                topAnomalyTypes
            };
        } catch (error) {
            console.error('Error calculating anomaly stats:', error);
            return {
                totalAnomalies: 0,
                activeAnomalies: 0,
                criticalAnomalies: 0,
                resolvedToday: 0,
                falsePositives: 0,
                averageResolutionTime: 0,
                topAnomalyTypes: []
            };
        }
    },

    /**
     * Detect anomalies using Z-score method
     * @param metric - Metric name (e.g., 'revenue', 'error_rate')
     * @param currentValue - Current metric value
     * @param historicalData - Array of historical values
     * @param zScoreThreshold - Z-score threshold (default 3 = 99.7% confidence)
     */
    detectZScoreAnomaly(
        metric: string,
        currentValue: number,
        historicalData: number[],
        zScoreThreshold: number = 3
    ): { isAnomaly: boolean; zScore: number; baseline: number; stdDev: number } {
        if (historicalData.length < 7) {
            return { isAnomaly: false, zScore: 0, baseline: currentValue, stdDev: 0 };
        }

        // Calculate mean
        const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;

        // Calculate standard deviation
        const squaredDiffs = historicalData.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / historicalData.length;
        const stdDev = Math.sqrt(variance);

        // Avoid division by zero
        if (stdDev === 0) {
            return { isAnomaly: false, zScore: 0, baseline: mean, stdDev: 0 };
        }

        // Calculate z-score
        const zScore = Math.abs((currentValue - mean) / stdDev);

        return {
            isAnomaly: zScore > zScoreThreshold,
            zScore,
            baseline: mean,
            stdDev
        };
    },

    /**
     * Check for revenue drop anomaly
     */
    async checkRevenueDrop(tenantId: string, currentRevenue: number): Promise<Anomaly | null> {
        try {
            // Get historical revenue data (last 30 days)
            const historicalData = await this.getHistoricalMetric(tenantId, 'revenue', 30);
            
            const result = this.detectZScoreAnomaly('revenue', currentRevenue, historicalData, 2.5);

            if (result.isAnomaly && currentRevenue < result.baseline) {
                const deviation = ((result.baseline - currentRevenue) / result.baseline) * 100;
                
                return await this.createAnomaly({
                    tenantId,
                    type: 'revenue_drop',
                    severity: deviation > 30 ? 'critical' : deviation > 15 ? 'high' : 'medium',
                    metric: 'revenue',
                    currentValue: currentRevenue,
                    expectedValue: result.baseline,
                    threshold: result.baseline - (result.stdDev * 2.5),
                    deviation,
                    detectedAt: new Date().toISOString(),
                    status: 'active',
                    description: `Revenue dropped ${deviation.toFixed(1)}% below expected baseline ($${currentRevenue.toFixed(2)} vs $${result.baseline.toFixed(2)})`,
                    affectedEntities: [tenantId]
                });
            }

            return null;
        } catch (error) {
            console.error('Error checking revenue drop:', error);
            return null;
        }
    },

    /**
     * Check for usage spike anomaly
     */
    async checkUsageSpike(tenantId: string, currentUsage: number): Promise<Anomaly | null> {
        try {
            const historicalData = await this.getHistoricalMetric(tenantId, 'api_requests', 7);
            
            const result = this.detectZScoreAnomaly('api_requests', currentUsage, historicalData, 3);

            if (result.isAnomaly && currentUsage > result.baseline) {
                const deviation = ((currentUsage - result.baseline) / result.baseline) * 100;
                
                return await this.createAnomaly({
                    tenantId,
                    type: 'usage_spike',
                    severity: deviation > 200 ? 'critical' : deviation > 100 ? 'high' : 'medium',
                    metric: 'api_requests',
                    currentValue: currentUsage,
                    expectedValue: result.baseline,
                    threshold: result.baseline + (result.stdDev * 3),
                    deviation,
                    detectedAt: new Date().toISOString(),
                    status: 'active',
                    description: `API usage spiked ${deviation.toFixed(1)}% above baseline (${currentUsage} vs ${result.baseline.toFixed(0)} requests)`,
                    affectedEntities: [tenantId]
                });
            }

            return null;
        } catch (error) {
            console.error('Error checking usage spike:', error);
            return null;
        }
    },

    /**
     * Check for error rate anomaly
     */
    async checkErrorRate(errorRate: number): Promise<Anomaly | null> {
        try {
            const historicalData = await this.getHistoricalMetric(null, 'error_rate', 7);
            
            const result = this.detectZScoreAnomaly('error_rate', errorRate, historicalData, 2);

            if (result.isAnomaly && errorRate > result.baseline) {
                const deviation = ((errorRate - result.baseline) / (result.baseline || 0.01)) * 100;
                
                return await this.createAnomaly({
                    type: 'error_rate',
                    severity: errorRate > 5 ? 'critical' : errorRate > 2 ? 'high' : 'medium',
                    metric: 'error_rate',
                    currentValue: errorRate,
                    expectedValue: result.baseline,
                    threshold: result.baseline + (result.stdDev * 2),
                    deviation,
                    detectedAt: new Date().toISOString(),
                    status: 'active',
                    description: `Error rate increased to ${errorRate.toFixed(2)}% (baseline: ${result.baseline.toFixed(2)}%)`,
                    affectedEntities: []
                });
            }

            return null;
        } catch (error) {
            console.error('Error checking error rate:', error);
            return null;
        }
    },

    /**
     * Get historical metric data (mock implementation)
     * In production, this would query from analytics/metrics database
     */
    async getHistoricalMetric(tenantId: string | null, metric: string, days: number): Promise<number[]> {
        // Mock implementation - returns simulated historical data
        // In production, query from tenant_usage or analytics tables
        const baseValue = metric === 'revenue' ? 1000 : metric === 'api_requests' ? 5000 : 1.5;
        const data: number[] = [];
        
        for (let i = 0; i < days; i++) {
            const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
            data.push(baseValue * (1 + variance));
        }

        return data;
    },

    /**
     * Run anomaly detection for all tenants
     */
    async runAnomalyDetection(): Promise<{ detected: number; anomalies: Anomaly[] }> {
        const anomalies: Anomaly[] = [];

        try {
            // In production, get actual tenant metrics from database
            // For now, this is a placeholder that would be called by scheduler

            console.log('Running anomaly detection sweep...');
            
            // Example: Check system-wide error rate
            const systemErrorRate = Math.random() * 10; // Mock error rate
            const errorAnomaly = await this.checkErrorRate(systemErrorRate);
            if (errorAnomaly) anomalies.push(errorAnomaly);

            return { detected: anomalies.length, anomalies };
        } catch (error) {
            console.error('Error running anomaly detection:', error);
            return { detected: 0, anomalies: [] };
        }
    },

    /**
     * Get anomaly detection patterns (baselines)
     */
    async getAnomalyPatterns(): Promise<AnomalyPattern[]> {
        // In production, this would return established baselines for all metrics
        // Stored in anomaly_patterns collection
        return [
            {
                metric: 'revenue',
                baseline: 1000,
                stdDev: 150,
                upperThreshold: 1450,
                lowerThreshold: 550,
                dataPoints: 30,
                lastUpdated: new Date().toISOString()
            },
            {
                metric: 'api_requests',
                baseline: 5000,
                stdDev: 800,
                upperThreshold: 7400,
                lowerThreshold: 2600,
                dataPoints: 7,
                lastUpdated: new Date().toISOString()
            },
            {
                metric: 'error_rate',
                baseline: 1.2,
                stdDev: 0.5,
                upperThreshold: 2.2,
                lowerThreshold: 0.2,
                dataPoints: 14,
                lastUpdated: new Date().toISOString()
            }
        ];
    }
};
