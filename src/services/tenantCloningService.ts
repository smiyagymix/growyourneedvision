/**
 * Tenant Cloning Service
 * 
 * Clone tenants with all data, create templates, and migrate tenant data
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';
import { RecordModel } from 'pocketbase';

// ==================== TYPES ====================

export interface TenantTemplate extends RecordModel {
    name: string;
    description: string;
    category: 'educational' | 'corporate' | 'non-profit' | 'custom';
    includes: {
        users: boolean;
        classes: boolean;
        courses: boolean;
        settings: boolean;
        features: boolean;
    };
    defaultSettings: Record<string, any>;
    createdBy: string;
}

export interface CloneJob extends RecordModel {
    sourceTenantId: string;
    targetTenantId?: string;
    templateId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number; // 0-100
    includeData: {
        users: boolean;
        classes: boolean;
        courses: boolean;
        settings: boolean;
        customizations: boolean;
    };
    mappings: Record<string, string>; // Old ID -> New ID
    error?: string;
    startedAt?: string;
    completedAt?: string;
}

export interface MigrationPlan {
    sourceTenantId: string;
    targetTenantId: string;
    collections: string[];
    estimatedRecords: number;
    estimatedDuration: number; // seconds
}

// ==================== MOCK DATA ====================

const MOCK_TEMPLATES: TenantTemplate[] = [
    {
        id: '1',
        collectionId: 'tenant_templates',
        collectionName: 'tenant_templates',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
        name: 'Basic School Template',
        description: 'Standard K-12 school setup with 5 classes',
        category: 'educational',
        includes: { users: true, classes: true, courses: true, settings: true, features: true },
        defaultSettings: { maxStudents: 500, maxTeachers: 50 },
        createdBy: 'owner1'
    }
];

// ==================== SERVICE ====================

class TenantCloningService {
    private readonly CLONABLE_COLLECTIONS = [
        'classes',
        'courses',
        'assignments',
        'lessons',
        'grades',
        'attendance',
        'schedules',
        'announcements',
        'resources',
        'categories'
    ];

    // ==================== TENANT CLONING ====================

    async cloneTenant(
        sourceTenantId: string,
        newTenantData: {
            name: string;
            subdomain: string;
            plan: string;
        },
        options: {
            includeUsers?: boolean;
            includeData?: boolean;
            includeSettings?: boolean;
        } = {}
    ): Promise<CloneJob> {
        if (isMockEnv()) {
            return {
                id: '1',
                collectionId: 'clone_jobs',
                collectionName: 'clone_jobs',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                sourceTenantId,
                status: 'pending',
                progress: 0,
                includeData: {
                    users: options.includeUsers || false,
                    classes: options.includeData || false,
                    courses: options.includeData || false,
                    settings: options.includeSettings || false,
                    customizations: options.includeSettings || false
                },
                mappings: {}
            };
        }

        return measurePerformance('cloneTenant', async () => {
            try {
                addBreadcrumb('Starting tenant clone', 'action', {
                    sourceTenantId,
                    newTenantName: newTenantData.name
                });

                // 1. Create new tenant
                const newTenant = await pb.collection('tenants').create({
                    name: newTenantData.name,
                    subdomain: newTenantData.subdomain,
                    plan: newTenantData.plan,
                    status: 'active',
                    max_students: 500,
                    max_teachers: 50,
                    max_storage_gb: 10
                });

                // 2. Create clone job
                const job = await pb.collection('clone_jobs').create<CloneJob>({
                    sourceTenantId,
                    targetTenantId: newTenant.id,
                    status: 'pending',
                    progress: 0,
                    includeData: {
                        users: options.includeUsers || false,
                        classes: options.includeData || false,
                        courses: options.includeData || false,
                        settings: options.includeSettings || false,
                        customizations: options.includeSettings || false
                    },
                    mappings: {},
                    startedAt: new Date().toISOString()
                });

                // 3. Start cloning process asynchronously
                this.processClone(job.id, sourceTenantId, newTenant.id, options).catch(error => {
                    console.error('Clone processing failed:', error);
                    captureException(error as Error, {
                        feature: 'tenant-cloning',
                        jobId: job.id
                    });
                });

                return job;
            } catch (error) {
                captureException(error as Error, {
                    feature: 'tenant-cloning',
                    operation: 'cloneTenant',
                    sourceTenantId
                });
                throw error;
            }
        }, { feature: 'tenant-cloning', sourceTenantId });
    }

    private async processClone(
        jobId: string,
        sourceTenantId: string,
        targetTenantId: string,
        options: any
    ): Promise<void> {
        try {
            await pb.collection('clone_jobs').update(jobId, { status: 'processing', progress: 5 });

            const mappings: Record<string, string> = {};
            let progress = 10;

            // Clone settings
            if (options.includeSettings) {
                await this.cloneSettings(sourceTenantId, targetTenantId);
                progress = 20;
                await pb.collection('clone_jobs').update(jobId, { progress });
            }

            // Clone data collections
            if (options.includeData) {
                const progressPerCollection = 60 / this.CLONABLE_COLLECTIONS.length;
                
                for (const collection of this.CLONABLE_COLLECTIONS) {
                    const newMappings = await this.cloneCollection(
                        collection,
                        sourceTenantId,
                        targetTenantId,
                        mappings
                    );
                    Object.assign(mappings, newMappings);
                    
                    progress += progressPerCollection;
                    await pb.collection('clone_jobs').update(jobId, { progress: Math.round(progress) });
                }
            }

            // Clone users
            if (options.includeUsers) {
                await this.cloneUsers(sourceTenantId, targetTenantId, mappings);
                progress = 95;
                await pb.collection('clone_jobs').update(jobId, { progress });
            }

            // Complete
            await pb.collection('clone_jobs').update(jobId, {
                status: 'completed',
                progress: 100,
                mappings,
                completedAt: new Date().toISOString()
            });

            addBreadcrumb('Tenant clone completed', 'action', {
                jobId,
                sourceTenantId,
                targetTenantId,
                recordsCloned: Object.keys(mappings).length
            });
        } catch (error) {
            await pb.collection('clone_jobs').update(jobId, {
                status: 'failed',
                error: (error as Error).message,
                completedAt: new Date().toISOString()
            });

            captureException(error as Error, {
                feature: 'tenant-cloning',
                operation: 'processClone',
                jobId
            });
        }
    }

    private async cloneCollection(
        collectionName: string,
        sourceTenantId: string,
        targetTenantId: string,
        existingMappings: Record<string, string>
    ): Promise<Record<string, string>> {
        const mappings: Record<string, string> = {};

        try {
            const records = await pb.collection(collectionName).getFullList({
                filter: `tenantId = "${sourceTenantId}"`,
                requestKey: null
            });

            for (const record of records) {
                const { id, created, updated, collectionId, collectionName, ...data } = record;

                // Update tenant ID
                data.tenantId = targetTenantId;

                // Update foreign key references using mappings
                Object.keys(data).forEach(key => {
                    if (key.endsWith('Id') && existingMappings[data[key]]) {
                        data[key] = existingMappings[data[key]];
                    }
                });

                // Create new record
                const newRecord = await pb.collection(collectionName).create(data);
                mappings[record.id] = newRecord.id;
            }
        } catch (error) {
            console.error(`Failed to clone collection ${collectionName}:`, error);
        }

        return mappings;
    }

    private async cloneSettings(sourceTenantId: string, targetTenantId: string): Promise<void> {
        try {
            const settings = await pb.collection('tenant_settings').getFirstListItem(
                `tenantId = "${sourceTenantId}"`
            );

            const { id, created, updated, collectionId, collectionName, ...data } = settings;
            data.tenantId = targetTenantId;

            await pb.collection('tenant_settings').create(data);
        } catch (error) {
            console.error('Failed to clone settings:', error);
        }
    }

    private async cloneUsers(
        sourceTenantId: string,
        targetTenantId: string,
        mappings: Record<string, string>
    ): Promise<void> {
        try {
            const users = await pb.collection('users').getFullList({
                filter: `tenantId = "${sourceTenantId}" && role != "Owner"`,
                requestKey: null
            });

            for (const user of users) {
                const { id, created, updated, collectionId, collectionName, verified, emailVisibility, ...data } = user;

                // Update tenant ID and email to avoid duplicates
                data.tenantId = targetTenantId;
                data.email = `cloned_${Date.now()}_${data.email}`;
                data.password = 'TempPassword123!'; // Require password reset

                const newUser = await pb.collection('users').create(data);
                mappings[user.id] = newUser.id;
            }
        } catch (error) {
            console.error('Failed to clone users:', error);
        }
    }

    // ==================== TEMPLATES ====================

    async createTemplate(template: Omit<TenantTemplate, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<TenantTemplate> {
        if (isMockEnv()) {
            return { ...MOCK_TEMPLATES[0], ...template };
        }

        return await pb.collection('tenant_templates').create<TenantTemplate>(template);
    }

    async getTemplates(category?: string): Promise<TenantTemplate[]> {
        if (isMockEnv()) return MOCK_TEMPLATES;

        const filter = category ? `category = "${category}"` : '';
        return await pb.collection('tenant_templates').getFullList<TenantTemplate>({
            filter,
            sort: '-created',
            requestKey: null
        });
    }

    async applyTemplate(templateId: string, tenantId: string): Promise<void> {
        if (isMockEnv()) return;

        const template = await pb.collection('tenant_templates').getOne<TenantTemplate>(templateId);

        // Apply template settings to tenant
        if (template.defaultSettings) {
            await pb.collection('tenants').update(tenantId, template.defaultSettings);
        }

        addBreadcrumb('Template applied', 'action', { templateId, tenantId });
    }

    // ==================== MIGRATION ====================

    async createMigrationPlan(sourceTenantId: string, targetTenantId: string): Promise<MigrationPlan> {
        if (isMockEnv()) {
            return {
                sourceTenantId,
                targetTenantId,
                collections: this.CLONABLE_COLLECTIONS,
                estimatedRecords: 1250,
                estimatedDuration: 300
            };
        }

        let totalRecords = 0;

        for (const collection of this.CLONABLE_COLLECTIONS) {
            const count = await pb.collection(collection).getList(1, 1, {
                filter: `tenantId = "${sourceTenantId}"`
            });
            totalRecords += count.totalItems;
        }

        return {
            sourceTenantId,
            targetTenantId,
            collections: this.CLONABLE_COLLECTIONS,
            estimatedRecords: totalRecords,
            estimatedDuration: Math.ceil(totalRecords / 10) // ~10 records per second
        };
    }

    async getCloneJobs(tenantId?: string): Promise<CloneJob[]> {
        if (isMockEnv()) return [];

        const filter = tenantId 
            ? `sourceTenantId = "${tenantId}" || targetTenantId = "${tenantId}"`
            : '';

        return await pb.collection('clone_jobs').getFullList<CloneJob>({
            filter,
            sort: '-created',
            requestKey: null
        });
    }

    async getCloneJobStatus(jobId: string): Promise<CloneJob> {
        if (isMockEnv()) {
            return {
                id: jobId,
                collectionId: 'clone_jobs',
                collectionName: 'clone_jobs',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                sourceTenantId: '1',
                targetTenantId: '2',
                status: 'completed',
                progress: 100,
                includeData: { users: true, classes: true, courses: true, settings: true, customizations: true },
                mappings: {}
            };
        }

        return await pb.collection('clone_jobs').getOne<CloneJob>(jobId);
    }
}

export const tenantCloningService = new TenantCloningService();
