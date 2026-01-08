/**
 * Marketing Types
 * Proper types for marketing automation and campaigns
 */

export interface ContentVariationData {
    subject?: string;
    body?: string;
    ctaText?: string;
    ctaUrl?: string;
    imageUrl?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface AutomationCondition {
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value?: string | number | boolean;
    // Allow flexible condition matching
    [key: string]: string | number | boolean | undefined;
}

export interface AutomationActionConfig {
    type?: string;
    delay?: number;
    emailTemplateId?: string;
    smsTemplateId?: string;
    webhookUrl?: string;
    tag?: string;
    template?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface SegmentCriteria {
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value?: string | number | boolean | string[];
    // Allow flexible criteria matching
    ltv_gt?: number;
    ltv_lt?: number;
    engagement_score_gt?: number;
    engagement_score_lt?: number;
    event?: string;
    days?: number;
    articles_read_gte?: number;
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface AudienceCriteria {
    segments?: string[];
    tags?: string[];
    attributes?: Record<string, string | number | boolean>;
    behavior?: {
        lastActivity?: string;
        engagementScore?: number;
        [key: string]: string | number | boolean | undefined;
    };
    [key: string]: string | number | boolean | string[] | Record<string, string | number | boolean> | undefined;
}

export interface CustomAttributes {
    [key: string]: string | number | boolean | undefined;
}

export interface TriggerConditions {
    page?: string;
    attribute?: string;
    behavior?: string;
    time?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface JourneyStepConfig {
    delay?: number;
    emailTemplateId?: string;
    condition?: AutomationCondition;
    [key: string]: string | number | boolean | AutomationCondition | undefined;
}

export interface CanvasData {
    nodes?: Array<{ id: string; type: string; position: { x: number; y: number }; data: Record<string, string | number | boolean> }>;
    edges?: Array<{ id: string; source: string; target: string; [key: string]: string | number | boolean }>;
    [key: string]: string | number | boolean | Array<Record<string, string | number | boolean>> | undefined;
}

export interface ROICampaignData {
    name: string;
    budget: number;
    startDate: string;
    endDate: string;
    channels: string[];
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface LeadData {
    email: string;
    name: string;
    source?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface ScoringRuleData {
    name: string;
    criteria: AutomationCondition[];
    score: number;
    [key: string]: string | number | boolean | AutomationCondition[] | undefined;
}

export interface ContentGenerationContext {
    audience?: string;
    tone?: string;
    length?: number;
    [key: string]: string | number | boolean | undefined;
}
