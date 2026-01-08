import { pocketBaseClient } from '../lib/pocketbase';
import { createTypedCollection } from '../lib/pocketbase-types';
import { auditLog } from './auditLogger';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';
import env from '../config/environment';
import { Result, Ok, Err, Option, Some, None } from '../lib/types';
import { AppError, ValidationError } from './errorHandler';
import { WebhookPayload, WebhookEventData } from '../types/webhook';

export interface Webhook extends RecordModel {
    id: string;
    name: string;
    url: string;
    events: string[];
    status: 'active' | 'paused' | 'failed';
    secret_key: string;
    last_triggered?: string;
    success_rate: number;
    headers?: Record<string, string>;
    retry_count?: number;
    timeout_ms?: number;
    created: string;
    updated: string;
}

export interface CreateWebhookData {
    name: string;
    url: string;
    events: string[];
    status?: 'active' | 'paused' | 'failed';
    secret_key?: string;
    secret?: string;
    headers?: Record<string, string>;
    retry_count?: number;
    timeout_ms?: number;
}

export interface WebhookDelivery extends RecordModel {
    id: string;
    webhook: string;
    event: string;
    payload: WebhookPayload;
    response_code?: number;
    response_body?: string;
    success: boolean;
    duration_ms?: number;
    attempt: number;
    created: string;
}

// Available webhook events
export const WEBHOOK_EVENTS = [
    'user.created',
    'user.updated',
    'user.deleted',
    'tenant.created',
    'tenant.updated',
    'tenant.subscription_changed',
    'payment.completed',
    'payment.failed',
    'enrollment.created',
    'grade.submitted',
    'assignment.submitted',
    'course.created',
    'course.updated'
] as const;

const MOCK_WEBHOOKS: Webhook[] = [
    {
        id: 'webhook-1',
        collectionId: 'mock',
        collectionName: 'webhooks',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        name: 'Slack Notifications',
        url: env.get('slackWebhookUrl') || 'https://hooks.slack.com/services/xxx',
        events: ['user.created', 'payment.completed'],
        status: 'active',
        secret_key: 'whsec_mock123',
        success_rate: 98.5,
        last_triggered: new Date().toISOString(),
        headers: { 'Content-Type': 'application/json' },
        retry_count: 3,
        timeout_ms: 5000
    },
    {
        id: 'webhook-2',
        collectionId: 'mock',
        collectionName: 'webhooks',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        name: 'Analytics Endpoint',
        url: 'https://api.analytics.example.com/events',
        events: ['tenant.created', 'tenant.subscription_changed'],
        status: 'paused',
        secret_key: 'whsec_mock456',
        success_rate: 85.0,
        headers: {},
        retry_count: 2,
        timeout_ms: 10000
    }
];

const MOCK_DELIVERIES: WebhookDelivery[] = [
    {
        id: 'delivery-1',
        collectionId: 'mock',
        collectionName: 'webhook_deliveries',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        webhook: 'webhook-1',
        event: 'user.created',
        payload: { userId: 'user-123', email: 'test@example.com' },
        response_code: 200,
        response_body: '{"success": true}',
        success: true,
        duration_ms: 245,
        attempt: 1
    }
];

class WebhookService {
    private collection = 'webhooks';
    private deliveriesCollection = 'webhook_deliveries';
    private pb = pocketBaseClient.getRawClient();
    private webhookService = createTypedCollection<Webhook>(this.pb, this.collection);
    private deliveryService = createTypedCollection<WebhookDelivery>(this.pb, this.deliveriesCollection);

