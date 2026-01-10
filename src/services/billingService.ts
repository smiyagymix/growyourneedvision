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
                total: result.totalItems,
                page: result.page,
                perPage: result.perPage
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
                metadata: { amount: data.amount ?? 0, tenant: data.tenant_id, userId }
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
            const invoices = await pb.collection('invoices').getFullList<Invoice>({
                fields: 'amount,status,created,paid_date'
            });

            const stats: BillingStats = invoices.reduce((acc, inv) => {
                acc.invoice_count++;
                
                // Track Revenue
                if (inv.status === 'paid') {
                    acc.total_revenue += inv.amount;
                    acc.paid_invoices++;
                    
                    // Logic for Average Payment Time (Days)
                    if (inv.paid_date && inv.created) {
                        const days = (new Date(inv.paid_date).getTime() - new Date(inv.created).getTime()) / (1000 * 60 * 60 * 24);
                        acc.average_payment_time = (acc.average_payment_time + days) / 2;
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
            stats.average_payment_time = Math.round(stats.average_payment_time);

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
            return response.url; // Returns Stripe URL
        } catch (error) {
            throw handleServiceError(error, 'STRIPE_INIT');
        }
    },

    // --- Subscription Management ---

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