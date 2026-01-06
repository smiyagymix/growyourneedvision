/**
 * Webhook Configuration Service
 * 
 * Configure and manage webhooks with delivery tracking
 */

import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import * as Sentry from '@sentry/react';

export interface Webhook extends RecordModel {
    name: string;
    url: string;
    events: string[];
    secret: string;
    status: 'active' | 'disabled';
    tenantId: string;
    headers?: Record<string, string>;
    retryPolicy: {
        maxRetries: number;
        retryDelay: number; // seconds
        backoffMultiplier: number;
    };
    timeout: number; // seconds
    lastDeliveryAt?: Date;
    successCount: number;
    failureCount: number;
}

export interface WebhookDelivery extends RecordModel {
    webhookId: string;
    event: string;
    payload: any;
    status: 'pending' | 'success' | 'failed' | 'retrying';
    attempts: number;
    responseCode?: number;
    responseBody?: string;
    errorMessage?: string;
    deliveredAt?: Date;
    nextRetryAt?: Date;
}

export interface DeliveryStatistics {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    successRate: number;
    deliveriesByEvent: { event: string; count: number }[];
    deliveriesByDay: { date: string; success: number; failed: number }[];
    recentFailures: WebhookDelivery[];
}

// Mock data
const MOCK_WEBHOOKS: Webhook[] = [
    {
        id: '1',
        name: 'User Events',
        url: 'https://example.com/webhooks/users',
        events: ['user.created', 'user.updated', 'user.deleted'],
        secret: 'whsec_1234567890',
        status: 'active',
        tenantId: 'tenant1',
        headers: {
            'X-Custom-Header': 'value'
        },
        retryPolicy: {
            maxRetries: 3,
            retryDelay: 60,
            backoffMultiplier: 2
        },
        timeout: 30,
        lastDeliveryAt: new Date(),
        successCount: 1234,
        failureCount: 12,
        created: '2024-01-01',
        updated: '2024-01-15',
        collectionId: 'webhooks',
        collectionName: 'webhooks'
    }
];

class WebhookConfigurationService {
    /**
     * Create webhook
     */
    async createWebhook(
        tenantId: string,
        name: string,
        url: string,
        events: string[],
        options: {
            headers?: Record<string, string>;
            maxRetries?: number;
            retryDelay?: number;
            timeout?: number;
        } = {}
    ): Promise<{ webhook: Webhook; secret: string }> {
        const startTime = Date.now();

        try {
            if (isMockEnv()) {
                return {
                    webhook: MOCK_WEBHOOKS[0],
                    secret: 'whsec_test_' + Math.random().toString(36).substring(7)
                };
            }

            // Generate webhook secret
            const secret = this.generateWebhookSecret();

            // Create webhook
            const webhook = await pb.collection('webhooks').create<Webhook>({
                name,
                url,
                events,
                secret,
                status: 'active',
                tenantId,
                headers: options.headers || {},
                retryPolicy: {
                    maxRetries: options.maxRetries || 3,
                    retryDelay: options.retryDelay || 60,
                    backoffMultiplier: 2
                },
                timeout: options.timeout || 30,
                successCount: 0,
                failureCount: 0
            });

            Sentry.addBreadcrumb({
                category: 'webhook',
                message: 'Webhook created',
                level: 'info',
                data: { webhookId: webhook.id, duration: Date.now() - startTime }
            });

            return {
                webhook,
                secret // Only returned on creation
            };
        } catch (error) {
            Sentry.captureException(error, {
                tags: { operation: 'webhook.create' }
            });
            console.error('Failed to create webhook:', error);
            throw error;
        }
    }

