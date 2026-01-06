import pb from '../lib/pocketbase';
import { RecordModel, ListResult } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Tenant extends RecordModel {
    name: string;
    subdomain: string;
    custom_domain?: string;
    logo?: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended' | 'trial' | 'cancelled';
    subscription_status: 'active' | 'past_due' | 'cancelled' | 'trialing';
    admin_email: string;
    admin_user: string;
    max_students: number;
    max_teachers: number;
    max_storage_gb: number;
    features_enabled: string[];
    trial_ends_at?: string;
    subscription_ends_at?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    metadata?: Record<string, unknown>;
    branding?: {
        primaryColor: string;
        secondaryColor: string;
        fontFamily: string;
        logo?: string;
    };
    settings?: {
        allowRegistration: boolean;
        requireEmailVerification: boolean;
        defaultUserRole: string;
        features: string[];
    };
}

export interface TenantUsage extends RecordModel {
    tenant: string;
    period_start: string;
    period_end: string;
    student_count: number;
    teacher_count: number;
    storage_used_gb: number;
    api_calls: number;
    active_users: number;
}

export interface SubscriptionPlan extends RecordModel {
    name: string;
    stripe_price_id: string;
    price_monthly: number;
    price_annual: number;
    max_students: number;
    max_teachers: number;
    max_storage_gb: number;
    features: string[];
    is_active: boolean;
}

