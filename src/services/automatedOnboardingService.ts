/**
 * Automated Onboarding Service
 * 
 * Workflow automation for new tenant onboarding with steps, tasks,
 * email sequences, and progress tracking
 */

import pb from '../lib/pocketbase';
import * as Sentry from '@sentry/react';
import { isMockEnv } from '../utils/mockData';

export interface OnboardingWorkflow {
    id: string;
    name: string;
    description: string;
    steps: OnboardingStep[];
    triggers: WorkflowTrigger[];
    isActive: boolean;
    targetPlans?: string[];
    created: string;
    updated: string;
}

export interface OnboardingStep {
    id: string;
    name: string;
    description: string;
    type: 'task' | 'email' | 'notification' | 'integration' | 'delay';
    config: StepConfig;
    order: number;
    isRequired: boolean;
    dependencies?: string[]; // IDs of steps that must complete first
}

export interface StepConfig {
    // For task steps
    taskTitle?: string;
    taskDescription?: string;
    assignTo?: 'admin' | 'owner' | 'support';
    dueInDays?: number;

    // For email steps
    emailTemplate?: string;
    recipients?: string[];

    // For delay steps
    delayDays?: number;
    delayHours?: number;

    // For integration steps
    integrationId?: string;
    action?: string;
    params?: Record<string, any>;
}

export interface WorkflowTrigger {
    event: 'tenant_created' | 'payment_confirmed' | 'trial_started' | 'manual';
    conditions?: { field: string; operator: string; value: any }[];
}

export interface OnboardingProgress {
    id: string;
    tenantId: string;
    workflowId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'failed';
    currentStep: number;
    completedSteps: string[];
    startedAt: string;
    completedAt?: string;
    progress: number; // 0-100
}

const MOCK_WORKFLOWS: OnboardingWorkflow[] = [
    {
        id: '1',
        name: 'Standard School Onboarding',
        description: 'Complete onboarding flow for new school tenants',
        steps: [
            {
                id: 's1',
                name: 'Welcome Email',
                description: 'Send welcome email with getting started guide',
                type: 'email',
                config: { emailTemplate: 'welcome', recipients: ['admin'] },
                order: 1,
                isRequired: true
            },
            {
                id: 's2',
                name: 'Setup School Profile',
                description: 'Complete school information and branding',
                type: 'task',
                config: { taskTitle: 'Complete School Profile', assignTo: 'admin', dueInDays: 3 },
                order: 2,
                isRequired: true
            },
            {
                id: 's3',
                name: 'Import Users',
                description: 'Import teachers and students',
                type: 'task',
                config: { taskTitle: 'Import Users', assignTo: 'admin', dueInDays: 7 },
                order: 3,
                isRequired: true
            }
        ],
        triggers: [{ event: 'tenant_created' }],
        isActive: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    }
];

