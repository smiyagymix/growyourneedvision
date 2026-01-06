import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface IntegrationConfig {
    id: string;
    name: string;
    category: 'email' | 'analytics' | 'payment' | 'storage';
    provider: string;
    enabled: boolean;
    status: 'connected' | 'disconnected' | 'error';
    config: Record<string, any>;
    last_synced?: string;
    created?: string;
    updated?: string;
}

// Mock data for development/testing
const MOCK_INTEGRATIONS: IntegrationConfig[] = [
    {
        id: '1',
        name: 'Email Service',
        category: 'email',
        provider: 'SMTP',
        enabled: true,
        status: 'connected',
        config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            from_email: 'noreply@growyourneed.com',
            from_name: 'Grow Your Need'
        },
        last_synced: '2 hours ago'
    },
    {
        id: '2',
        name: 'Google Analytics',
        category: 'analytics',
        provider: 'Google Analytics 4',
        enabled: true,
        status: 'connected',
        config: {
            tracking_id: 'G-XXXXXXXXX',
            measurement_id: 'G-XXXXXXXXX'
        },
        last_synced: '5 minutes ago'
    },
    {
        id: '3',
        name: 'Stripe Payment',
        category: 'payment',
        provider: 'Stripe',
        enabled: true,
        status: 'connected',
        config: {
            mode: 'live',
            webhook_url: 'https://api.growyourneed.com/webhooks/stripe'
        },
        last_synced: '1 hour ago'
    },
    {
        id: '4',
        name: 'Cloud Storage',
        category: 'storage',
        provider: 'MinIO / S3',
        enabled: true,
        status: 'connected',
        config: {
            endpoint: 'minio.growyourneed.com',
            bucket: 'platform-assets',
            region: 'us-east-1'
        },
        last_synced: '30 minutes ago'
    },
    {
        id: '5',
        name: 'SendGrid',
        category: 'email',
        provider: 'SendGrid',
        enabled: false,
        status: 'disconnected',
        config: {
            api_key: '',
            from_email: '',
            from_name: ''
        }
    },
    {
        id: '6',
        name: 'Mixpanel',
        category: 'analytics',
        provider: 'Mixpanel',
        enabled: false,
        status: 'disconnected',
        config: {
            project_token: ''
        }
    },
    {
        id: '7',
        name: 'PayPal',
        category: 'payment',
        provider: 'PayPal',
        enabled: false,
        status: 'disconnected',
        config: {
            client_id: '',
            client_secret: '',
            mode: 'sandbox'
        }
    },
    {
        id: '8',
        name: 'AWS S3',
        category: 'storage',
        provider: 'AWS S3',
        enabled: false,
        status: 'disconnected',
        config: {
            access_key_id: '',
            secret_access_key: '',
            bucket: '',
            region: 'us-east-1'
        }
    }
];

const mockIntegrations = [...MOCK_INTEGRATIONS];

