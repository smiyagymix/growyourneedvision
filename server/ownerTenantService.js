/**
 * Owner Tenant Service
 * 
 * Advanced tenant management operations for Owner dashboard
 * Handles bulk operations, cloning, migrations, and health monitoring
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function authenticate() {
    try {
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL || 'owner@growyourneed.com',
            process.env.POCKETBASE_ADMIN_PASSWORD || '12345678'
        );
        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        return false;
    }
}

export const ownerTenantService = {
    /**
     * Bulk suspend tenants with audit trail
     */
    async bulkSuspend(tenantIds, reason, details, userId) {
        await authenticate();

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const tenantId of tenantIds) {
            try {
                const tenant = await pb.collection('tenants').getOne(tenantId);

                await pb.collection('tenants').update(tenantId, {
                    status: 'suspended',
                    suspension_reason: reason,
                    suspended_at: new Date().toISOString(),
                    suspended_by: userId
                });

                // Create audit log
                await pb.collection('audit_logs').create({
                    action: 'tenant_suspended',
                    resourceType: 'tenant',
                    resourceId: tenantId,
                    userId,
                    tenantId,
                    metadata: JSON.stringify({
                        reason,
                        details,
                        previousStatus: tenant.status
                    }),
                    severity: 'high'
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
                    error: error.message
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
     * Clone tenant with all data
     */
    async cloneTenant(sourceId, newName, options = {}) {
        await authenticate();

        try {
            const sourceTenant = await pb.collection('tenants').getOne(sourceId);

            // Create migration record
            const migration = await pb.collection('tenant_migrations').create({
                sourceTenantId: sourceId,
                status: 'in_progress',
                migrationType: 'clone',
                dataTypes: JSON.stringify(options.dataTypes || ['settings', 'users', 'courses']),
                progress: 0,
                startedAt: new Date().toISOString(),
                initiatedBy: options.userId || 'system'
            });

            // Create new tenant
            const newTenant = await pb.collection('tenants').create({
                name: newName,
                subdomain: `${newName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
                plan: sourceTenant.plan,
                status: 'trial',
                admin_email: options.adminEmail || `admin@${newName.toLowerCase()}.com`,
                max_students: sourceTenant.max_students,
                max_teachers: sourceTenant.max_teachers,
                max_storage_gb: sourceTenant.max_storage_gb,
                features_enabled: sourceTenant.features_enabled,
                branding: sourceTenant.branding,
                settings: sourceTenant.settings,
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            });

            // Update migration with target
            await pb.collection('tenant_migrations').update(migration.id, {
                targetTenantId: newTenant.id,
                progress: 25
            });

            // Clone data based on options
            let totalRecords = 0;
            let migratedRecords = 0;

            if (options.dataTypes?.includes('users')) {
                // Clone users (simplified - would need password handling in production)
                const users = await pb.collection('users').getFullList({
                    filter: `tenantId = "${sourceId}"`
                });
                
                totalRecords += users.length;

                for (const user of users) {
                    try {
                        await pb.collection('users').create({
                            ...user,
                            id: undefined, // Let PB generate new ID
                            tenantId: newTenant.id,
                            email: `${user.email.split('@')[0]}-clone@${user.email.split('@')[1]}`
                        });
                        migratedRecords++;
                    } catch (err) {
                        console.error(`Failed to clone user ${user.id}:`, err.message);
                    }
                }
            }

            // Update final migration status
            await pb.collection('tenant_migrations').update(migration.id, {
                status: 'completed',
                progress: 100,
                totalRecords,
                migratedRecords,
                completedAt: new Date().toISOString()
            });

            return {
                success: true,
                sourceTenant: {
                    id: sourceId,
                    name: sourceTenant.name
                },
                newTenant: {
                    id: newTenant.id,
                    name: newTenant.name,
                    subdomain: newTenant.subdomain
                },
                migrationId: migration.id,
                recordsMigrated: migratedRecords,
                totalRecords
            };
        } catch (error) {
            console.error('Clone tenant error:', error);
            throw error;
        }
    },

    /**
     * Migrate data between tenants
     */
    async migrateTenantData(fromId, toId, dataTypes, userId) {
        await authenticate();

        const migration = await pb.collection('tenant_migrations').create({
            sourceTenantId: fromId,
            targetTenantId: toId,
            status: 'in_progress',
            migrationType: 'merge',
            dataTypes: JSON.stringify(dataTypes),
            progress: 0,
            startedAt: new Date().toISOString(),
            initiatedBy: userId
        });

        try {
            let totalRecords = 0;
            let migratedRecords = 0;
            const errors = [];

            // Migrate each data type
            for (const dataType of dataTypes) {
                try {
                    const records = await pb.collection(dataType).getFullList({
                        filter: `tenantId = "${fromId}"`
                    });

                    totalRecords += records.length;

                    for (const record of records) {
                        try {
                            await pb.collection(dataType).create({
                                ...record,
                                id: undefined,
                                tenantId: toId
                            });
                            migratedRecords++;
                        } catch (err) {
                            errors.push({
                                collection: dataType,
                                recordId: record.id,
                                error: err.message
                            });
                        }
                    }
                } catch (err) {
                    errors.push({
                        collection: dataType,
                        error: err.message
                    });
                }

                // Update progress
                const progress = Math.round((dataTypes.indexOf(dataType) + 1) / dataTypes.length * 100);
                await pb.collection('tenant_migrations').update(migration.id, { progress });
            }

            await pb.collection('tenant_migrations').update(migration.id, {
                status: 'completed',
                progress: 100,
                totalRecords,
                migratedRecords,
                errors: JSON.stringify(errors),
                completedAt: new Date().toISOString()
            });

            return {
                success: true,
                migrationId: migration.id,
                totalRecords,
                migratedRecords,
                errors
            };
        } catch (error) {
            await pb.collection('tenant_migrations').update(migration.id, {
                status: 'failed',
                errors: JSON.stringify([{ error: error.message }])
            });
            throw error;
        }
    },

    /**
     * Calculate tenant health score
     */
    async getTenantHealth(tenantId) {
        await authenticate();

        try {
            const tenant = await pb.collection('tenants').getOne(tenantId);
            
            let healthScore = 100;
            const factors = [];

            // Factor 1: Payment status
            if (tenant.subscription_status === 'past_due') {
                healthScore -= 30;
                factors.push({ factor: 'Payment overdue', impact: -30 });
            }

            // Factor 2: Status
            if (tenant.status === 'suspended') {
                healthScore -= 40;
                factors.push({ factor: 'Account suspended', impact: -40 });
            } else if (tenant.status === 'trial') {
                const daysLeft = Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) {
                    healthScore -= 20;
                    factors.push({ factor: `Trial ending in ${daysLeft} days`, impact: -20 });
                }
            }

            // Factor 3: Usage (get latest usage record)
            try {
                const latestUsage = await pb.collection('tenant_usage').getFirstListItem(
                    `tenant = "${tenantId}"`,
                    { sort: '-created' }
                );

                // Check if near limits
                if (latestUsage.student_count >= tenant.max_students * 0.9) {
                    healthScore += 10; // Actually good - high engagement
                    factors.push({ factor: 'High user engagement', impact: +10 });
                }

                if (latestUsage.storage_used_gb >= tenant.max_storage_gb * 0.9) {
                    healthScore -= 5; // Might need upgrade
                    factors.push({ factor: 'Storage near limit', impact: -5 });
                }
            } catch (err) {
                // No usage data
                healthScore -= 15;
                factors.push({ factor: 'No usage data', impact: -15 });
            }

            // Clamp score between 0-100
            healthScore = Math.max(0, Math.min(100, healthScore));

            const healthLevel = 
                healthScore >= 80 ? 'excellent' :
                healthScore >= 60 ? 'good' :
                healthScore >= 40 ? 'fair' :
                'poor';

            return {
                tenantId,
                tenantName: tenant.name,
                healthScore,
                healthLevel,
                factors,
                recommendations: this.getHealthRecommendations(factors, tenant),
                lastChecked: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error calculating tenant health:', error);
            throw error;
        }
    },

    /**
     * Assign custom domain to tenant
     */
    async assignCustomDomain(tenantId, domain, userId) {
        await authenticate();

        try {
            // Validate domain format
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
            if (!domainRegex.test(domain)) {
                throw new Error('Invalid domain format');
            }

            // Check if domain already in use
            const existing = await pb.collection('tenants').getFullList({
                filter: `custom_domain = "${domain}"`
            });

            if (existing.length > 0) {
                throw new Error('Domain already in use');
            }

            // Update tenant
            await pb.collection('tenants').update(tenantId, {
                custom_domain: domain,
                ssl_cert_status: 'pending',
                updated: new Date().toISOString()
            });

            // Create audit log
            await pb.collection('audit_logs').create({
                action: 'custom_domain_assigned',
                resourceType: 'tenant',
                resourceId: tenantId,
                userId,
                tenantId,
                metadata: JSON.stringify({ domain }),
                severity: 'medium'
            });

            return {
                success: true,
                tenantId,
                domain,
                status: 'pending_verification',
                verificationInstructions: {
                    type: 'CNAME',
                    name: domain,
                    value: `${tenantId}.growyourneed.com`,
                    ttl: 3600
                }
            };
        } catch (error) {
            console.error('Error assigning custom domain:', error);
            throw error;
        }
    },

    // Helper methods

    getHealthRecommendations(factors, tenant) {
        const recommendations = [];

        factors.forEach(factor => {
            if (factor.factor.includes('Payment overdue')) {
                recommendations.push('Contact billing immediately');
                recommendations.push('Set up payment retry');
            }
            if (factor.factor.includes('suspended')) {
                recommendations.push('Review suspension reason');
                recommendations.push('Contact tenant admin');
            }
            if (factor.factor.includes('Trial ending')) {
                recommendations.push('Send upgrade reminder');
                recommendations.push('Offer conversion incentive');
            }
            if (factor.factor.includes('Storage near limit')) {
                recommendations.push('Suggest plan upgrade');
                recommendations.push('Enable storage cleanup tools');
            }
            if (factor.factor.includes('No usage data')) {
                recommendations.push('Schedule onboarding call');
                recommendations.push('Send usage tutorials');
            }
        });

        return recommendations.length > 0 ? recommendations : ['Tenant health is good - no actions needed'];
    }
};

export default ownerTenantService;
