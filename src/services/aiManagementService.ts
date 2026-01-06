import pb from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '@/utils/mockData';

export interface AIConfig extends RecordModel {
    key: string;
    value: any;
    description: string;
}

export interface AIObjective extends RecordModel {
    title: string;
    target: string;
    current_value: number;
    target_value: number;
    unit: string;
    status: 'On Track' | 'At Risk' | 'Behind' | 'Completed';
    deadline: string;
}

export interface UsageLog extends RecordModel {
    user_id: string;
    model: string;
    tokens_input: number;
    tokens_output: number;
    cost: number;
    request_type: string;
}

export const aiManagementService = {
    // AI Config
    async getConfigs(): Promise<AIConfig[]> {
        if (isMockEnv()) {
            return [
                { id: 'mock-config-1', collectionId: 'mock', collectionName: 'ai_config', created: '', updated: '', key: 'default_model', value: 'gpt-4', description: 'Default LLM' },
                { id: 'mock-config-2', collectionId: 'mock', collectionName: 'ai_config', created: '', updated: '', key: 'temperature', value: 0.4, description: 'Creativity' },
            ];
        }
        return await pb.collection('ai_config').getFullList<AIConfig>();
    },

    async updateConfig(id: string, data: Partial<AIConfig>): Promise<AIConfig> {
        return await pb.collection('ai_config').update<AIConfig>(id, data);
    },

    async getConfigByKey(key: string): Promise<AIConfig | null> {
        try {
            return await pb.collection('ai_config').getFirstListItem<AIConfig>(`key="${key}"`);
        } catch (e) {
            return null;
        }
    },

    // AI Objectives
    async getObjectives(): Promise<AIObjective[]> {
        if (isMockEnv()) {
            return [
                { id: 'mock-obj-1', collectionId: 'mock', collectionName: 'ai_objectives', created: '', updated: '', title: 'Reduce response latency', target: 'P95 < 1.5s', current_value: 1.2, target_value: 1.5, unit: 'seconds', status: 'On Track', deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() },
                { id: 'mock-obj-2', collectionId: 'mock', collectionName: 'ai_objectives', created: '', updated: '', title: 'Lower monthly cost', target: 'Cost <$200', current_value: 180, target_value: 200, unit: 'USD', status: 'At Risk', deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() },
            ];
        }
        return await pb.collection('ai_objectives').getFullList<AIObjective>({ sort: '-created' });
    },

    async createObjective(data: Partial<AIObjective>): Promise<AIObjective> {
        return await pb.collection('ai_objectives').create<AIObjective>(data);
    },

    async updateObjective(id: string, data: Partial<AIObjective>): Promise<AIObjective> {
        return await pb.collection('ai_objectives').update<AIObjective>(id, data);
    },

    async deleteObjective(id: string): Promise<boolean> {
        return await pb.collection('ai_objectives').delete(id);
    },

    // Usage Logs / Analytics
    async getUsageStats(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
        if (isMockEnv()) {
            return {
                totalTokens: 125000,
                totalCost: 42.5,
                logs: [
                    { id: 'mock-log-1', collectionId: 'mock', collectionName: 'usage_logs', created: '', updated: '', user_id: 'mock-owner', model: 'gpt-4', tokens_input: 1200, tokens_output: 800, cost: 0.08, request_type: 'chat' },
                    { id: 'mock-log-2', collectionId: 'mock', collectionName: 'usage_logs', created: '', updated: '', user_id: 'mock-teacher', model: 'gpt-4', tokens_input: 900, tokens_output: 600, cost: 0.05, request_type: 'lesson_plan' },
                ]
            };
        }
        // This would ideally be an aggregation query, but PB doesn't support them natively yet.
        // We'll fetch logs and aggregate client-side for now, or use a custom endpoint if we had one.
        // For now, let's just fetch the last N logs.
        const logs = await pb.collection('usage_logs').getList<UsageLog>(1, 1000, { sort: '-created' });
        
        // Simple aggregation
        let totalTokens = 0;
        let totalCost = 0;
        
        logs.items.forEach(log => {
            totalTokens += (log.tokens_input || 0) + (log.tokens_output || 0);
            totalCost += (log.cost || 0);
        });

        return {
            totalTokens,
            totalCost,
            logs: logs.items
        };
    },

    // Operations / Health
    async getSystemHealth(): Promise<any> {
        if (isMockEnv()) {
            return {
                database: 'Operational',
                vectorStore: 'Operational',
                aiGateway: 'Operational',
            };
        }
        // Check PB connection
        const pbStatus = pb.authStore.isValid ? 'Connected' : 'Disconnected'; // Not really a health check, but a start.
        
        // We could try to fetch something to verify connection
        let dbConnected = false;
        try {
            await pb.collection('users').getList(1, 1);
            dbConnected = true;
        } catch (e) {
            dbConnected = false;
        }

        // Check Python Service (if we had a URL)
        // For now, mock the Python service check or assume it's running if we can hit it.
        // We'll implement a real check in the component using fetch.

        return {
            database: dbConnected ? 'Operational' : 'Down',
            // other services...
        };
    }
};