export const integrationConfigService = {
    /**
     * Get all integrations
     */
    async getAll(): Promise<IntegrationConfig[]> {
        if (isMockEnv()) {
            return mockIntegrations;
        }
        
        try {
            const records = await pb.collection('integrations').getFullList<IntegrationConfig>({
                sort: 'category,name',
                requestKey: null
            });
            return records;
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
            return mockIntegrations;
        }
    },

    /**
     * Get integration by ID
     */
    async getById(id: string): Promise<IntegrationConfig | null> {
        if (isMockEnv()) {
            return mockIntegrations.find(i => i.id === id) || null;
        }
        
        try {
            return await pb.collection('integrations').getOne<IntegrationConfig>(id);
        } catch (error) {
            console.error('Failed to fetch integration:', error);
            return null;
        }
    },

    /**
     * Get integrations by category
     */
    async getByCategory(category: IntegrationConfig['category']): Promise<IntegrationConfig[]> {
        if (isMockEnv()) {
            return mockIntegrations.filter(i => i.category === category);
        }
        
        try {
            const records = await pb.collection('integrations').getFullList<IntegrationConfig>({
                filter: `category = "${category}"`,
                sort: 'name',
                requestKey: null
            });
            return records;
        } catch (error) {
            console.error('Failed to fetch integrations by category:', error);
            return mockIntegrations.filter(i => i.category === category);
        }
    },

    /**
     * Toggle integration enabled/disabled
     */
    async toggleEnabled(id: string): Promise<IntegrationConfig | null> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    enabled: !mockIntegrations[index].enabled
                };
                return mockIntegrations[index];
            }
            return null;
        }
        
        try {
            const current = await this.getById(id);
            if (!current) return null;
            
            return await pb.collection('integrations').update<IntegrationConfig>(id, {
                enabled: !current.enabled
            });
        } catch (error) {
            console.error('Failed to toggle integration:', error);
            return null;
        }
    },

    /**
     * Update integration config
     */
    async updateConfig(id: string, config: Record<string, any>): Promise<IntegrationConfig | null> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    config,
                    updated: new Date().toISOString()
                };
                return mockIntegrations[index];
            }
            return null;
        }
        
        try {
            return await pb.collection('integrations').update<IntegrationConfig>(id, { config });
        } catch (error) {
            console.error('Failed to update integration config:', error);
            return null;
        }
    },

    /**
     * Test integration connection
     */
    async testConnection(id: string): Promise<{ success: boolean; message: string }> {
        if (isMockEnv()) {
            const integration = mockIntegrations.find(i => i.id === id);
            if (!integration) {
                return { success: false, message: 'Integration not found' };
            }
            
            // Simulate connection test
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (integration.enabled) {
                // Update last_synced for mock
                const index = mockIntegrations.findIndex(i => i.id === id);
                if (index !== -1) {
                    mockIntegrations[index] = {
                        ...mockIntegrations[index],
                        status: 'connected',
                        last_synced: 'Just now'
                    };
                }
                return { success: true, message: `Successfully connected to ${integration.provider}` };
            }
            return { success: false, message: 'Integration is disabled' };
        }
        
        try {
            const response = await fetch(`/api/integrations/${id}/test`, { method: 'POST' });
            const data = await response.json();
            return data;
        } catch (error) {
            return { success: false, message: 'Connection test failed' };
        }
    },

    /**
     * Update integration status
     */
    async updateStatus(id: string, status: IntegrationConfig['status']): Promise<IntegrationConfig | null> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    status,
                    last_synced: status === 'connected' ? 'Just now' : mockIntegrations[index].last_synced
                };
                return mockIntegrations[index];
            }
            return null;
        }
        
        try {
            return await pb.collection('integrations').update<IntegrationConfig>(id, { 
                status,
                last_synced: status === 'connected' ? new Date().toISOString() : undefined
            });
        } catch (error) {
            console.error('Failed to update integration status:', error);
            return null;
        }
    },

    /**
     * Create new integration
     */
    async create(data: Omit<IntegrationConfig, 'id' | 'created' | 'updated'>): Promise<IntegrationConfig> {
        if (isMockEnv()) {
            const newIntegration: IntegrationConfig = {
                ...data,
                id: Date.now().toString(),
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            mockIntegrations.push(newIntegration);
            return newIntegration;
        }
        
        return await pb.collection('integrations').create<IntegrationConfig>(data);
    },

    /**
     * Delete integration
     */
    async delete(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations.splice(index, 1);
                return true;
            }
            return false;
        }
        
        try {
            await pb.collection('integrations').delete(id);
            return true;
        } catch (error) {
            console.error('Failed to delete integration:', error);
            return false;
        }
    },

    /**
     * Get integration stats
     */
    async getStats(): Promise<{
        total: number;
        enabled: number;
        connected: number;
        byCategory: Record<string, number>;
    }> {
        const integrations = await this.getAll();
        
        const byCategory: Record<string, number> = {};
        integrations.forEach(i => {
            byCategory[i.category] = (byCategory[i.category] || 0) + 1;
        });
        
        return {
            total: integrations.length,
            enabled: integrations.filter(i => i.enabled).length,
            connected: integrations.filter(i => i.status === 'connected').length,
            byCategory
        };
    }
};

export default integrationConfigService;