    /**
     * Generate a secure webhook secret
     */
    private generateSecret(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let secret = 'whsec_';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    /**
     * Get all webhooks
     */
    async getAll(): Promise<Result<Webhook[], AppError>> {
        if (isMockEnv()) {
            return Ok(MOCK_WEBHOOKS);
        }

        try {
            const result = await this.webhookService.getFullList({
                sort: '-created',
                requestKey: null
            });
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to fetch webhooks',
                'WEBHOOKS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Get a single webhook by ID
     */
    async getById(id: string): Promise<Option<Webhook>> {
        if (isMockEnv()) {
            const webhook = MOCK_WEBHOOKS.find(w => w.id === id);
            return webhook ? Some(webhook) : None();
        }

        try {
            const result = await this.webhookService.getOne(id);
            if (result.success) {
                return Some(result.data);
            }
            return None();
        } catch (error) {
            console.error(`Failed to fetch webhook ${id}:`, error);
            return None();
        }
    }

    /**
     * Create a new webhook
     */
    async create(data: CreateWebhookData): Promise<Result<Webhook, AppError>> {
        const secret = data.secret_key || this.generateSecret();

        if (isMockEnv()) {
            const newWebhook: Webhook = {
                id: `webhook-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'webhooks',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                name: data.name,
                url: data.url,
                events: data.events,
                status: data.status || 'active',
                secret_key: secret,
                success_rate: 100,
                headers: data.headers || {},
                retry_count: data.retry_count || 3,
                timeout_ms: data.timeout_ms || 5000
            };
            MOCK_WEBHOOKS.unshift(newWebhook);
            return Ok(newWebhook);
        }

        try {
            const result = await this.webhookService.create({
                ...data,
                secret_key: secret,
                success_rate: 100,
                status: data.status || 'active'
            } as Partial<Webhook>);

            if (result.success) {
                await auditLog.log('webhook.create', {
                    webhook_id: result.data.id,
                    name: data.name,
                    url: data.url,
                    events: data.events
                }, 'info');
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to create webhook',
                'WEBHOOK_CREATE_FAILED',
                500
            ));
        }
    }

    /**
     * Update a webhook
     */
    async update(id: string, data: Partial<CreateWebhookData>): Promise<Result<Webhook, AppError>> {
        if (isMockEnv()) {
            const idx = MOCK_WEBHOOKS.findIndex(w => w.id === id);
            if (idx >= 0) {
                MOCK_WEBHOOKS[idx] = {
                    ...MOCK_WEBHOOKS[idx],
                    ...data,
                    updated: new Date().toISOString()
                };
                return Ok(MOCK_WEBHOOKS[idx]);
            }
            return Err(new AppError('Webhook not found', 'NOT_FOUND', 404));
        }

        try {
            const result = await this.webhookService.update(id, data as Partial<Webhook>);
            if (result.success) {
                await auditLog.log('webhook.update', { webhook_id: id, changes: Object.keys(data) }, 'info');
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to update webhook',
                'WEBHOOK_UPDATE_FAILED',
                500
            ));
        }
    }

    /**
     * Delete a webhook
     */
    async delete(id: string): Promise<Result<boolean, AppError>> {
        if (isMockEnv()) {
            const idx = MOCK_WEBHOOKS.findIndex(w => w.id === id);
            if (idx >= 0) {
                MOCK_WEBHOOKS.splice(idx, 1);
                return Ok(true);
            }
            return Err(new AppError('Webhook not found', 'NOT_FOUND', 404));
        }

        try {
            const result = await this.webhookService.delete(id);
            if (result.success) {
                await auditLog.log('webhook.delete', { webhook_id: id }, 'warning');
                return Ok(true);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to delete webhook',
                'WEBHOOK_DELETE_FAILED',
                500
            ));
        }
    }

    /**
     * Test a webhook by sending a test payload
     */
    async test(id: string): Promise<Result<{ responseCode: number }, AppError>> {
        const webhookOption = await this.getById(id);
        if (!webhookOption.some) {
            return Err(new AppError('Webhook not found', 'NOT_FOUND', 404));
        }
        const webhook = webhookOption.value;

        if (isMockEnv()) {
            await auditLog.log('webhook.test', { webhook_id: id, url: webhook.url }, 'info');
            return Ok({ responseCode: 200 });
        }

        try {
            const testPayload: WebhookPayload = {
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: { message: 'This is a test webhook delivery', type: 'test' }
            };

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret_key,
                    ...webhook.headers
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(webhook.timeout_ms || 5000)
            });

            await auditLog.log('webhook.test', {
                webhook_id: id,
                url: webhook.url,
                status: response.status,
                success: response.ok
            }, 'info');

            if (response.ok) {
                return Ok({ responseCode: response.status });
            }
            return Err(new AppError(
                `Webhook test failed with status ${response.status}`,
                'WEBHOOK_TEST_FAILED',
                response.status
            ));
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Unknown error',
                'WEBHOOK_TEST_FAILED',
                500
            ));
        }
    }

    /**
     * Update webhook status
     */
    async updateStatus(id: string, status: Webhook['status']): Promise<Result<Webhook, AppError>> {
        const result = await this.update(id, { status });
        if (result.success) {
            await auditLog.log('webhook.status_change', { webhook_id: id, status }, 'info');
        }
        return result;
    }

    /**
     * Regenerate webhook secret
     */
    async regenerateSecret(id: string): Promise<Result<string, AppError>> {
        const newSecret = this.generateSecret();

        if (isMockEnv()) {
            const idx = MOCK_WEBHOOKS.findIndex(w => w.id === id);
            if (idx >= 0) {
                MOCK_WEBHOOKS[idx].secret_key = newSecret;
                return Ok(newSecret);
            }
            return Err(new AppError('Webhook not found', 'NOT_FOUND', 404));
        }

        try {
            const result = await this.webhookService.update(id, { secret_key: newSecret } as Partial<Webhook>);
            if (result.success) {
                await auditLog.log('webhook.secret_regenerated', { webhook_id: id }, 'warning');
                return Ok(newSecret);
            }
            return Err(result.error);
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to regenerate secret',
                'SECRET_REGENERATE_FAILED',
                500
            ));
        }
    }

    /**
     * Trigger webhook for an event
     */
    async trigger(event: string, payload: WebhookPayload): Promise<Result<void, AppError>> {
        const webhooksResult = await this.getAll();
        if (!webhooksResult.success) {
            return webhooksResult;
        }

        const activeWebhooks = webhooksResult.data.filter(w =>
            w.status === 'active' && w.events.includes(event)
        );

        for (const webhook of activeWebhooks) {
            this.deliver(webhook, event, payload);
        }

        return Ok(undefined);
    }

    /**
     * Deliver webhook payload with retries
     */
    private async deliver(
        webhook: Webhook,
        event: string,
        payload: WebhookPayload,
        attempt = 1
    ): Promise<void> {
        const startTime = Date.now();
        const maxRetries = webhook.retry_count || 3;

        try {
            const body: WebhookPayload = {
                event,
                timestamp: new Date().toISOString(),
                data: payload.data,
                metadata: payload.metadata
            };

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret_key,
                    'X-Webhook-Event': event,
                    'X-Webhook-Attempt': String(attempt),
                    ...webhook.headers
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(webhook.timeout_ms || 5000)
            });

            const duration = Date.now() - startTime;
            const responseBody = await response.text();

            // Log delivery
            const logResult = await this.logDelivery({
                webhook: webhook.id,
                event,
                payload,
                response_code: response.status,
                response_body: responseBody.slice(0, 1000),
                success: response.ok,
                duration_ms: duration,
                attempt
            });
            if (!logResult.success) {
                console.error('Failed to log delivery:', logResult.error);
            }

            await this.recordTrigger(webhook.id, response.ok);

            // Retry on failure
            if (!response.ok && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                setTimeout(() => this.deliver(webhook, event, payload, attempt + 1), delay);
            }
        } catch (error) {
            const duration = Date.now() - startTime;

            // Log failed delivery
            const logResult = await this.logDelivery({
                webhook: webhook.id,
                event,
                payload,
                success: false,
                duration_ms: duration,
                attempt,
                response_body: error instanceof Error ? error.message : 'Unknown error'
            });
            if (!logResult.success) {
                console.error('Failed to log delivery:', logResult.error);
            }

            await this.recordTrigger(webhook.id, false);

            // Retry on error
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                setTimeout(() => this.deliver(webhook, event, payload, attempt + 1), delay);
            }
        }
    }

    /**
     * Log a webhook delivery
     */
    private async logDelivery(data: Omit<WebhookDelivery, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'>): Promise<Result<void, AppError>> {
        if (isMockEnv()) {
            const delivery: WebhookDelivery = {
                webhook: data.webhook,
                event: data.event,
                payload: data.payload,
                response_code: data.response_code,
                response_body: data.response_body,
                success: data.success,
                duration_ms: data.duration_ms,
                attempt: data.attempt,
                id: `delivery-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'webhook_deliveries',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_DELIVERIES.unshift(delivery);
            return Ok(undefined);
        }

        try {
            const result = await this.deliveryService.create(data as Partial<WebhookDelivery>);
            if (result.success) {
                return Ok(undefined);
            }
            return Err(result.error);
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to log webhook delivery',
                'DELIVERY_LOG_FAILED',
                500
            ));
        }
    }

    /**
     * Record trigger and update success rate
     */
    async recordTrigger(id: string, success: boolean): Promise<void> {
        if (isMockEnv()) {
            const idx = MOCK_WEBHOOKS.findIndex(w => w.id === id);
            if (idx >= 0) {
                const webhook = MOCK_WEBHOOKS[idx];
                const newRate = success
                    ? Math.min(100, webhook.success_rate + 0.1)
                    : Math.max(0, webhook.success_rate - 1);
                MOCK_WEBHOOKS[idx].last_triggered = new Date().toISOString();
                MOCK_WEBHOOKS[idx].success_rate = newRate;
                MOCK_WEBHOOKS[idx].status = newRate < 50 ? 'failed' : webhook.status;
            }
            return;
        }

        try {
            const webhook = await this.getById(id);
            if (!webhook) return;

            const newSuccessRate = success
                ? Math.min(100, webhook.success_rate + 0.1)
                : Math.max(0, webhook.success_rate - 1);

            await pb.collection(this.collection).update(id, {
                last_triggered: new Date().toISOString(),
                success_rate: newSuccessRate,
                status: newSuccessRate < 50 ? 'failed' : webhook.status
            });
        } catch (error) {
            console.error(`Failed to record trigger for webhook ${id}:`, error);
        }
    }

    /**
     * Get delivery history for a webhook
     */
    async getDeliveries(webhookId: string, page = 1, perPage = 20): Promise<{
        items: WebhookDelivery[];
        totalItems: number;
        totalPages: number;
    }> {
        if (isMockEnv()) {
            const filtered = MOCK_DELIVERIES.filter(d => d.webhook === webhookId);
            return {
                items: filtered.slice((page - 1) * perPage, page * perPage),
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        try {
            const result = await pb.collection(this.deliveriesCollection).getList<WebhookDelivery>(
                page,
                perPage,
                {
                    filter: `webhook = "${webhookId}"`,
                    sort: '-created',
                    requestKey: null
                }
            );
            return {
                items: result.items,
                totalItems: result.totalItems,
                totalPages: result.totalPages
            };
        } catch (error) {
            console.error('Failed to fetch deliveries:', error);
            return { items: [], totalItems: 0, totalPages: 0 };
        }
    }

    /**
     * Get webhook analytics
     */
    async getAnalytics(): Promise<{
        total: number;
        active: number;
        paused: number;
        failed: number;
        averageSuccessRate: number;
    }> {
        const webhooks = await this.getAll();
        return {
            total: webhooks.length,
            active: webhooks.filter(w => w.status === 'active').length,
            paused: webhooks.filter(w => w.status === 'paused').length,
            failed: webhooks.filter(w => w.status === 'failed').length,
            averageSuccessRate: webhooks.length > 0
                ? webhooks.reduce((sum, w) => sum + w.success_rate, 0) / webhooks.length
                : 0
        };
    }

    /**
     * Get available webhook events
     */
    getAvailableEvents(): readonly string[] {
        return WEBHOOK_EVENTS;
    }
}

export const webhookService = new WebhookService();