export const tenantService = {
    // Tenant CRUD
    getTenants: async (filter?: string): Promise<ListResult<Tenant>> => {
        return await pb.collection('tenants').getList<Tenant>(1, 50, {
            filter: filter || '',
            sort: '-created',
            expand: 'admin_user'
        });
    },

    getTenantById: async (id: string): Promise<Tenant> => {
        return await pb.collection('tenants').getOne<Tenant>(id, {
            expand: 'admin_user'
        });
    },

    createTenant: async (data: Omit<Tenant, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<Tenant> => {
        return await pb.collection('tenants').create<Tenant>(data);
    },

    updateTenant: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
        return await pb.collection('tenants').update<Tenant>(id, data);
    },

    updateTenantStatus: async (id: string, status: Tenant['status']): Promise<Tenant> => {
        return await pb.collection('tenants').update<Tenant>(id, { status });
    },

    deleteTenant: async (id: string): Promise<boolean> => {
        return await pb.collection('tenants').delete(id);
    },

    suspendTenant: async (id: string): Promise<Tenant> => {
        return await pb.collection('tenants').update<Tenant>(id, { status: 'suspended' });
    },

    activateTenant: async (id: string): Promise<Tenant> => {
        return await pb.collection('tenants').update<Tenant>(id, { status: 'active' });
    },

    addTenantUser: async (tenantId: string, userData: Record<string, unknown>): Promise<RecordModel> => {
        return await pb.collection('users').create({
            ...userData,
            tenant: tenantId
        });
    },

    getTenantUsers: async (tenantId: string): Promise<ListResult<RecordModel>> => {
        return await pb.collection('users').getList(1, 100, {
            filter: `tenant = "${tenantId}"`,
            sort: '-created'
        });
    },

    removeTenantUser: async (userId: string) => {
        return await pb.collection('users').delete(userId);
    },

    // Usage tracking
    getTenantUsage: async (tenantId: string, startDate?: string, endDate?: string) => {
        let filter = `tenant = "${tenantId}"`;
        if (startDate && endDate) {
            filter += ` && period_start >= "${startDate}" && period_end <= "${endDate}"`;
        }

        return await pb.collection('tenant_usage').getList<TenantUsage>(1, 100, {
            filter,
            sort: '-period_start'
        });
    },

    recordUsage: async (data: Omit<TenantUsage, 'id'>) => {
        return await pb.collection('tenant_usage').create(data);
    },

    // Current usage calculations
    getCurrentUsage: async (tenantId: string) => {
        // Get current counts
        const [students, teachers, classes] = await Promise.all([
            pb.collection('users').getList(1, 1, {
                filter: `tenant = "${tenantId}" && role = "Student"`,
                fields: 'id'
            }),
            pb.collection('users').getList(1, 1, {
                filter: `tenant = "${tenantId}" && role = "Teacher"`,
                fields: 'id'
            }),
            pb.collection('classes').getList(1, 1, {
                filter: `tenant = "${tenantId}"`,
                fields: 'id'
            })
        ]);

        return {
            student_count: students.totalItems,
            teacher_count: teachers.totalItems,
            class_count: classes.totalItems,
            storage_used_gb: 0 // Note: Requires backend aggregation or 'tenant_stats' collection for accurate calculation
        };
    },

    // Feature checks
    hasFeature: (tenant: Tenant, feature: string): boolean => {
        return tenant.features_enabled?.includes(feature) || false;
    },

    canAddStudent: async (tenantId: string): Promise<boolean> => {
        const tenant = await tenantService.getTenantById(tenantId);
        const usage = await tenantService.getCurrentUsage(tenantId);
        return usage.student_count < tenant.max_students;
    },

    canAddTeacher: async (tenantId: string): Promise<boolean> => {
        const tenant = await tenantService.getTenantById(tenantId);
        const usage = await tenantService.getCurrentUsage(tenantId);
        return usage.teacher_count < tenant.max_teachers;
    },

    // Subscription plans
    getPlans: async () => {
        return await pb.collection('subscription_plans').getFullList<SubscriptionPlan>({
            filter: 'is_active = true',
            sort: 'price_monthly'
        });
    },

    // Analytics
    getTenantStats: async () => {
        const tenants = await pb.collection('tenants').getList(1, 1, { fields: 'id' });
        const activeTenants = await pb.collection('tenants').getList(1, 1, {
            filter: 'status = "active"',
            fields: 'id'
        });
        const trialTenants = await pb.collection('tenants').getList(1, 1, {
            filter: 'status = "trial"',
            fields: 'id'
        });

        return {
            total: tenants.totalItems,
            active: activeTenants.totalItems,
            trial: trialTenants.totalItems,
            suspended: tenants.totalItems - activeTenants.totalItems - trialTenants.totalItems
        };
    },

    // MRR calculation
    calculateMRR: async (): Promise<number> => {
        const tenants = await pb.collection('tenants').getFullList<Tenant>({
            filter: 'subscription_status = "active"'
        });

        const monthlyPrices: Record<string, number> = {
            free: 0,
            basic: 99,
            pro: 299,
            enterprise: 999
        };

        return tenants.reduce((mrr, tenant) => {
            return mrr + (monthlyPrices[tenant.plan] || 0);
        }, 0);
    },

    // ========== BULK OPERATIONS ==========

    /**
     * Bulk suspend tenants with detailed tracking
     */
    async bulkSuspend(
        tenantIds: string[],
        reason: string,
        details: string,
        userId: string
    ): Promise<{
        success: boolean;
        results: Array<{
            tenantId: string;
            tenantName: string;
            success: boolean;
            error?: string;
        }>;
        successCount: number;
        failureCount: number;
    }> {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const tenantId of tenantIds) {
            try {
                // Get tenant details
                const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

                // Update tenant status
                await pb.collection('tenants').update(tenantId, {
                    status: 'suspended',
                    suspension_reason: reason,
                    suspended_at: new Date().toISOString(),
                    suspended_by: userId,
                    updated: new Date().toISOString()
                });

                // Create audit log entry
                await pb.collection('audit_logs').create({
                    action: 'tenant_suspended',
                    resourceType: 'tenant',
                    resourceId: tenantId,
                    userId,
                    tenantId,
                    metadata: {
                        reason,
                        details,
                        previousStatus: tenant.status
                    },
                    severity: 'high'
                });

                // Send notification email (async, don't wait)
                import('../services/emailTemplateService').then(({ emailTemplateService }) => {
                    emailTemplateService.sendSuspensionNotice(
                        {
                            name: tenant.name,
                            admin_email: tenant.admin_email
                        },
                        reason,
                        details
                    ).catch(err => console.error('Email send failed:', err));
                });

                results.push({
                    tenantId,
                    tenantName: tenant.name,
                    success: true
                });
                successCount++;
            } catch (error) {
                results.push({
                    tenantId,
                    tenantName: 'Unknown',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failureCount++;
            }
        }

        return {
            success: failureCount === 0,
            results,
            successCount,
            failureCount
        };
    },

    /**
     * Bulk resume tenants
     */
    async bulkResume(
        tenantIds: string[],
        userId: string
    ): Promise<{
        success: boolean;
        results: Array<{
            tenantId: string;
            tenantName: string;
            success: boolean;
            error?: string;
        }>;
        successCount: number;
        failureCount: number;
    }> {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const tenantId of tenantIds) {
            try {
                const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

                await pb.collection('tenants').update(tenantId, {
                    status: 'active',
                    suspension_reason: null,
                    suspended_at: null,
                    suspended_by: null,
                    resumed_at: new Date().toISOString(),
                    resumed_by: userId,
                    updated: new Date().toISOString()
                });

                await pb.collection('audit_logs').create({
                    action: 'tenant_resumed',
                    resourceType: 'tenant',
                    resourceId: tenantId,
                    userId,
                    tenantId,
                    metadata: {
                        previousStatus: tenant.status
                    },
                    severity: 'medium'
                });

                results.push({
                    tenantId,
                    tenantName: tenant.name,
                    success: true
                });
                successCount++;
            } catch (error) {
                results.push({
                    tenantId,
                    tenantName: 'Unknown',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failureCount++;
            }
        }

        return {
            success: failureCount === 0,
            results,
            successCount,
            failureCount
        };
    },

    /**
     * Bulk update tenant plan
     */
    async bulkUpdatePlan(
        tenantIds: string[],
        newPlan: 'free' | 'basic' | 'pro' | 'enterprise',
        userId: string
    ): Promise<{
        success: boolean;
        results: Array<{
            tenantId: string;
            tenantName: string;
            success: boolean;
            error?: string;
        }>;
        successCount: number;
        failureCount: number;
    }> {
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        const planLimits: Record<'free' | 'basic' | 'pro' | 'enterprise', { students: number; teachers: number; storage: number }> = {
            free: { students: 25, teachers: 3, storage: 5 },
            basic: { students: 100, teachers: 10, storage: 50 },
            pro: { students: 500, teachers: 50, storage: 500 },
            enterprise: { students: 9999, teachers: 999, storage: 10000 }
        };

        for (const tenantId of tenantIds) {
            try {
                const tenant = await pb.collection('tenants').getOne<Tenant>(tenantId);

                await pb.collection('tenants').update(tenantId, {
                    plan: newPlan,
                    max_students: planLimits[newPlan].students,
                    max_teachers: planLimits[newPlan].teachers,
                    max_storage_gb: planLimits[newPlan].storage,
                    updated: new Date().toISOString()
                });

                await pb.collection('audit_logs').create({
                    action: 'tenant_plan_updated',
                    resourceType: 'tenant',
                    resourceId: tenantId,
                    userId,
                    tenantId,
                    metadata: {
                        previousPlan: tenant.plan,
                        newPlan
                    },
                    severity: 'medium'
                });

                results.push({
                    tenantId,
                    tenantName: tenant.name,
                    success: true
                });
                successCount++;
            } catch (error) {
                results.push({
                    tenantId,
                    tenantName: 'Unknown',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                failureCount++;
            }
        }

        return {
            success: failureCount === 0,
            results,
            successCount,
            failureCount
        };
    }
};
