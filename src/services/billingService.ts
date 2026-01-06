import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { Tenant } from './tenantService';
import { auditLogger } from './auditLogger';
import { retry } from '../hooks/useRetry';

export interface Invoice {
    id: string;
    tenant: string;
    stripe_invoice_id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed' | 'cancelled' | 'overdue';
    pdf_url?: string;
    period_start: string;
    period_end: string;
    paid_at?: string;
    created: string;
    expand?: {
        tenant?: Tenant;
    };
}

export interface Subscription {
    id: string;
    tenant: string;
    stripe_subscription_id: string;
    plan: string;
    status: 'active' | 'trialing' | 'canceled' | 'past_due';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created: string;
}

export interface BillingStats {
    mrr: number;
    arr: number;
    churn_rate: number;
    ltv: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    failed_payments: number;
}

export interface RevenueMonth {
    month: string;
    revenue: number;
}

const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv-1',
        tenant: 'tenant-1',
        stripe_invoice_id: 'in_test_123',
        amount: 29900, // $299.00
        currency: 'usd',
        status: 'paid',
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        created: new Date().toISOString()
    },
    {
        id: 'inv-2',
        tenant: 'tenant-2',
        stripe_invoice_id: 'in_test_124',
        amount: 9900, // $99.00
        currency: 'usd',
        status: 'paid',
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
        paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
    {
        id: 'sub-1',
        tenant: 'tenant-1',
        stripe_subscription_id: 'sub_test_123',
        plan: 'pro',
        status: 'active',
        current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_BILLING_STATS: BillingStats = {
    mrr: 398,
    arr: 4776,
    churn_rate: 2.5,
    ltv: 1592,
    active_subscriptions: 2,
    trial_subscriptions: 1,
    failed_payments: 1
};

export const billingService = {
    // Invoice management
    getInvoices: async (tenantId?: string) => {
        if (isMockEnv()) {
            const filtered = tenantId
                ? MOCK_INVOICES.filter((inv: Invoice) => inv.tenant === tenantId)
                : MOCK_INVOICES;
            return {
                page: 1,
                perPage: 100,
                totalItems: filtered.length,
                totalPages: 1,
                items: filtered
            };
        }

        const filter = tenantId ? `tenant = "${tenantId}"` : '';
        return await retry(() => pb.collection('invoices').getList<Invoice>(1, 100, {
            filter,
            sort: '-created',
            expand: 'tenant'
        }));
    },

    getInvoice: async (id: string): Promise<Invoice | null> => {
        if (isMockEnv()) {
            return MOCK_INVOICES.find(inv => inv.id === id) || null;
        }

        try {
            return await retry(() => pb.collection('invoices').getOne<Invoice>(id, {
                expand: 'tenant'
            }));
        } catch {
            return null;
        }
    },

    createInvoice: async (data: Omit<Invoice, 'id' | 'created'>, userId?: string): Promise<Invoice> => {
        if (isMockEnv()) {
            const newInvoice: Invoice = {
                ...data,
                id: `inv-${Date.now()}`,
                created: new Date().toISOString()
            };
            MOCK_INVOICES.push(newInvoice);
            return newInvoice;
        }

        const invoice = await retry(() => pb.collection('invoices').create<Invoice>(data));

        // Audit log
        await auditLogger.log({
            action: 'billing.invoice_created',
            resource_type: 'invoice',
            resource_id: invoice.id,
            severity: 'info',
            metadata: {
                tenant_id: data.tenant,
                amount: data.amount,
                currency: data.currency,
                created_by: userId || 'system'
            }
        });

        return invoice;
    },

    updateInvoice: async (id: string, data: Partial<Invoice>, userId?: string): Promise<Invoice | null> => {
        if (isMockEnv()) {
            const invoice = MOCK_INVOICES.find(inv => inv.id === id);
            if (invoice) {
                Object.assign(invoice, data);
            }
            return invoice || null;
        }

        const invoice = await retry(() => pb.collection('invoices').update<Invoice>(id, data));

        // Audit log if status changes
        if (data.status) {
            await auditLogger.log({
                action: 'billing.invoice_status_updated',
                resource_type: 'invoice',
                resource_id: id,
                severity: data.status === 'failed' ? 'warning' : 'info',
                metadata: {
                    new_status: data.status,
                    updated_by: userId || 'system'
                }
            });
        }

        return invoice;
    },

    markInvoicePaid: async (id: string, userId?: string): Promise<Invoice | null> => {
        return billingService.updateInvoice(id, {
            status: 'paid',
            paid_at: new Date().toISOString()
        }, userId);
    },

    // Subscription management
    getSubscriptions: async (tenantId?: string): Promise<Subscription[]> => {
        if (isMockEnv()) {
            return tenantId
                ? MOCK_SUBSCRIPTIONS.filter((s: Subscription) => s.tenant === tenantId)
                : MOCK_SUBSCRIPTIONS;
        }

        const filter = tenantId ? `tenant = "${tenantId}"` : '';
        return await retry(() => pb.collection('subscriptions').getFullList<Subscription>({
            filter,
            sort: '-created'
        }));
    },

    getSubscription: async (id: string): Promise<Subscription | null> => {
        if (isMockEnv()) {
            return MOCK_SUBSCRIPTIONS.find((s: Subscription) => s.id === id) || null;
        }

        try {
            return await retry(() => pb.collection('subscriptions').getOne<Subscription>(id));
        } catch {
            return null;
        }
    },

    getTenantSubscription: async (tenantId: string): Promise<Subscription | null> => {
        if (isMockEnv()) {
            return MOCK_SUBSCRIPTIONS.find((s: Subscription) => s.tenant === tenantId) || null;
        }

        try {
            return await retry(() => pb.collection('subscriptions').getFirstListItem<Subscription>(
                `tenant = "${tenantId}"`
            ));
        } catch {
            return null;
        }
    },

    // Billing statistics
    getBillingStats: async (): Promise<BillingStats> => {
        if (isMockEnv()) {
            return MOCK_BILLING_STATS;
        }

        try {
            const activeTenants = await retry(() => pb.collection('tenants').getFullList<Tenant>({
                filter: 'subscription_status = "active"'
            }));

            const monthlyPrices: Record<string, number> = {
                free: 0,
                basic: 99,
                pro: 299,
                enterprise: 999
            };

            const mrr = activeTenants.reduce((total, tenant) => {
                return total + (monthlyPrices[tenant.plan] || 0);
            }, 0);

            const arr = mrr * 12;

            const trialTenants = await pb.collection('tenants').getList(1, 1, {
                filter: 'subscription_status = "trialing"'
            });

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const failedPayments = await pb.collection('invoices').getList(1, 1, {
                filter: `status = "failed" && created >= "${thirtyDaysAgo.toISOString()}"`
            });

            const totalTenants = await pb.collection('tenants').getList(1, 1);
            const cancelledTenants = await pb.collection('tenants').getList(1, 1, {
                filter: 'status = "cancelled"'
            });
            const churn_rate = totalTenants.totalItems > 0
                ? (cancelledTenants.totalItems / totalTenants.totalItems) * 100
                : 0;

            const avgRevenuePerCustomer = activeTenants.length > 0 ? mrr / activeTenants.length : 0;
            const ltv = churn_rate > 0 ? (avgRevenuePerCustomer / (churn_rate / 100)) : avgRevenuePerCustomer * 36;

            return {
                mrr,
                arr,
                churn_rate,
                ltv,
                active_subscriptions: activeTenants.length,
                trial_subscriptions: trialTenants.totalItems,
                failed_payments: failedPayments.totalItems
            };
        } catch (error) {
            console.error('Failed to get billing stats:', error);
            return MOCK_BILLING_STATS;
        }
    },

    // Revenue over time
    getRevenueHistory: async (): Promise<RevenueMonth[]> => {
        if (isMockEnv()) {
            const months: RevenueMonth[] = [];
            const now = new Date();
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    revenue: Math.floor(Math.random() * 5000) + 2000
                });
            }
            return months;
        }

        const months: RevenueMonth[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = date.toISOString();
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

            const invoices = await retry(() => pb.collection('invoices').getList<Invoice>(1, 1000, {
                filter: `status = "paid" && paid_at >= "${monthStart}" && paid_at <= "${monthEnd}"`
            }));

            const revenue = invoices.items.reduce((sum, inv) => sum + inv.amount, 0);

            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue
            });
        }

        return months;
    },

    // Invoice status counts
    getInvoiceStatusCounts: async (): Promise<Record<Invoice['status'], number>> => {
        if (isMockEnv()) {
            const counts: Record<string, number> = { paid: 0, pending: 0, failed: 0, cancelled: 0, overdue: 0 };
            MOCK_INVOICES.forEach((inv: Invoice) => {
                counts[inv.status] = (counts[inv.status] || 0) + 1;
            });
            return counts as Record<Invoice['status'], number>;
        }

        const statuses: Invoice['status'][] = ['paid', 'pending', 'failed', 'cancelled', 'overdue'];
        const counts: Record<string, number> = {};

        for (const status of statuses) {
            const result = await retry(() => pb.collection('invoices').getList(1, 1, {
                filter: `status = "${status}"`
            }));
            counts[status] = result.totalItems;
        }

        return counts as Record<Invoice['status'], number>;
    },

    // Get overdue invoices
    getOverdueInvoices: async (): Promise<Invoice[]> => {
        if (isMockEnv()) {
            return MOCK_INVOICES.filter((inv: Invoice) => inv.status === 'overdue' || inv.status === 'pending');
        }

        return await retry(() => pb.collection('invoices').getFullList<Invoice>({
            filter: `status = "overdue" || (status = "pending" && period_end < "${new Date().toISOString()}")`,
            sort: '-period_end'
        }));
    }
};
