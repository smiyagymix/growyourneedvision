/**
 * Webhook Types
 * Proper types for webhook payloads and configurations
 */

export interface WebhookPayload {
    event: string;
    timestamp: string;
    data: WebhookEventData;
    metadata?: WebhookMetadata;
}

export interface WebhookEventData {
    id: string;
    type: string;
    [key: string]: string | number | boolean | string[] | WebhookEventData | WebhookEventData[];
}

export interface WebhookMetadata {
    source: string;
    version: string;
    tenantId?: string;
    userId?: string;
    requestId?: string;
    ipAddress?: string;
}

export interface WebhookDeliveryAttempt {
    timestamp: string;
    status: 'pending' | 'delivered' | 'failed';
    statusCode?: number;
    responseTime?: number;
    errorMessage?: string;
}
