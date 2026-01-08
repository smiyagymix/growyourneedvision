/**
 * Billing Rules Types
 * Proper types for billing rule evaluation context
 */

import { Tenant } from './index';

export interface UsageMetric {
    name: string;
    value: number;
    unit: string;
    period: string;
    cost?: number;
}

export interface RuleEvaluationContext {
    tenant?: Tenant;
    usage?: UsageMetric[];
    event?: string;
    plan?: string;
    billingCycle?: string;
    [key: string]: string | number | boolean | Tenant | UsageMetric[] | undefined;
}

export interface RuleTestResult {
    triggered: boolean;
    result?: {
        discount?: number;
        charge?: number;
        type?: string;
        target?: string;
        description?: string;
    };
    errors?: string[];
}
