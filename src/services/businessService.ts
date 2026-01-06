import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface BusinessPlan extends RecordModel {
    name: string;
    price: number;
    billing_cycle: 'Monthly' | 'Yearly';
    features: string[];
    user_limit: number;
    adoption_rate: number;
    is_active: boolean;
}

export interface BusinessRule extends RecordModel {
    name: string;
    trigger: string;
    action: string;
    status: 'Active' | 'Paused' | 'Draft';
    last_run?: string;
    conditions?: Record<string, unknown>;
    priority?: number;
}

export interface CustomerSegment extends RecordModel {
    name: string;
    criteria: Record<string, unknown>;
    count: number;
    growth: string;
    color: string;
    description?: string;
}

export interface BusinessMetrics extends RecordModel {
    date: string;
    revenue: number;
    new_customers: number;
    churn_rate: number;
    mrr: number;
    arr: number;
}

// Mock Data
const MOCK_PLANS: BusinessPlan[] = [
    {
        id: 'plan-1',
        name: 'Starter',
        price: 29,
        billing_cycle: 'Monthly',
        features: ['Up to 5 users', 'Basic analytics', 'Email support', '5GB storage'],
        user_limit: 5,
        adoption_rate: 45,
        is_active: true,
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'plan-2',
        name: 'Professional',
        price: 79,
        billing_cycle: 'Monthly',
        features: ['Up to 25 users', 'Advanced analytics', 'Priority support', '50GB storage', 'API access'],
        user_limit: 25,
        adoption_rate: 35,
        is_active: true,
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'plan-3',
        name: 'Enterprise',
        price: 199,
        billing_cycle: 'Monthly',
        features: ['Unlimited users', 'Custom analytics', '24/7 support', 'Unlimited storage', 'API access', 'SSO', 'Dedicated account manager'],
        user_limit: -1,
        adoption_rate: 20,
        is_active: true,
        collectionId: '', collectionName: '', created: '', updated: ''
    }
];

const MOCK_RULES: BusinessRule[] = [
    {
        id: 'rule-1',
        name: 'Welcome Email',
        trigger: 'user.created',
        action: 'send_welcome_email',
        status: 'Active',
        last_run: new Date().toISOString(),
        priority: 1,
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'rule-2',
        name: 'Trial Expiration Reminder',
        trigger: 'trial.expiring',
        action: 'send_trial_reminder',
        status: 'Active',
        last_run: new Date(Date.now() - 86400000).toISOString(),
        priority: 2,
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'rule-3',
        name: 'Churn Prevention',
        trigger: 'subscription.cancel_requested',
        action: 'send_retention_offer',
        status: 'Paused',
        priority: 3,
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'rule-4',
        name: 'Usage Alert',
        trigger: 'storage.limit_reached',
        action: 'notify_admin',
        status: 'Draft',
        priority: 4,
        collectionId: '', collectionName: '', created: '', updated: ''
    }
];

const MOCK_SEGMENTS: CustomerSegment[] = [
    {
        id: 'seg-1',
        name: 'Enterprise Customers',
        criteria: { plan: 'Enterprise', status: 'active' },
        count: 45,
        growth: '+12%',
        color: '#6366f1',
        description: 'Large organizations with enterprise plan',
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'seg-2',
        name: 'High Engagement',
        criteria: { login_frequency: '>5/week', feature_usage: '>80%' },
        count: 234,
        growth: '+8%',
        color: '#22c55e',
        description: 'Users who log in frequently and use most features',
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'seg-3',
        name: 'At Risk',
        criteria: { login_frequency: '<1/month', subscription_status: 'active' },
        count: 67,
        growth: '-3%',
        color: '#ef4444',
        description: 'Active subscribers with low engagement',
        collectionId: '', collectionName: '', created: '', updated: ''
    },
    {
        id: 'seg-4',
        name: 'Trial Users',
        criteria: { plan: 'trial', days_remaining: '>0' },
        count: 189,
        growth: '+25%',
        color: '#f59e0b',
        description: 'Users currently on free trial',
        collectionId: '', collectionName: '', created: '', updated: ''
    }
];

const MOCK_METRICS: BusinessMetrics[] = [
    { id: 'm-1', date: '2024-02-01', revenue: 125000, new_customers: 45, churn_rate: 2.1, mrr: 125000, arr: 1500000, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'm-2', date: '2024-01-01', revenue: 118000, new_customers: 52, churn_rate: 2.3, mrr: 118000, arr: 1416000, collectionId: '', collectionName: '', created: '', updated: '' },
    { id: 'm-3', date: '2023-12-01', revenue: 112000, new_customers: 38, churn_rate: 2.5, mrr: 112000, arr: 1344000, collectionId: '', collectionName: '', created: '', updated: '' }
];

