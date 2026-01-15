import pb from '../lib/pocketbase';
import { Tenant } from './tenantService';
import { auditLogger } from './auditLogger';
import { retry } from '../hooks/useRetry';
import { AppError } from '../types/common';
import { ClientResponseError } from 'pocketbase';
import {
    Invoice,
    PaymentGateway,
    BillingStats,
    validateInvoice,
    validatePaymentGateway,
} from '../validation/billingSchemas';

// --- Production Types & Interfaces ---

/**
 * Deep Expansion for UI consistency
 * Allows accessing `invoice.expand.tenant_id.name` directly
 */
export interface ExpandedInvoice extends Invoice {
    expand?: {
        tenant_id: Tenant;
    };
}

export interface Subscription {
    id: string;
    tenant: string;
    stripe_subscription_id: string;
    plan: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'trialing' | 'canceled' | 'past_due';
    interval: 'month' | 'year';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created: string;
}

export interface BillingServiceResponse<T> {
    items: T[];
    total: number;
    page: number;
    perPage: number;
}

// --- Internal Helper: Stats Caching ---
// Prevents heavy re-calculation on every page transition (5 minute TTL)
let cachedStats: BillingStats | null = null;
let lastStatsFetch = 0;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Enhanced Error Mapping for Production
 */
const handleServiceError = (error: unknown, context: string): AppError => {
    if (error instanceof ClientResponseError) {
        return {
            message: error.response.message || `Billing action "${context}" failed.`,
            code: `BILL_DB_${error.status}`,
            status: error.status,
            timestamp: new Date(),
            details: error.response.data
        };
    }
    return {
        message: error instanceof Error ? error.message : 'An unexpected billing error occurred',
        code: `BILL_${context.toUpperCase()}_ERR`,
        status: 500,
        timestamp: new Date()
    };
};

