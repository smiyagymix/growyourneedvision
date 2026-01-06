/**
 * AI Cost Service
 * Track AI usage costs, set budgets, and analyze spending
 */

import pb from '../lib/pocketbase';

export interface AIUsageLog {
    id: string;
    tenant_id?: string;
    model: string;
    feature: 'chat' | 'playground' | 'finetuning' | 'assistant';
    tokens_input: number;
    tokens_output: number;
    cost: number;
    response_time?: number;
    created: string;
}

export interface CostSummary {
    total_cost: number;
    total_tokens: number;
    total_requests: number;
    by_model: Record<string, {
        cost: number;
        tokens: number;
        requests: number;
        percentage: number;
    }>;
    by_tenant: Record<string, {
        cost: number;
        tokens: number;
        requests: number;
    }>;
    by_feature: Record<string, {
        cost: number;
        tokens: number;
        requests: number;
    }>;
}

export interface BudgetAlert {
    id: string;
    threshold: number; // 80, 90, 100
    amount: number;
    triggered: boolean;
    triggered_at?: string;
}

class AICostService {
    private collection = 'ai_usage_logs';
    private budgetKey = 'ai_monthly_budget';

    /**
     * Log AI usage for cost tracking
     */
    async logUsage(data: {
        tenant_id?: string;
        model: string;
        feature: 'chat' | 'playground' | 'finetuning' | 'assistant';
        tokens_input: number;
        tokens_output: number;
        cost: number;
        response_time?: number;
    }): Promise<AIUsageLog> {
        try {
            const log = await pb.collection(this.collection).create<AIUsageLog>(data);
            return log;
        } catch (error) {
            console.error('Error logging AI usage:', error);
            throw error;
        }
    }

    /**
     * Get cost summary for a date range
     */
    async getCostSummary(startDate?: Date, endDate?: Date): Promise<CostSummary> {
        try {
            let filter = '';
            if (startDate && endDate) {
                filter = `created >= "${startDate.toISOString()}" && created <= "${endDate.toISOString()}"`;
            } else if (startDate) {
                filter = `created >= "${startDate.toISOString()}"`;
            }

            const logs = await pb.collection(this.collection).getFullList<AIUsageLog>({
                filter,
                sort: '-created'
            });

            // Calculate totals
            const total_cost = logs.reduce((sum, log) => sum + log.cost, 0);
            const total_tokens = logs.reduce((sum, log) => sum + log.tokens_input + log.tokens_output, 0);
            const total_requests = logs.length;

            // Group by model
            const by_model: Record<string, any> = {};
            logs.forEach(log => {
                if (!by_model[log.model]) {
                    by_model[log.model] = { cost: 0, tokens: 0, requests: 0, percentage: 0 };
                }
                by_model[log.model].cost += log.cost;
                by_model[log.model].tokens += log.tokens_input + log.tokens_output;
                by_model[log.model].requests += 1;
            });

            // Calculate percentages
            Object.keys(by_model).forEach(model => {
                by_model[model].percentage = total_cost > 0
                    ? (by_model[model].cost / total_cost) * 100
                    : 0;
            });

            // Group by tenant
            const by_tenant: Record<string, any> = {};
            logs.forEach(log => {
                const tenantId = log.tenant_id || 'platform';
                if (!by_tenant[tenantId]) {
                    by_tenant[tenantId] = { cost: 0, tokens: 0, requests: 0 };
                }
                by_tenant[tenantId].cost += log.cost;
                by_tenant[tenantId].tokens += log.tokens_input + log.tokens_output;
                by_tenant[tenantId].requests += 1;
            });

            // Group by feature
            const by_feature: Record<string, any> = {};
            logs.forEach(log => {
                if (!by_feature[log.feature]) {
                    by_feature[log.feature] = { cost: 0, tokens: 0, requests: 0 };
                }
                by_feature[log.feature].cost += log.cost;
                by_feature[log.feature].tokens += log.tokens_input + log.tokens_output;
                by_feature[log.feature].requests += 1;
            });

            return {
                total_cost,
                total_tokens,
                total_requests,
                by_model,
                by_tenant,
                by_feature
            };
        } catch (error) {
            console.error('Error getting cost summary:', error);
            throw error;
        }
    }

    /**
     * Get current month's summary
     */
    async getCurrentMonthSummary(): Promise<CostSummary> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return this.getCostSummary(startOfMonth, endOfMonth);
    }

    /**
     * Set monthly budget
     */
    async setBudget(amount: number): Promise<void> {
        try {
            localStorage.setItem(this.budgetKey, amount.toString());
        } catch (error) {
            console.error('Error setting budget:', error);
            throw error;
        }
    }

    /**
     * Get monthly budget
     */
    getBudget(): number {
        try {
            const budget = localStorage.getItem(this.budgetKey);
            return budget ? parseFloat(budget) : 2000; // Default $2000
        } catch (error) {
            console.error('Error getting budget:', error);
            return 2000;
        }
    }

    /**
     * Get budget alerts
     */
    async getBudgetAlerts(): Promise<BudgetAlert[]> {
        const summary = await this.getCurrentMonthSummary();
        const budget = this.getBudget();
        const usagePercentage = (summary.total_cost / budget) * 100;

        const alerts: BudgetAlert[] = [
            {
                id: 'alert-80',
                threshold: 80,
                amount: budget * 0.8,
                triggered: usagePercentage >= 80,
                triggered_at: usagePercentage >= 80 ? new Date().toISOString() : undefined
            },
            {
                id: 'alert-90',
                threshold: 90,
                amount: budget * 0.9,
                triggered: usagePercentage >= 90,
                triggered_at: usagePercentage >= 90 ? new Date().toISOString() : undefined
            },
            {
                id: 'alert-100',
                threshold: 100,
                amount: budget,
                triggered: usagePercentage >= 100,
                triggered_at: usagePercentage >= 100 ? new Date().toISOString() : undefined
            }
        ];

        return alerts;
    }

    /**
     * Forecast costs based on current usage
     */
    async forecastMonthlyCost(): Promise<number> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const summary = await this.getCostSummary(startOfMonth, now);

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        const dailyAverage = summary.total_cost / daysPassed;

        return dailyAverage * daysInMonth;
    }

    /**
     * Get top spending tenants
     */
    async getTopTenants(limit: number = 10): Promise<Array<{ tenant_id: string; cost: number; tokens: number }>> {
        const summary = await this.getCurrentMonthSummary();

        return Object.entries(summary.by_tenant)
            .map(([tenant_id, data]) => ({
                tenant_id,
                cost: data.cost,
                tokens: data.tokens
            }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, limit);
    }
}

export const aiCostService = new AICostService();