class AutomatedOnboardingService {
    /**
     * Get all workflows
     */
    async getWorkflows(filters?: { isActive?: boolean }): Promise<OnboardingWorkflow[]> {
        try {
            if (isMockEnv()) {
                let workflows = MOCK_WORKFLOWS;
                if (filters?.isActive !== undefined) {
                    workflows = workflows.filter(w => w.isActive === filters.isActive);
                }
                return workflows;
            }

            const filter = filters?.isActive !== undefined 
                ? `isActive = ${filters.isActive}`
                : undefined;

            return await pb.collection('onboarding_workflows').getFullList({
                filter,
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Create new workflow
     */
    async createWorkflow(workflow: Omit<OnboardingWorkflow, 'id' | 'created' | 'updated'>): Promise<OnboardingWorkflow> {
        try {
            if (isMockEnv()) {
                return {
                    ...workflow,
                    id: 'mock-' + Date.now(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString()
                };
            }

            return await pb.collection('onboarding_workflows').create({
                ...workflow,
                steps: JSON.stringify(workflow.steps),
                triggers: JSON.stringify(workflow.triggers)
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Update workflow
     */
    async updateWorkflow(workflowId: string, updates: Partial<OnboardingWorkflow>): Promise<OnboardingWorkflow> {
        try {
            if (isMockEnv()) {
                const workflow = MOCK_WORKFLOWS.find(w => w.id === workflowId);
                return { ...workflow!, ...updates, updated: new Date().toISOString() };
            }

            const data: any = { ...updates };
            if (updates.steps) data.steps = JSON.stringify(updates.steps);
            if (updates.triggers) data.triggers = JSON.stringify(updates.triggers);

            return await pb.collection('onboarding_workflows').update(workflowId, data);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Start onboarding for a tenant
     */
    async startOnboarding(tenantId: string, workflowId?: string): Promise<OnboardingProgress> {
        return await Sentry.startSpan(
            { name: 'startOnboarding', op: 'onboarding.start' },
            async () => {
                try {
                    if (isMockEnv()) {
                        return {
                            id: 'progress-1',
                            tenantId,
                            workflowId: workflowId || '1',
                            status: 'in_progress',
                            currentStep: 0,
                            completedSteps: [],
                            startedAt: new Date().toISOString(),
                            progress: 0
                        };
                    }

                    // If no workflow specified, find default for tenant's plan
                    let workflow: OnboardingWorkflow;
                    if (workflowId) {
                        workflow = await pb.collection('onboarding_workflows').getOne(workflowId, { requestKey: null });
                    } else {
                        const tenant = await pb.collection('tenants').getOne(tenantId, { requestKey: null });
                        const workflows = await this.getWorkflows({ isActive: true });
                        workflow = workflows.find(w => 
                            !w.targetPlans || w.targetPlans.includes(tenant.plan)
                        ) || workflows[0];
                    }

                    // Create progress record
                    const progress = await pb.collection('onboarding_progress').create({
                        tenantId,
                        workflowId: workflow.id,
                        status: 'in_progress',
                        currentStep: 0,
                        completedSteps: JSON.stringify([]),
                        startedAt: new Date().toISOString(),
                        progress: 0
                    });

                    // Execute first step
                    await this.executeNextStep(progress.id);

                    return progress as unknown as OnboardingProgress;
                } catch (error) {
                    Sentry.captureException(error);
                    throw error;
                }
            }
        );
    }

    /**
     * Get onboarding progress for tenant
     */
    async getProgress(tenantId: string): Promise<OnboardingProgress | null> {
        try {
            if (isMockEnv()) {
                return {
                    id: 'progress-1',
                    tenantId,
                    workflowId: '1',
                    status: 'in_progress',
                    currentStep: 1,
                    completedSteps: ['s1'],
                    startedAt: new Date().toISOString(),
                    progress: 33
                };
            }

            const records = await pb.collection('onboarding_progress').getList(1, 1, {
                filter: `tenantId = "${tenantId}"`,
                sort: '-startedAt',
                requestKey: null
            });

            if (records.items.length === 0) return null;

            const progress = records.items[0];
            return {
                ...progress,
                completedSteps: JSON.parse(progress.completedSteps || '[]')
            } as unknown as OnboardingProgress;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Complete a step
     */
    async completeStep(progressId: string, stepId: string): Promise<OnboardingProgress> {
        try {
            if (isMockEnv()) {
                return {
                    id: progressId,
                    tenantId: 'tenant-1',
                    workflowId: '1',
                    status: 'in_progress',
                    currentStep: 2,
                    completedSteps: ['s1', stepId],
                    startedAt: new Date().toISOString(),
                    progress: 67
                };
            }

            const progress = await pb.collection('onboarding_progress').getOne(progressId, { requestKey: null });
            const workflow = await pb.collection('onboarding_workflows').getOne(progress.workflowId, { requestKey: null });
            
            const completedSteps = JSON.parse(progress.completedSteps || '[]');
            if (!completedSteps.includes(stepId)) {
                completedSteps.push(stepId);
            }

            const steps = JSON.parse(workflow.steps);
            const progressPercent = Math.round((completedSteps.length / steps.length) * 100);
            const allComplete = completedSteps.length === steps.length;

            const updated = await pb.collection('onboarding_progress').update(progressId, {
                completedSteps: JSON.stringify(completedSteps),
                currentStep: completedSteps.length,
                progress: progressPercent,
                status: allComplete ? 'completed' : 'in_progress',
                completedAt: allComplete ? new Date().toISOString() : undefined
            });

            // Execute next step if not all complete
            if (!allComplete) {
                await this.executeNextStep(progressId);
            }

            return {
                ...updated,
                completedSteps
            } as unknown as OnboardingProgress;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Skip a step
     */
    async skipStep(progressId: string, stepId: string, reason?: string): Promise<OnboardingProgress> {
        try {
            // Log skip action
            if (!isMockEnv()) {
                await pb.collection('onboarding_step_skips').create({
                    progressId,
                    stepId,
                    reason,
                    skippedAt: new Date().toISOString()
                });
            }

            // Mark as complete to move forward
            return this.completeStep(progressId, stepId);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Pause onboarding
     */
    async pauseOnboarding(progressId: string): Promise<void> {
        try {
            if (isMockEnv()) return;
            
            await pb.collection('onboarding_progress').update(progressId, {
                status: 'paused'
            });
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Resume onboarding
     */
    async resumeOnboarding(progressId: string): Promise<void> {
        try {
            if (isMockEnv()) return;
            
            await pb.collection('onboarding_progress').update(progressId, {
                status: 'in_progress'
            });

            await this.executeNextStep(progressId);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Get onboarding analytics
     */
    async getAnalytics(): Promise<{
        totalOnboardings: number;
        completed: number;
        inProgress: number;
        avgCompletionDays: number;
        completionRate: number;
        dropOffSteps: { stepName: string; count: number }[];
    }> {
        try {
            if (isMockEnv()) {
                return {
                    totalOnboardings: 150,
                    completed: 120,
                    inProgress: 25,
                    avgCompletionDays: 7,
                    completionRate: 80,
                    dropOffSteps: [
                        { stepName: 'Import Users', count: 15 },
                        { stepName: 'Setup Integration', count: 10 }
                    ]
                };
            }

            const allProgress = await pb.collection('onboarding_progress').getFullList({
                requestKey: null
            });

            const completed = allProgress.filter(p => p.status === 'completed');
            const inProgress = allProgress.filter(p => p.status === 'in_progress');

            // Calculate average completion time
            const completionTimes = completed
                .filter(p => p.completedAt)
                .map(p => {
                    const start = new Date(p.startedAt).getTime();
                    const end = new Date(p.completedAt).getTime();
                    return (end - start) / (1000 * 60 * 60 * 24); // days
                });

            const avgCompletionDays = completionTimes.length > 0
                ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
                : 0;

            return {
                totalOnboardings: allProgress.length,
                completed: completed.length,
                inProgress: inProgress.length,
                avgCompletionDays,
                completionRate: allProgress.length > 0 
                    ? Math.round((completed.length / allProgress.length) * 100)
                    : 0,
                dropOffSteps: [] // Would require more complex analysis
            };
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    /**
     * Execute next step in workflow
     */
    private async executeNextStep(progressId: string): Promise<void> {
        try {
            const progress = await pb.collection('onboarding_progress').getOne(progressId, { requestKey: null });
            const workflow = await pb.collection('onboarding_workflows').getOne(progress.workflowId, { requestKey: null });
            const tenant = await pb.collection('tenants').getOne(progress.tenantId, { requestKey: null });

            const steps: OnboardingStep[] = JSON.parse(workflow.steps);
            const completedSteps: string[] = JSON.parse(progress.completedSteps || '[]');

            // Find next step that hasn't been completed and has all dependencies met
            const nextStep = steps.find(step => 
                !completedSteps.includes(step.id) &&
                (!step.dependencies || step.dependencies.every(dep => completedSteps.includes(dep)))
            );

            if (!nextStep) return;

            // Execute step based on type
            switch (nextStep.type) {
                case 'email':
                    await this.sendEmail(tenant, nextStep.config);
                    // Auto-complete email steps
                    await this.completeStep(progressId, nextStep.id);
                    break;

                case 'task':
                    await this.createTask(tenant, nextStep);
                    break;

                case 'notification':
                    await this.sendNotification(tenant, nextStep.config);
                    await this.completeStep(progressId, nextStep.id);
                    break;

                case 'delay':
                    // Schedule next execution
                    await this.scheduleStep(progressId, nextStep);
                    break;

                case 'integration':
                    await this.executeIntegration(tenant, nextStep.config);
                    await this.completeStep(progressId, nextStep.id);
                    break;
            }
        } catch (error) {
            console.error('Error executing next step:', error);
        }
    }

    // Step execution methods (simplified implementations)
    private async sendEmail(tenant: any, config: StepConfig): Promise<void> {
        console.log(`Sending email ${config.emailTemplate} to tenant ${tenant.id}`);
        // In production: integrate with email service
    }

    private async createTask(tenant: any, step: OnboardingStep): Promise<void> {
        console.log(`Creating task "${step.config.taskTitle}" for tenant ${tenant.id}`);
        // In production: create task in PocketBase
    }

    private async sendNotification(tenant: any, config: StepConfig): Promise<void> {
        console.log(`Sending notification to tenant ${tenant.id}`);
        // In production: integrate with notification service
    }

    private async scheduleStep(progressId: string, step: OnboardingStep): Promise<void> {
        console.log(`Scheduling step ${step.id} for progress ${progressId}`);
        // In production: use job scheduler
    }

    private async executeIntegration(tenant: any, config: StepConfig): Promise<void> {
        console.log(`Executing integration ${config.integrationId} for tenant ${tenant.id}`);
        // In production: call integration API
    }
}

export const automatedOnboardingService = new AutomatedOnboardingService();
