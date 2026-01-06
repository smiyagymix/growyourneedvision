/**
 * AI Usage Analytics Service
 * Analyze and visualize AI usage patterns
 */

import pb from '../lib/pocketbase';

export interface UsageMetrics {
    total_requests: number;
    total_tokens: number;
    total_cost: number;
    avg_response_time: number;
    by_model: Record<string, ModelMetrics>;
    by_feature: Record<string, FeatureMetrics>;
    by_day: DayMetrics[];
}

export interface ModelMetrics {
    requests: number;
    tokens: number;
    cost: number;
    avg_response_time: number;
    success_rate: number;
}

export interface FeatureMetrics {
    requests: number;
    tokens: number;
    cost: number;
}

export interface DayMetrics {
    date: string;
    requests: number;
    tokens: number;
    cost: number;
}

class AIUsageAnalyticsService {
    private collection = 'ai_usage_logs';

    /**
     * Get usage analytics for date range
     */
    async getUsageMetrics(startDate: Date, endDate: Date): Promise<UsageMetrics> {
        try {
            const filter = `created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`;
            const logs = await pb.collection(this.collection).getFullList({
                filter,
                sort: 'created'
            });

            // Calculate totals
            const total_requests = logs.length;
            const total_tokens = logs.reduce((sum, log) => sum + (log.tokens_input || 0) + (log.tokens_output || 0), 0);
            const total_cost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
            const avg_response_time = logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / (logs.length || 1);

            // By model
            const by_model: Record<string, ModelMetrics> = {};
            logs.forEach(log => {
                if (!by_model[log.model]) {
                    by_model[log.model] = {
                        requests: 0,
                        tokens: 0,
                        cost: 0,
                        avg_response_time: 0,
                        success_rate: 100
                    };
                }
                by_model[log.model].requests++;
                by_model[log.model].tokens += (log.tokens_input || 0) + (log.tokens_output || 0);
                by_model[log.model].cost += log.cost || 0;
                by_model[log.model].avg_response_time += (log.response_time || 0);
            });

            // Calculate averages
            Object.keys(by_model).forEach(model => {
                by_model[model].avg_response_time /= by_model[model].requests;
            });

            // By feature
            const by_feature: Record<string, FeatureMetrics> = {};
            logs.forEach(log => {
                if (!by_feature[log.feature]) {
                    by_feature[log.feature] = {
                        requests: 0,
                        tokens: 0,
                        cost: 0
                    };
                }
                by_feature[log.feature].requests++;
                by_feature[log.feature].tokens += (log.tokens_input || 0) + (log.tokens_output || 0);
                by_feature[log.feature].cost += log.cost || 0;
            });

            // By day
            const dayMap = new Map<string, DayMetrics>();
            logs.forEach(log => {
                const date = new Date(log.created).toISOString().split('T')[0];
                if (!dayMap.has(date)) {
                    dayMap.set(date, { date, requests: 0, tokens: 0, cost: 0 });
                }
                const day = dayMap.get(date)!;
                day.requests++;
                day.tokens += (log.tokens_input || 0) + (log.tokens_output || 0);
                day.cost += log.cost || 0;
            });

            const by_day = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

            return {
                total_requests,
                total_tokens,
                total_cost,
                avg_response_time,
                by_model,
                by_feature,
                by_day
            };
        } catch (error) {
            console.error('Error getting usage metrics:', error);
            throw error;
        }
    }

    /**
     * Get usage trend (growth rate)
     */
    async getUsageTrend(days: number = 30): Promise<{
        current_period: number;
        previous_period: number;
        growth_rate: number;
    }> {
        try {
            const now = new Date();
            const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            const previousStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

            const currentMetrics = await this.getUsageMetrics(periodStart, now);
            const previousMetrics = await this.getUsageMetrics(previousStart, periodStart);

            const growth_rate = previousMetrics.total_requests > 0
                ? ((currentMetrics.total_requests - previousMetrics.total_requests) / previousMetrics.total_requests) * 100
                : 0;

            return {
                current_period: currentMetrics.total_requests,
                previous_period: previousMetrics.total_requests,
                growth_rate
            };
        } catch (error) {
            console.error('Error calculating trend:', error);
            throw error;
        }
    }

    /**
     * Get peak usage hours
     */
    async getPeakHours(days: number = 7): Promise<Array<{ hour: number; requests: number }>> {
        try {
            const now = new Date();
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

            const filter = `created >= "${startDate.toISOString()}"`;
            const logs = await pb.collection(this.collection).getFullList({ filter });

            const hourCount: Record<number, number> = {};
            logs.forEach(log => {
                const hour = new Date(log.created).getHours();
                hourCount[hour] = (hourCount[hour] || 0) + 1;
            });

            return Object.entries(hourCount)
                .map(([hour, requests]) => ({ hour: parseInt(hour), requests }))
                .sort((a, b) => b.requests - a.requests);
        } catch (error) {
            console.error('Error getting peak hours:', error);
            throw error;
        }
    }

    /**
     * Get model performance comparison
     */
    async getModelPerformance(): Promise<Array<{
        model: string;
        avg_response_time: number;
        avg_cost_per_request: number;
        total_requests: number;
    }>> {
        try {
            const logs = await pb.collection(this.collection).getFullList({ sort: '-created' });

            const modelData: Record<string, any> = {};
            logs.forEach(log => {
                if (!modelData[log.model]) {
                    modelData[log.model] = {
                        model: log.model,
                        total_response_time: 0,
                        total_cost: 0,
                        total_requests: 0
                    };
                }
                const data = modelData[log.model];
                data.total_response_time += log.response_time || 0;
                data.total_cost += log.cost || 0;
                data.total_requests++;
            });

            return Object.values(modelData).map((data: any) => ({
                model: data.model,
                avg_response_time: data.total_response_time / data.total_requests,
                avg_cost_per_request: data.total_cost / data.total_requests,
                total_requests: data.total_requests
            })).sort((a, b) => b.total_requests - a.total_requests);
        } catch (error) {
            console.error('Error getting model performance:', error);
            throw error;
        }
    }
}

export const aiUsageAnalyticsService = new AIUsageAnalyticsService();
