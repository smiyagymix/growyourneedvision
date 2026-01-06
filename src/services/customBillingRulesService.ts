/**
 * Custom Billing Rules Engine
 * 
 * Flexible billing rules system for usage-based pricing, discounts, 
 * custom billing cycles, and complex pricing scenarios
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';

export interface BillingRule {
    id: string;
    name: string;
    description: string;
    type: 'usage' | 'discount' | 'surcharge' | 'credit' | 'proration';
    trigger: RuleTrigger;
    conditions: RuleCondition[];
    action: RuleAction;
    priority: number;
    isActive: boolean;
    tenantIds?: string[];
    plans?: string[];
    created: string;
    updated: string;
}

export interface RuleTrigger {
    event: 'usage_threshold' | 'plan_change' | 'renewal' | 'manual' | 'scheduled';
    threshold?: number;
    metric?: string;
    schedule?: string; // cron expression
}

export interface RuleCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
    value: any;
}

export interface RuleAction {
    type: 'apply_discount' | 'add_charge' | 'add_credit' | 'send_notification' | 'upgrade_plan' | 'downgrade_plan';
    amount?: number;
    amountType?: 'fixed' | 'percentage';
    target?: string;
    metadata?: Record<string, any>;
}

export interface BillingCalculation {
    baseAmount: number;
    adjustments: {
        ruleId: string;
        ruleName: string;
        type: string;
        amount: number;
        description: string;
    }[];
    finalAmount: number;
    currency: string;
}

export interface UsageMetric {
    name: string;
    value: number;
    unit: string;
    period: string;
    cost?: number;
}

const MOCK_RULES: BillingRule[] = [
    {
        id: '1',
        name: 'Storage Overage Charge',
        description: 'Charge $0.10 per GB over plan limit',
        type: 'usage',
        trigger: { event: 'usage_threshold', metric: 'storage', threshold: 100 },
        conditions: [{ field: 'storage_gb', operator: 'gt', value: 100 }],
        action: { type: 'add_charge', amount: 0.10, amountType: 'fixed', target: 'storage_overage' },
        priority: 1,
        isActive: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Annual Plan Discount',
        description: '20% discount for annual billing',
        type: 'discount',
        trigger: { event: 'plan_change' },
        conditions: [{ field: 'billing_cycle', operator: 'eq', value: 'annual' }],
        action: { type: 'apply_discount', amount: 20, amountType: 'percentage' },
        priority: 2,
        isActive: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

class CustomBillingRulesService {
    /**
     * Get all billing rules
     */
    async getRules(filters?: { type?: string; isActive?: boolean }): Promise<BillingRule[]> {
        try {
            if (isMockEnv()) {
                let rules = MOCK_RULES;
                if (filters?.type) {
                    rules = rules.filter(r => r.type === filters.type);
                }
                if (filters?.isActive !== undefined) {
                    rules = rules.filter(r => r.isActive === filters.isActive);
                }
                return rules;
            }

            const filterParts: string[] = [];
            if (filters?.type) filterParts.push(`type = "${filters.type}"`);
            if (filters?.isActive !== undefined) filterParts.push(`isActive = ${filters.isActive}`);

            return await pb.collection('billing_rules').getFullList({
                filter: filterParts.join(' && ') || undefined,
                sort: 'priority',
                requestKey: null
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Create new billing rule
     */
    async createRule(rule: Omit<BillingRule, 'id' | 'created' | 'updated'>): Promise<BillingRule> {
        try {
            if (isMockEnv()) {
                return {
                    ...rule,
                    id: 'mock-' + Date.now(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };
            }

            return await pb.collection('billing_rules').create({
                ...rule,
                trigger: JSON.stringify(rule.trigger),
                conditions: JSON.stringify(rule.conditions),
                action: JSON.stringify(rule.action)
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Update existing rule
     */
    async updateRule(ruleId: string, updates: Partial<BillingRule>): Promise<BillingRule> {
        try {
            if (isMockEnv()) {
                const rule = MOCK_RULES.find(r => r.id === ruleId);
                return { ...rule!, ...updates, updated: new Date().toISOString() };
            }

            const data: any = { ...updates };
            if (updates.trigger) data.trigger = JSON.stringify(updates.trigger);
            if (updates.conditions) data.conditions = JSON.stringify(updates.conditions);
            if (updates.action) data.action = JSON.stringify(updates.action);

            return await pb.collection('billing_rules').update(ruleId, data);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Delete rule
     */
    async deleteRule(ruleId: string): Promise<void> {
        try {
            if (isMockEnv()) return;
            await pb.collection('billing_rules').delete(ruleId);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Calculate billing for tenant with rules applied
     */
    async calculateBilling(tenantId: string, usage: UsageMetric[]): Promise<BillingCalculation> {
        return await Sentry.startSpan(
            { name: 'calculateBilling', op: 'billing.calculate' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return {
                            baseAmount: 99.00,
                            adjustments: [
                                {
                                    ruleId: '1',
                                    ruleName: 'Storage Overage Charge',
                                    type: 'usage',
                                    amount: 5.00,
                                    description: '50 GB over limit at $0.10/GB'
                                },
                                {
                                    ruleId: '2',
                                    ruleName: 'Annual Plan Discount',
                                    type: 'discount',
                                    amount: -19.80,
                                    description: '20% discount for annual billing'
                                }
                            ],
                            finalAmount: 84.20,
                            currency: 'USD'
                        };
                    }

                    // Get tenant info
                    const tenant = await pb.collection('tenants').getOne(tenantId, { requestKey: null });
                    
                    // Get applicable rules
                    const rules = await this.getRules({ isActive: true });
                    const applicableRules = rules.filter(rule => 
                        this.isRuleApplicable(rule, tenant, usage)
                    );

                    // Sort by priority
                    applicableRules.sort((a, b) => a.priority - b.priority);

                    // Calculate base amount from tenant plan
                    let baseAmount = this.getBasePriceForPlan(tenant.plan);

                    // Apply rules
                    const adjustments: BillingCalculation['adjustments'] = [];

                    for (const rule of applicableRules) {
                        const adjustment = this.applyRule(rule, tenant, usage, baseAmount);
                        if (adjustment) {
                            adjustments.push(adjustment);
                        }
                    }

                    // Calculate final amount
                    const finalAmount = baseAmount + adjustments.reduce((sum, adj) => sum + adj.amount, 0);

                    return {
                        baseAmount,
                        adjustments,
                        finalAmount: Math.max(0, finalAmount), // Never negative
                        currency: 'USD'
                    };
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Evaluate rule trigger conditions
     */
    async evaluateTrigger(ruleId: string, tenantId: string, context: any): Promise<boolean> {
        try {
            const rule = isMockEnv() 
                ? MOCK_RULES.find(r => r.id === ruleId)!
                : await pb.collection('billing_rules').getOne(ruleId, { requestKey: null });

            if (!rule.isActive) return false;

            // Check trigger event
            if (rule.trigger.event === 'usage_threshold') {
                const metric = context.usage?.find((u: UsageMetric) => u.name === rule.trigger.metric);
                if (metric && rule.trigger.threshold) {
                    return metric.value > rule.trigger.threshold;
                }
            }

            if (rule.trigger.event === 'plan_change') {
                return context.event === 'plan_changed';
            }

            if (rule.trigger.event === 'renewal') {
                return context.event === 'subscription_renewed';
            }

            // Check conditions
            return rule.conditions.every((condition: RuleCondition) => 
                this.evaluateCondition(condition, context)
            );
        } catch (error) {
            Sentry.captureException(error);
            return false;
        }
    }

    /**
     * Execute rule action
     */
    async executeAction(ruleId: string, tenantId: string, context: any): Promise<void> {
        try {
            const rule = isMockEnv()
                ? MOCK_RULES.find(r => r.id === ruleId)!
                : await pb.collection('billing_rules').getOne(ruleId, { requestKey: null });

            switch (rule.action.type) {
                case 'apply_discount':
                    await this.applyDiscount(tenantId, rule.action.amount!, rule.action.amountType!);
                    break;
                
                case 'add_charge':
                    await this.addCharge(tenantId, rule.action.amount!, rule.action.target!, rule.name);
                    break;

                case 'add_credit':
                    await this.addCredit(tenantId, rule.action.amount!);
                    break;

                case 'send_notification':
                    await this.sendNotification(tenantId, rule.action.metadata || {});
                    break;

                case 'upgrade_plan':
                case 'downgrade_plan':
                    await this.changePlan(tenantId, rule.action.target!);
                    break;
            }

            // Log rule execution
            if (!isMockEnv()) {
                await pb.collection('billing_rule_executions').create({
                    ruleId,
                    tenantId,
                    action: rule.action.type,
                    context: JSON.stringify(context),
                    executedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Get rule execution history
     */
    async getExecutionHistory(ruleId: string, limit: number = 50): Promise<any[]> {
        try {
            if (isMockEnv()) {
                return [
                    {
                        id: '1',
                        ruleId,
                        tenantId: 'tenant-1',
                        action: 'apply_discount',
                        executedAt: new Date().toISOString()
                    }
                ];
            }

            return await pb.collection('billing_rule_executions').getList(1, limit, {
                filter: `ruleId = "${ruleId}"`,
                sort: '-executedAt',
                requestKey: null
            }).then(res => res.items);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Test rule with sample data
     */
    async testRule(rule: Omit<BillingRule, 'id' | 'created' | 'updated'>, sampleData: any): Promise<{
        triggered: boolean;
        result?: any;
        errors?: string[];
    }> {
        try {
            const triggered = rule.conditions.every(condition =>
                this.evaluateCondition(condition, sampleData)
            );

            if (!triggered) {
                return { triggered: false };
            }

            // Simulate action result
            let result: any = {};
            switch (rule.action.type) {
                case 'apply_discount':
                    result = {
                        discount: rule.action.amount,
                        type: rule.action.amountType,
                        description: `${rule.action.amount}${rule.action.amountType === 'percentage' ? '%' : '$'} discount applied`
                    };
                    break;
                
                case 'add_charge':
                    result = {
                        charge: rule.action.amount,
                        target: rule.action.target,
                        description: `$${rule.action.amount} charge for ${rule.action.target}`
                    };
                    break;
            }

            return { triggered: true, result };
        } catch (error) {
            return {
                triggered: false,
                errors: [(error as Error).message]
            };
        }
    }

    /**
     * Check if rule is applicable to tenant
     */
    private isRuleApplicable(rule: BillingRule, tenant: any, usage: UsageMetric[]): boolean {
        // Check tenant filter
        if (rule.tenantIds && !rule.tenantIds.includes(tenant.id)) {
            return false;
        }

        // Check plan filter
        if (rule.plans && !rule.plans.includes(tenant.plan)) {
            return false;
        }

        // Check conditions
        const context = { tenant, usage };
        return rule.conditions.every(condition => 
            this.evaluateCondition(condition, context)
        );
    }

    /**
     * Apply rule and calculate adjustment
     */
    private applyRule(
        rule: BillingRule,
        tenant: any,
        usage: UsageMetric[],
        baseAmount: number
    ): BillingCalculation['adjustments'][0] | null {
        const action = rule.action;

        switch (action.type) {
            case 'apply_discount': {
                const amount = action.amountType === 'percentage'
                    ? -(baseAmount * (action.amount! / 100))
                    : -action.amount!;
                
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    type: 'discount',
                    amount,
                    description: rule.description
                };
            }

            case 'add_charge': {
                const metric = usage.find(u => u.name === action.target);
                const overage = metric ? Math.max(0, metric.value - (rule.trigger.threshold || 0)) : 0;
                const amount = overage * (action.amount || 0);

                if (amount === 0) return null;

                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    type: 'usage',
                    amount,
                    description: `${overage} ${metric?.unit || 'units'} over limit`
                };
            }

            case 'add_credit': {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    type: 'credit',
                    amount: -action.amount!,
                    description: rule.description
                };
            }

            default:
                return null;
        }
    }

    /**
     * Evaluate condition
     */
    private evaluateCondition(condition: RuleCondition, context: any): boolean {
        const value = this.getNestedValue(context, condition.field);

        switch (condition.operator) {
            case 'eq':
                return value === condition.value;
            case 'ne':
                return value !== condition.value;
            case 'gt':
                return value > condition.value;
            case 'gte':
                return value >= condition.value;
            case 'lt':
                return value < condition.value;
            case 'lte':
                return value <= condition.value;
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(value);
            case 'between':
                return Array.isArray(condition.value) && 
                       value >= condition.value[0] && 
                       value <= condition.value[1];
            default:
                return false;
        }
    }

    /**
     * Get nested value from object
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Get base price for plan
     */
    private getBasePriceForPlan(plan: string): number {
        const prices: Record<string, number> = {
            free: 0,
            basic: 29,
            professional: 99,
            enterprise: 299
        };
        return prices[plan] || 0;
    }

    // Action methods (simplified - in production these would integrate with billing system)
    private async applyDiscount(tenantId: string, amount: number, type: string): Promise<void> {
        // Implementation would update Stripe subscription or invoice
        console.log(`Applied ${amount}${type === 'percentage' ? '%' : '$'} discount to tenant ${tenantId}`);
    }

    private async addCharge(tenantId: string, amount: number, target: string, description: string): Promise<void> {
        console.log(`Added $${amount} charge for ${target} to tenant ${tenantId}`);
    }

    private async addCredit(tenantId: string, amount: number): Promise<void> {
        console.log(`Added $${amount} credit to tenant ${tenantId}`);
    }

    private async sendNotification(tenantId: string, metadata: any): Promise<void> {
        console.log(`Sent notification to tenant ${tenantId}`, metadata);
    }

    private async changePlan(tenantId: string, newPlan: string): Promise<void> {
        console.log(`Changed plan to ${newPlan} for tenant ${tenantId}`);
    }
}

export const customBillingRulesService = new CustomBillingRulesService();
