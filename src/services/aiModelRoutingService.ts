/**
 * AI Model Routing Service
 * Intelligent model selection based on rules
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';

export interface RoutingRule {
    id: string;
    name: string;
    priority: number;
    enabled: boolean;
    conditions: {
        token_count?: { min?: number; max?: number };
        cost_sensitivity?: 'low' | 'medium' | 'high';
        response_time?: 'fast' | 'normal' | 'slow';
        features?: string[];
        tenants?: string[];
    };
    model_selection: string;
    fallback_model?: string;
    created: string;
    updated: string;
}

class AIModelRoutingService {
    private collection = 'ai_model_routing_rules';

    /**
     * Get all routing rules
     */
    async getAllRules(): Promise<RoutingRule[]> {
        try {
            return await pb.collection(this.collection).getFullList<RoutingRule>({
                sort: '-priority,name'
            });
        } catch (error) {
            console.error('Error fetching routing rules:', error);
            throw error;
        }
    }

    /**
     * Create routing rule
     */
    async createRule(data: Partial<RoutingRule>): Promise<RoutingRule> {
        try {
            const rule = await pb.collection(this.collection).create<RoutingRule>(data);
            await auditLogger.log({
                action: 'routingRuleCreate',
                resource_type: 'ai_routing_rule',
                resource_id: rule.id,
                severity: 'info',
                metadata: { name: rule.name }
            });
            return rule;
        } catch (error) {
            console.error('Error creating rule:', error);
            throw error;
        }
    }

    /**
     * Update routing rule
     */
    async updateRule(id: string, data: Partial<RoutingRule>): Promise<RoutingRule> {
        try {
            const rule = await pb.collection(this.collection).update<RoutingRule>(id, data);
            await auditLogger.log({
                action: 'routingRuleUpdate',
                resource_type: 'ai_routing_rule',
                resource_id: id,
                severity: 'info'
            });
            return rule;
        } catch (error) {
            console.error('Error updating rule:', error);
            throw error;
        }
    }

    /**
     * Delete routing rule
     */
    async deleteRule(id: string): Promise<boolean> {
        try {
            await pb.collection(this.collection).delete(id);
            await auditLogger.log({
                action: 'routingRuleDelete',
                resource_type: 'ai_routing_rule',
                resource_id: id,
                severity: 'warning'
            });
            return true;
        } catch (error) {
            console.error('Error deleting rule:', error);
            throw error;
        }
    }

    /**
     * Select model based on routing rules
     */
    async selectModel(context: {
        token_count: number;
        feature: string;
        tenant_id?: string;
        cost_sensitivity?: 'low' | 'medium' | 'high';
    }): Promise<string> {
        try {
            const rules = await this.getAllRules();
            const enabledRules = rules.filter(r => r.enabled);

            for (const rule of enabledRules) {
                if (this.matchesConditions(rule.conditions, context)) {
                    return rule.model_selection;
                }
            }

            // Default fallback
            return 'gpt-3.5-turbo';
        } catch (error) {
            console.error('Error selecting model:', error);
            return 'gpt-3.5-turbo';
        }
    }

    /**
     * Check if context matches rule conditions
     */
    private matchesConditions(
        conditions: RoutingRule['conditions'],
        context: any
    ): boolean {
        // Token count check
        if (conditions.token_count) {
            if (conditions.token_count.min && context.token_count < conditions.token_count.min) {
                return false;
            }
            if (conditions.token_count.max && context.token_count > conditions.token_count.max) {
                return false;
            }
        }

        // Cost sensitivity check
        if (conditions.cost_sensitivity && context.cost_sensitivity !== conditions.cost_sensitivity) {
            return false;
        }

        // Feature check
        if (conditions.features && !conditions.features.includes(context.feature)) {
            return false;
        }

        // Tenant check
        if (conditions.tenants && context.tenant_id && !conditions.tenants.includes(context.tenant_id)) {
            return false;
        }

        return true;
    }
}

export const aiModelRoutingService = new AIModelRoutingService();