export const businessService = {
    // Plans
    async getPlans(): Promise<BusinessPlan[]> {
        if (isMockEnv()) {
            return [...MOCK_PLANS];
        }

        try {
            return await pb.collection('business_plans').getFullList<BusinessPlan>({
                sort: 'price',
            });
        } catch (error) {
            console.error('Error fetching plans:', error);
            return [];
        }
    },

    async getPlanById(id: string): Promise<BusinessPlan | null> {
        if (isMockEnv()) {
            return MOCK_PLANS.find(p => p.id === id) || null;
        }

        try {
            return await pb.collection('business_plans').getOne<BusinessPlan>(id);
        } catch (error) {
            console.error('Error fetching plan:', error);
            return null;
        }
    },

    async createPlan(data: Partial<BusinessPlan>): Promise<BusinessPlan | null> {
        if (isMockEnv()) {
            const newPlan: BusinessPlan = {
                id: `plan-${Date.now()}`,
                name: data.name || 'New Plan',
                price: data.price || 0,
                billing_cycle: data.billing_cycle || 'Monthly',
                features: data.features || [],
                user_limit: data.user_limit || 5,
                adoption_rate: 0,
                is_active: true,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_PLANS.push(newPlan);
            return newPlan;
        }

        try {
            return await pb.collection('business_plans').create(data);
        } catch (error) {
            console.error('Error creating plan:', error);
            return null;
        }
    },

    async updatePlan(id: string, data: Partial<BusinessPlan>): Promise<BusinessPlan | null> {
        if (isMockEnv()) {
            const plan = MOCK_PLANS.find(p => p.id === id);
            if (plan) {
                Object.assign(plan, data);
            }
            return plan || null;
        }

        try {
            return await pb.collection('business_plans').update(id, data);
        } catch (error) {
            console.error('Error updating plan:', error);
            return null;
        }
    },

    async deletePlan(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_PLANS.findIndex(p => p.id === id);
            if (index !== -1) {
                MOCK_PLANS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('business_plans').delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting plan:', error);
            return false;
        }
    },

    // Rules
    async getRules(): Promise<BusinessRule[]> {
        if (isMockEnv()) {
            return [...MOCK_RULES];
        }

        try {
            return await pb.collection('business_rules').getFullList<BusinessRule>({
                sort: '-created',
            });
        } catch (error) {
            console.error('Error fetching rules:', error);
            return [];
        }
    },

    async getRuleById(id: string): Promise<BusinessRule | null> {
        if (isMockEnv()) {
            return MOCK_RULES.find(r => r.id === id) || null;
        }

        try {
            return await pb.collection('business_rules').getOne<BusinessRule>(id);
        } catch (error) {
            console.error('Error fetching rule:', error);
            return null;
        }
    },

    async createRule(data: Partial<BusinessRule>): Promise<BusinessRule | null> {
        if (isMockEnv()) {
            const newRule: BusinessRule = {
                id: `rule-${Date.now()}`,
                name: data.name || 'New Rule',
                trigger: data.trigger || '',
                action: data.action || '',
                status: 'Draft',
                priority: MOCK_RULES.length + 1,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_RULES.push(newRule);
            return newRule;
        }

        try {
            return await pb.collection('business_rules').create(data);
        } catch (error) {
            console.error('Error creating rule:', error);
            return null;
        }
    },

    async updateRule(id: string, data: Partial<BusinessRule>): Promise<BusinessRule | null> {
        if (isMockEnv()) {
            const rule = MOCK_RULES.find(r => r.id === id);
            if (rule) {
                Object.assign(rule, data);
            }
            return rule || null;
        }

        try {
            return await pb.collection('business_rules').update(id, data);
        } catch (error) {
            console.error('Error updating rule:', error);
            return null;
        }
    },

    async updateRuleStatus(id: string, status: BusinessRule['status']): Promise<BusinessRule | null> {
        if (isMockEnv()) {
            const rule = MOCK_RULES.find(r => r.id === id);
            if (rule) {
                rule.status = status;
            }
            return rule || null;
        }

        try {
            return await pb.collection('business_rules').update(id, { status });
        } catch (error) {
            console.error('Error updating rule status:', error);
            return null;
        }
    },

    async runRule(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const rule = MOCK_RULES.find(r => r.id === id);
            if (rule) {
                rule.last_run = new Date().toISOString();
            }
            return true;
        }

        try {
            await pb.collection('business_rules').update(id, { last_run: new Date().toISOString() });
            return true;
        } catch (error) {
            console.error('Error running rule:', error);
            return false;
        }
    },

    async deleteRule(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_RULES.findIndex(r => r.id === id);
            if (index !== -1) {
                MOCK_RULES.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('business_rules').delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting rule:', error);
            return false;
        }
    },

    // Segments
    async getSegments(): Promise<CustomerSegment[]> {
        if (isMockEnv()) {
            return [...MOCK_SEGMENTS];
        }

        try {
            return await pb.collection('customer_segments').getFullList<CustomerSegment>({
                sort: '-count',
            });
        } catch (error) {
            console.error('Error fetching segments:', error);
            return [];
        }
    },

    async getSegmentById(id: string): Promise<CustomerSegment | null> {
        if (isMockEnv()) {
            return MOCK_SEGMENTS.find(s => s.id === id) || null;
        }

        try {
            return await pb.collection('customer_segments').getOne<CustomerSegment>(id);
        } catch (error) {
            console.error('Error fetching segment:', error);
            return null;
        }
    },

    async createSegment(data: Partial<CustomerSegment>): Promise<CustomerSegment | null> {
        if (isMockEnv()) {
            const newSegment: CustomerSegment = {
                id: `seg-${Date.now()}`,
                name: data.name || 'New Segment',
                criteria: data.criteria || {},
                count: 0,
                growth: '0%',
                color: data.color || '#6366f1',
                description: data.description,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_SEGMENTS.push(newSegment);
            return newSegment;
        }

        try {
            return await pb.collection('customer_segments').create(data);
        } catch (error) {
            console.error('Error creating segment:', error);
            return null;
        }
    },

    async updateSegment(id: string, data: Partial<CustomerSegment>): Promise<CustomerSegment | null> {
        if (isMockEnv()) {
            const segment = MOCK_SEGMENTS.find(s => s.id === id);
            if (segment) {
                Object.assign(segment, data);
            }
            return segment || null;
        }

        try {
            return await pb.collection('customer_segments').update(id, data);
        } catch (error) {
            console.error('Error updating segment:', error);
            return null;
        }
    },

    async deleteSegment(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_SEGMENTS.findIndex(s => s.id === id);
            if (index !== -1) {
                MOCK_SEGMENTS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('customer_segments').delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting segment:', error);
            return false;
        }
    },

    // Metrics
    async getMetrics(months: number = 3): Promise<BusinessMetrics[]> {
        if (isMockEnv()) {
            return MOCK_METRICS.slice(0, months);
        }

        try {
            return await pb.collection('business_metrics').getFullList<BusinessMetrics>({
                sort: '-date',
                limit: months
            });
        } catch (error) {
            console.error('Error fetching metrics:', error);
            return [];
        }
    },

    async getCurrentMetrics() {
        if (isMockEnv()) {
            const current = MOCK_METRICS[0];
            const previous = MOCK_METRICS[1];
            return {
                revenue: current.revenue,
                revenue_growth: previous ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1) + '%' : '0%',
                mrr: current.mrr,
                arr: current.arr,
                new_customers: current.new_customers,
                churn_rate: current.churn_rate + '%',
                total_customers: MOCK_SEGMENTS.reduce((sum, s) => sum + s.count, 0),
                active_plans: MOCK_PLANS.filter(p => p.is_active).length
            };
        }

        try {
            const [metrics, segments, plans] = await Promise.all([
                pb.collection('business_metrics').getFullList<BusinessMetrics>({ sort: '-date', limit: 2 }),
                pb.collection('customer_segments').getFullList<CustomerSegment>(),
                pb.collection('business_plans').getFullList<BusinessPlan>({ filter: 'is_active = true' })
            ]);

            const current = metrics[0];
            const previous = metrics[1];

            return {
                revenue: current?.revenue || 0,
                revenue_growth: previous && current ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1) + '%' : '0%',
                mrr: current?.mrr || 0,
                arr: current?.arr || 0,
                new_customers: current?.new_customers || 0,
                churn_rate: (current?.churn_rate || 0) + '%',
                total_customers: segments.reduce((sum, s) => sum + s.count, 0),
                active_plans: plans.length
            };
        } catch (error) {
            console.error('Error fetching current metrics:', error);
            return {
                revenue: 0,
                revenue_growth: '0%',
                mrr: 0,
                arr: 0,
                new_customers: 0,
                churn_rate: '0%',
                total_customers: 0,
                active_plans: 0
            };
        }
    },

    // Triggers list for rule builder
    getTriggers(): string[] {
        return [
            'user.created',
            'user.updated',
            'user.deleted',
            'subscription.created',
            'subscription.upgraded',
            'subscription.downgraded',
            'subscription.cancel_requested',
            'subscription.cancelled',
            'trial.started',
            'trial.expiring',
            'trial.expired',
            'payment.succeeded',
            'payment.failed',
            'invoice.created',
            'storage.limit_reached',
            'login.detected',
            'login.suspicious'
        ];
    },

    // Actions list for rule builder
    getActions(): string[] {
        return [
            'send_welcome_email',
            'send_trial_reminder',
            'send_retention_offer',
            'send_upgrade_offer',
            'send_invoice',
            'send_payment_reminder',
            'notify_admin',
            'notify_sales',
            'add_to_segment',
            'remove_from_segment',
            'apply_discount',
            'extend_trial',
            'suspend_account',
            'create_task'
        ];
    }
};