export const billingService = {

    // --- Invoice Management ---

    /**
     * Advanced Invoice Fetching
     * Supports: Search, Filtering by Status, Tenant ID, and Pagination
     */
    getInvoices: async (params: {
        page?: number;
        perPage?: number;
        tenantId?: string;
        status?: Invoice['status'];
        search?: string;
    }): Promise<BillingServiceResponse<ExpandedInvoice>> => {
        try {
            const { page = 1, perPage = 50, tenantId, status, search } = params;

            const filters: string[] = [];
            if (tenantId) filters.push(`tenant_id = "${tenantId}"`);
            if (status) filters.push(`status = "${status}"`);
            if (search) filters.push(`(id ~ "${search}" || period ~ "${search}")`);

            const result = await retry(() =>
                pb.collection('invoices').getList<ExpandedInvoice>(page, perPage, {
                    filter: filters.join(' && '),
                    sort: '-created',
                    expand: 'tenant_id', // JOIN Tenant data
                    fields: '*,expand.tenant_id.name,expand.tenant_id.email' // Payload optimization
                })
            );

            return {
                items: result.items,
                total: result.totalItems || 0,
                page: result.page || 1,
                perPage: result.perPage || 50
            };
        } catch (error) {
            throw handleServiceError(error, 'FETCH_INVOICES');
        }
    },

    /**
     * Create Invoice with Atomic Validation
     */
    createInvoice: async (data: Partial<Invoice>, userId: string): Promise<Invoice> => {
        try {
            const validation = validateInvoice(data);
            if (!validation.success) {
                const errorMsg = Object.entries(validation.errors)
                    .map(([k, v]) => `${k}: ${v}`).join(', ');
                throw new Error(`Invalid Data: ${errorMsg}`);
            }

            const record = await pb.collection('invoices').create<Invoice>(data);

            // Trigger audit log asynchronously
            auditLogger.log({
                action: 'billing.invoice_created',
                resource_type: 'invoice',
                resource_id: record.id,
                severity: 'info',
                metadata: { amount: data.amount ?? 0, tenant: data.tenant_id ?? '', userId }
            }).catch(() => null);

            cachedStats = null; // Invalidate cache
            return record;
        } catch (error) {
            throw handleServiceError(error, 'CREATE_INVOICE');
        }
    },

    /**
     * Bulk update invoice status (e.g., Mark 5 invoices as paid)
     */
    bulkUpdateStatus: async (ids: string[], status: Invoice['status'], userId: string): Promise<void> => {
        try {
            // PocketBase doesn't have native bulk update yet, so we use Promise.all
            await Promise.all(ids.map(id =>
                pb.collection('invoices').update(id, { status })
            ));

            auditLogger.log({
                action: 'billing.bulk_update',
                resource_type: 'invoice',
                severity: 'warning',
                metadata: { count: ids.length, status, userId }
            }).catch(() => null);

            cachedStats = null;
        } catch (error) {
            throw handleServiceError(error, 'BULK_UPDATE');
        }
    },

    // --- Financial Analytics ---

    /**
     * Get Deep Billing Stats
     * Performance: Uses Cache + Optimized Field Selection
     */
    getBillingStats: async (forceRefresh = false): Promise<BillingStats> => {
        const now = Date.now();
        if (!forceRefresh && cachedStats && (now - lastStatsFetch < CACHE_TTL)) {
            return cachedStats;
        }

        try {
            const result = await pb.collection('invoices').getFullList<Invoice>();
            const invoices: Invoice[] = result.map((item: Invoice) => ({
                ...item,
                paid_date: item.paid_date || null,
                created: item.created || ''
            }));

            const stats: BillingStats = invoices.reduce((acc, inv) => {
                acc.invoice_count++;

                // Track Revenue
                if (inv.status === 'paid') {
                    acc.total_revenue += inv.amount;
                    acc.paid_invoices++;

                    // Logic for Average Payment Time (Days)
                    if (inv.paid_date && inv.created) {
                        const days = (new Date(inv.paid_date).getTime() - new Date(inv.created).getTime()) / (1000 * 60 * 60 * 24);
                        acc.average_payment_time = acc.average_payment_time ? (acc.average_payment_time + days) / 2 : days;
                    }
                }
                else if (inv.status === 'pending') {
                    acc.pending_amount += inv.amount;
                    acc.pending_invoices++;
                }
                else if (inv.status === 'overdue') {
                    acc.overdue_count++;
                    acc.overdue_invoices++;
                }

                return acc;
            }, {
                total_revenue: 0,
                pending_amount: 0,
                overdue_count: 0,
                invoice_count: 0,
                paid_invoices: 0,
                pending_invoices: 0,
                overdue_invoices: 0,
                average_payment_time: 0,
                mrr: 0,
                arr: 0
            });

            // Financial Metrics
            stats.mrr = stats.total_revenue / 12; // Simplified logic
            stats.arr = stats.mrr * 12;
            stats.average_payment_time = stats.average_payment_time ? Math.round(stats.average_payment_time) : 0;

            cachedStats = stats;
            lastStatsFetch = now;
            return stats;
        } catch (error) {
            throw handleServiceError(error, 'GET_STATS');
        }
    },

    // --- Payment Gateways & Stripe ---

    /**
     * Get Gateways with Health Check
     */
    getPaymentGateways: async (): Promise<PaymentGateway[]> => {
        try {
            const gateways = await pb.collection('payment_gateways').getFullList<PaymentGateway>({
                sort: '-enabled',
            });

            return gateways.filter(g => validatePaymentGateway(g).success);
        } catch (error) {
            throw handleServiceError(error, 'FETCH_GATEWAYS');
        }
    },

    /**
     * Create Stripe Checkout Session
     * Connects UI to backend Stripe Logic
     */
    createCheckout: async (tenantId: string, planId: string): Promise<string> => {
        try {
            // Production: Call your PB custom endpoint or Edge Function
            const response = await pb.send('/api/stripe/checkout', {
                method: 'POST',
                body: { tenantId, planId, success_url: window.location.origin + '/billing/success' }
            });
            // Normalize response
            if (response && typeof response === 'object' && 'url' in response) {
                // @ts-expect-error runtime check
                const url = (response as any).url;
                if (typeof url === 'string' && url.length) return url;
            }
            throw new Error('Unexpected stripe checkout response');
        } catch (error) {
            throw handleServiceError(error, 'STRIPE_INIT');
        }
    },

    // --- Payment Gateway Management ---

    /**
     * Toggle payment gateway enabled/disabled status
     */
        toggleGateway: async (gatewayId: string): Promise<PaymentGateway> => {
                try {
                        const { paymentGatewayService } = await import('./paymentGatewayService');
                        return await paymentGatewayService.toggleGateway(gatewayId);
                } catch (error) {
                        throw handleServiceError(error, 'TOGGLE_GATEWAY');
                }
        },

    // --- Subscription Management ---

    // --- Invoice helpers (additional integrations) ---

    /**
     * Fetch a single invoice by id with expanded tenant
     */
    getInvoiceById: async (id: string): Promise<ExpandedInvoice> => {
        try {
            const record = await pb.collection('invoices').getOne<ExpandedInvoice>(id, {
                expand: 'tenant_id',
            });
            return record;
        } catch (error) {
            throw handleServiceError(error, 'GET_INVOICE');
        }
    },

    // --- Subscription Management / Gateway Reconciliation ---

    /**
     * Create a subscription for a tenant via backend service (e.g., Stripe)
     */
    createSubscription: async (tenantId: string, planId: string): Promise<{ subscriptionId: string; checkoutUrl?: string }> => {
        try {
            const resp = await pb.send('/api/subscriptions/create', {
                method: 'POST',
                body: { tenantId, planId }
            });
            if (resp && typeof resp === 'object' && 'subscriptionId' in resp) {
                return { subscriptionId: (resp as any).subscriptionId, checkoutUrl: (resp as any).checkoutUrl };
            }
            throw new Error('Invalid subscription creation response');
        } catch (error) {
            throw handleServiceError(error, 'CREATE_SUBSCRIPTION');
        }
    },

    /**
     * Cancel a subscription via backend service and update PB record
     */
    cancelSubscription: async (subscriptionId: string, cancelAtPeriodEnd = false): Promise<void> => {
        try {
            const resp = await pb.send('/api/subscriptions/cancel', {
                method: 'POST',
                body: { subscriptionId, cancelAtPeriodEnd }
            });
            // Update PB record if backend returns updated subscription data
            if (resp && typeof resp === 'object' && (resp as any).id) {
                const id = (resp as any).id as string;
                await pb.collection('subscriptions').update(id, { status: (resp as any).status });
            }
        } catch (error) {
            throw handleServiceError(error, 'CANCEL_SUBSCRIPTION');
        }
    },

    /**
     * Reconcile invoices with payment gateway status by calling backend reconciliation job
     */
    reconcileWithGateway: async (gatewayId?: string): Promise<{ reconciled: number; errors: number }> => {
        try {
            const resp = await pb.send('/api/payments/reconcile', {
                method: 'POST',
                body: { gatewayId }
            });
            if (resp && typeof resp === 'object') return { reconciled: (resp as any).reconciled || 0, errors: (resp as any).errors || 0 };
            return { reconciled: 0, errors: 1 };
        } catch (error) {
            throw handleServiceError(error, 'RECONCILE_GATEWAY');
        }
    },

    /**
     * Verify health of configured gateways by checking known health endpoints or last_seen
     */
    verifyGatewayHealth: async (gatewayId?: string): Promise<Array<{ id: string; ok: boolean; details?: string }>> => {
        try {
            const filter = gatewayId ? `id = "${gatewayId}"` : '';
            const gateways = await pb.collection('payment_gateways').getFullList<PaymentGateway>({ filter });
            const results: Array<{ id: string; ok: boolean; details?: string }> = [];
            await Promise.all(gateways.map(async (g) => {
                try {
                    // If gateway has a test_url configured, ping it via backend to avoid CORS/secret exposure
                    if ((g as any).test_url) {
                        const r = await pb.send('/api/gateway/ping', { method: 'POST', body: { url: (g as any).test_url } });
                        results.push({ id: g.id, ok: r?.ok === true, details: r?.message });
                    } else {
                        // Use enabled flag and last_checked if present
                        results.push({ id: g.id, ok: !!g.enabled, details: g.name });
                    }
                } catch (err) {
                    results.push({ id: g.id, ok: false, details: String(err) });
                }
            }));
            return results;
        } catch (error) {
            throw handleServiceError(error, 'VERIFY_GATEWAY_HEALTH');
        }
    },

    /**
     * Update invoice after validating payload
     */
    updateInvoice: async (id: string, data: Partial<Invoice>, userId: string): Promise<Invoice> => {
        try {
            const validation = validateInvoice({ ...data, id } as Partial<Invoice>);
            if (!validation.success) {
                const errorMsg = Object.entries(validation.errors)
                    .map(([k, v]) => `${k}: ${v}`).join(', ');
                throw new Error(`Invalid Data: ${errorMsg}`);
            }

            const updated = await pb.collection('invoices').update<Invoice>(id, data);

            auditLogger.log({
                action: 'billing.invoice_updated',
                resource_type: 'invoice',
                resource_id: id,
                severity: 'info',
                metadata: { userId, changes: Object.keys(data) }
            }).catch(() => null);

            cachedStats = null;
            return updated;
        } catch (error) {
            throw handleServiceError(error, 'UPDATE_INVOICE');
        }
    },

    /**
     * Delete invoice by id (soft or hard depending on PB rules)
     */
    deleteInvoice: async (id: string, userId: string): Promise<void> => {
        try {
            await pb.collection('invoices').delete(id);
            auditLogger.log({
                action: 'billing.invoice_deleted',
                resource_type: 'invoice',
                resource_id: id,
                severity: 'warning',
                metadata: { userId }
            }).catch(() => null);

            cachedStats = null;
        } catch (error) {
            throw handleServiceError(error, 'DELETE_INVOICE');
        }
    },

    /**
     * Retry a failed payment for an invoice via backend payment endpoint
     */
    retryPayment: async (invoiceId: string): Promise<{ status: 'queued' | 'failed' | 'success'; message?: string }> => {
        try {
            const resp = await pb.send('/api/payments/retry', {
                method: 'POST',
                body: { invoiceId }
            });
            return { status: resp?.status ?? 'queued', message: resp?.message };
        } catch (error) {
            throw handleServiceError(error, 'RETRY_PAYMENT');
        }
    },

    /**
     * Apply a credit to a tenant (records a credit transaction)
     */
    applyCredit: async (tenantId: string, amount: number, reason: string, userId: string): Promise<void> => {
        try {
            await pb.collection('credits').create({ tenant_id: tenantId, amount, reason, created_by: userId });
            auditLogger.log({
                action: 'billing.credit_applied',
                resource_type: 'credit',
                severity: 'info',
                metadata: { tenantId, amount, reason, userId }
            }).catch(() => null);

            cachedStats = null;
        } catch (error) {
            throw handleServiceError(error, 'APPLY_CREDIT');
        }
    },

    /**
     * Ask backend to produce a CSV export and return a download URL
     */
    exportInvoicesCSV: async (filter?: { tenantId?: string; status?: Invoice['status'] }): Promise<string> => {
        try {
            const response = await pb.send('/api/billing/export', {
                method: 'POST',
                body: { filter }
            });
            // Expecting { url: string }
            return response?.url || '';
        } catch (error) {
            throw handleServiceError(error, 'EXPORT_INVOICES');
        }
    },

    getSubscriptions: async (tenantId?: string): Promise<Subscription[]> => {
        try {
            return await pb.collection('subscriptions').getFullList<Subscription>({
                filter: tenantId ? `tenant = "${tenantId}"` : '',
                sort: '-created'
            });
        } catch (error) {
            throw handleServiceError(error, 'FETCH_SUBS');
        }
    }
};

export default billingService;
