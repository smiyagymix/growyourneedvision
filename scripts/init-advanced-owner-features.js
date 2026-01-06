/**
 * Initialize Advanced Search Collections
 * 
 * Creates collections for search history, saved searches, and search analytics
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function initializeCollections() {
    try {
        // Authenticate as admin
        await pb.admins.authWithPassword('owner@growyourneed.com', '12345678');

        console.log('✅ Authenticated as admin\n');

        const collections = await pb.collections.getFullList();

        // Collection 1: search_history
        const searchHistoryExists = collections.find(c => c.name === 'search_history');
        if (!searchHistoryExists) {
            await pb.collections.create({
                name: 'search_history',
                type: 'base',
                schema: [
                    { name: 'userId', type: 'text', required: true },
                    { name: 'query', type: 'json', required: true },
                    { name: 'resultsCount', type: 'number', required: true },
                    { name: 'timestamp', type: 'date', required: true }
                ],
                listRule: '@request.auth.id = userId',
                viewRule: '@request.auth.id = userId',
                createRule: '@request.auth.id != ""',
                updateRule: null,
                deleteRule: '@request.auth.id = userId'
            });
            console.log('✅ Created search_history collection');
        } else {
            console.log('⏭️  search_history collection already exists');
        }

        // Collection 2: saved_searches
        const savedSearchesExists = collections.find(c => c.name === 'saved_searches');
        if (!savedSearchesExists) {
            await pb.collections.create({
                name: 'saved_searches',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'query', type: 'json', required: true },
                    { name: 'userId', type: 'text', required: true },
                    { name: 'isPublic', type: 'bool', required: true }
                ],
                listRule: '@request.auth.id = userId || isPublic = true',
                viewRule: '@request.auth.id = userId || isPublic = true',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id = userId',
                deleteRule: '@request.auth.id = userId'
            });
            console.log('✅ Created saved_searches collection');
        } else {
            console.log('⏭️  saved_searches collection already exists');
        }

        // Collection 3: billing_rules
        const billingRulesExists = collections.find(c => c.name === 'billing_rules');
        if (!billingRulesExists) {
            await pb.collections.create({
                name: 'billing_rules',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['usage', 'discount', 'surcharge', 'credit', 'proration'] } },
                    { name: 'trigger', type: 'json', required: true },
                    { name: 'conditions', type: 'json', required: true },
                    { name: 'action', type: 'json', required: true },
                    { name: 'priority', type: 'number', required: true },
                    { name: 'isActive', type: 'bool', required: true },
                    { name: 'tenantIds', type: 'json', required: false },
                    { name: 'plans', type: 'json', required: false }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created billing_rules collection');
        } else {
            console.log('⏭️  billing_rules collection already exists');
        }

        // Collection 4: billing_rule_executions
        const ruleExecutionsExists = collections.find(c => c.name === 'billing_rule_executions');
        if (!ruleExecutionsExists) {
            await pb.collections.create({
                name: 'billing_rule_executions',
                type: 'base',
                schema: [
                    { name: 'ruleId', type: 'text', required: true },
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'action', type: 'text', required: true },
                    { name: 'context', type: 'json', required: false },
                    { name: 'executedAt', type: 'date', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created billing_rule_executions collection');
        } else {
            console.log('⏭️  billing_rule_executions collection already exists');
        }

        // Collection 5: onboarding_workflows
        const onboardingWorkflowsExists = collections.find(c => c.name === 'onboarding_workflows');
        if (!onboardingWorkflowsExists) {
            await pb.collections.create({
                name: 'onboarding_workflows',
                type: 'base',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'description', type: 'text', required: true },
                    { name: 'steps', type: 'json', required: true },
                    { name: 'triggers', type: 'json', required: true },
                    { name: 'isActive', type: 'bool', required: true },
                    { name: 'targetPlans', type: 'json', required: false }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: '@request.auth.role = "Owner"',
                updateRule: '@request.auth.role = "Owner"',
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created onboarding_workflows collection');
        } else {
            console.log('⏭️  onboarding_workflows collection already exists');
        }

        // Collection 6: onboarding_progress
        const onboardingProgressExists = collections.find(c => c.name === 'onboarding_progress');
        if (!onboardingProgressExists) {
            await pb.collections.create({
                name: 'onboarding_progress',
                type: 'base',
                schema: [
                    { name: 'tenantId', type: 'text', required: true },
                    { name: 'workflowId', type: 'text', required: true },
                    { name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['not_started', 'in_progress', 'completed', 'paused', 'failed'] } },
                    { name: 'currentStep', type: 'number', required: true },
                    { name: 'completedSteps', type: 'json', required: true },
                    { name: 'startedAt', type: 'date', required: true },
                    { name: 'completedAt', type: 'date', required: false },
                    { name: 'progress', type: 'number', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created onboarding_progress collection');
        } else {
            console.log('⏭️  onboarding_progress collection already exists');
        }

        // Collection 7: onboarding_step_skips
        const stepSkipsExists = collections.find(c => c.name === 'onboarding_step_skips');
        if (!stepSkipsExists) {
            await pb.collections.create({
                name: 'onboarding_step_skips',
                type: 'base',
                schema: [
                    { name: 'progressId', type: 'text', required: true },
                    { name: 'stepId', type: 'text', required: true },
                    { name: 'reason', type: 'text', required: false },
                    { name: 'skippedAt', type: 'date', required: true }
                ],
                listRule: '@request.auth.role = "Owner"',
                viewRule: '@request.auth.role = "Owner"',
                createRule: null,
                updateRule: null,
                deleteRule: '@request.auth.role = "Owner"'
            });
            console.log('✅ Created onboarding_step_skips collection');
        } else {
            console.log('⏭️  onboarding_step_skips collection already exists');
        }

        console.log('\n✅ All collections initialized successfully!');

    } catch (error) {
        console.error('❌ Error initializing collections:', error);
        process.exit(1);
    }
}

initializeCollections();