    /**
     * Get webhooks
     */
    async getWebhooks(
        tenantId?: string,
        page: number = 1,
        perPage: number = 20
    ): Promise<{ items: Webhook[]; totalPages: number }> {
        try {
            if (isMockEnv()) {
                return { items: MOCK_WEBHOOKS, totalPages: 1 };
            }

            const filter = tenantId ? `tenantId = "${tenantId}"` : '';

            const result = await pb.collection('webhooks').getList<Webhook>(
                page,
                perPage,
                {
                    filter,
                    sort: '-created',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get webhooks:', error);
            throw error;
        }
    }

    /**
     * Update webhook
     */
    async updateWebhook(
        webhookId: string,
        updates: Partial<Webhook>
    ): Promise<Webhook> {
        try {
            if (isMockEnv()) {
                return { ...MOCK_WEBHOOKS[0], ...updates };
            }

            return await pb.collection('webhooks').update(webhookId, updates);
        } catch (error) {
            console.error('Failed to update webhook:', error);
            throw error;
        }
    }

    /**
     * Delete webhook
     */
    async deleteWebhook(webhookId: string): Promise<void> {
        try {
            if (isMockEnv()) {
                return;
            }

            await pb.collection('webhooks').delete(webhookId);
        } catch (error) {
            console.error('Failed to delete webhook:', error);
            throw error;
        }
    }

    /**
     * Test webhook
     */
    async testWebhook(webhookId: string): Promise<{
        success: boolean;
        statusCode?: number;
        responseTime: number;
        error?: string;
    }> {
        const testStartTime = Date.now();

        try {
            if (isMockEnv()) {
                return {
                    success: true,
                    statusCode: 200,
                    responseTime: 145
                };
            }

            const webhook = await pb.collection('webhooks').getOne<Webhook>(webhookId);

            // Create test payload
            const testPayload = {
                event: 'webhook.test',
                timestamp: new Date().toISOString(),
                data: {
                    message: 'This is a test webhook delivery'
                }
            };

            // Send webhook
            const startTime = Date.now();
            const result = await this.sendWebhook(webhook, testPayload);
            const responseTime = Date.now() - startTime;

            Sentry.addBreadcrumb({
                category: 'webhook',
                message: 'Webhook tested',
                level: result.success ? 'info' : 'warning',
                data: {
                    webhookId,
                    statusCode: result.statusCode,
                    responseTime,
                    duration: Date.now() - testStartTime
                }
            });

            return {
                success: result.success,
                statusCode: result.statusCode,
                responseTime,
                error: result.error
            };
        } catch (error) {
            Sentry.captureException(error, {
                tags: { operation: 'webhook.test', webhookId }
            });
            console.error('Failed to test webhook:', error);
            throw error;
        }
    }

    /**
     * Send webhook delivery
     */
    private async sendWebhook(
        webhook: Webhook,
        payload: any
    ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
        try {
            // Generate signature
            const signature = await this.generateSignature(webhook.secret, payload);

            // Prepare headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-ID': webhook.id,
                ...webhook.headers
            };

            // Send request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000);

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            return {
                success: response.ok,
                statusCode: response.status
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get delivery history
     */
    async getDeliveryHistory(
        webhookId: string,
        page: number = 1,
        perPage: number = 50
    ): Promise<{ items: WebhookDelivery[]; totalPages: number }> {
        try {
            if (isMockEnv()) {
                return {
                    items: [{
                        id: '1',
                        webhookId,
                        event: 'user.created',
                        payload: { userId: '123' },
                        status: 'success',
                        attempts: 1,
                        responseCode: 200,
                        deliveredAt: new Date(),
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        collectionId: 'webhook_deliveries',
                        collectionName: 'webhook_deliveries'
                    }],
                    totalPages: 1
                };
            }

            const result = await pb.collection('webhook_deliveries').getList<WebhookDelivery>(
                page,
                perPage,
                {
                    filter: `webhookId = "${webhookId}"`,
                    sort: '-created',
                    requestKey: null
                }
            );

            return result;
        } catch (error) {
            console.error('Failed to get delivery history:', error);
            throw error;
        }
    }

    /**
     * Get delivery statistics
     */
    async getDeliveryStatistics(
        webhookId: string,
        days: number = 30
    ): Promise<DeliveryStatistics> {
        try {
            if (isMockEnv()) {
                return {
                    totalDeliveries: 1234,
                    successfulDeliveries: 1210,
                    failedDeliveries: 24,
                    averageResponseTime: 145,
                    successRate: 98.05,
                    deliveriesByEvent: [
                        { event: 'user.created', count: 500 },
                        { event: 'user.updated', count: 600 },
                        { event: 'user.deleted', count: 134 }
                    ],
                    deliveriesByDay: Array.from({ length: 7 }, (_, i) => ({
                        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        success: Math.floor(Math.random() * 100) + 50,
                        failed: Math.floor(Math.random() * 10)
                    })),
                    recentFailures: []
                };
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const deliveries = await pb.collection('webhook_deliveries').getFullList<WebhookDelivery>({
                filter: `webhookId = "${webhookId}" && created >= "${startDate.toISOString()}"`,
                requestKey: null
            });

            const totalDeliveries = deliveries.length;
            const successfulDeliveries = deliveries.filter(d => d.status === 'success').length;
            const failedDeliveries = deliveries.filter(d => d.status === 'failed').length;
            const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

            // Calculate average response time (mock for now)
            const averageResponseTime = 145;

            // Deliveries by event
            const eventCounts = new Map<string, number>();
            deliveries.forEach(d => {
                eventCounts.set(d.event, (eventCounts.get(d.event) || 0) + 1);
            });
            const deliveriesByEvent = Array.from(eventCounts.entries())
                .map(([event, count]) => ({ event, count }))
                .sort((a, b) => b.count - a.count);

            // Deliveries by day
            const dayCounts = new Map<string, { success: number; failed: number }>();
            deliveries.forEach(d => {
                const day = new Date(d.created).toISOString().split('T')[0];
                const current = dayCounts.get(day) || { success: 0, failed: 0 };
                if (d.status === 'success') {
                    current.success++;
                } else if (d.status === 'failed') {
                    current.failed++;
                }
                dayCounts.set(day, current);
            });
            const deliveriesByDay = Array.from(dayCounts.entries())
                .map(([date, counts]) => ({ date, ...counts }))
                .sort((a, b) => a.date.localeCompare(b.date));

            // Recent failures
            const recentFailures = deliveries
                .filter(d => d.status === 'failed')
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                .slice(0, 10);

            return {
                totalDeliveries,
                successfulDeliveries,
                failedDeliveries,
                averageResponseTime,
                successRate,
                deliveriesByEvent,
                deliveriesByDay,
                recentFailures
            };
        } catch (error) {
            console.error('Failed to get delivery statistics:', error);
            throw error;
        }
    }

    /**
     * Retry failed delivery
     */
    async retryDelivery(deliveryId: string): Promise<WebhookDelivery> {
        try {
            if (isMockEnv()) {
                return {
                    id: deliveryId,
                    webhookId: '1',
                    event: 'user.created',
                    payload: {},
                    status: 'success',
                    attempts: 2,
                    responseCode: 200,
                    deliveredAt: new Date(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    collectionId: 'webhook_deliveries',
                    collectionName: 'webhook_deliveries'
                };
            }

            const delivery = await pb.collection('webhook_deliveries').getOne<WebhookDelivery>(deliveryId);
            const webhook = await pb.collection('webhooks').getOne<Webhook>(delivery.webhookId);

            // Send webhook
            const result = await this.sendWebhook(webhook, delivery.payload);

            // Update delivery
            const updatedDelivery = await pb.collection('webhook_deliveries').update<WebhookDelivery>(deliveryId, {
                status: result.success ? 'success' : 'failed',
                attempts: delivery.attempts + 1,
                responseCode: result.statusCode,
                errorMessage: result.error,
                deliveredAt: result.success ? new Date() : undefined
            });

            return updatedDelivery;
        } catch (error) {
            console.error('Failed to retry delivery:', error);
            throw error;
        }
    }

    /**
     * Get available events
     */
    getAvailableEvents(): string[] {
        return [
            'user.created',
            'user.updated',
            'user.deleted',
            'course.created',
            'course.updated',
            'course.deleted',
            'assignment.created',
            'assignment.submitted',
            'grade.updated',
            'payment.succeeded',
            'payment.failed',
            'tenant.created',
            'tenant.updated',
            'subscription.created',
            'subscription.cancelled'
        ];
    }

    /**
     * Generate webhook secret
     */
    private generateWebhookSecret(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'whsec_';
        const randomValues = new Uint8Array(32);
        crypto.getRandomValues(randomValues);

        for (let i = 0; i < 32; i++) {
            result += chars[randomValues[i] % chars.length];
        }

        return result;
    }

    /**
     * Generate webhook signature
     */
    private async generateSignature(secret: string, payload: any): Promise<string> {
        const message = JSON.stringify(payload);
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

export const webhookConfigurationService = new WebhookConfigurationService();
