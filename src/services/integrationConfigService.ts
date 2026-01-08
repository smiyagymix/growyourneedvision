import { pocketBaseClient } from '../lib/pocketbase';
import { createTypedCollection } from '../lib/pocketbase-types';
import { isMockEnv } from '../utils/mockData';
import env from '../config/environment';
import { Result, Ok, Err, Option, Some, None } from '../lib/types';
import { AppError, ValidationError } from './errorHandler';
import { IntegrationConfigData } from '../types/integration';

export interface IntegrationConfig {
    id: string;
    name: string;
    category: 'email' | 'analytics' | 'payment' | 'storage';
    provider: string;
    enabled: boolean;
    status: 'connected' | 'disconnected' | 'error';
    config: IntegrationConfigData;
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
            tracking_id: env.get('googleAnalyticsId') || 'G-XXXXXXXXX',
            measurement_id: env.get('googleAnalyticsId') || 'G-XXXXXXXXX'
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

class IntegrationConfigService {
    private pb = pocketBaseClient.getRawClient();
    private integrationService = createTypedCollection<IntegrationConfig>(this.pb, 'integrations');

    /**
     * Get all integrations
     */
    async getAll(): Promise<Result<IntegrationConfig[], AppError>> {
        if (isMockEnv()) {
            return Ok(mockIntegrations);
        }
        
        try {
            const result = await this.integrationService.getFullList({
                sort: 'category,name',
                requestKey: null
            });
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to fetch integrations',
                'INTEGRATIONS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Get integration by ID
     */
    async getById(id: string): Promise<Option<IntegrationConfig>> {
        if (isMockEnv()) {
            const integration = mockIntegrations.find(i => i.id === id);
            return integration ? Some(integration) : None();
        }
        
        try {
            const result = await this.integrationService.getOne(id);
            if (result.success) {
                return Some(result.data);
            }
            return None();
        } catch (error) {
            console.error('Failed to fetch integration:', error);
            return None();
        }
    }

    /**
     * Get integrations by category
     */
    async getByCategory(category: IntegrationConfig['category']): Promise<Result<IntegrationConfig[], AppError>> {
        if (isMockEnv()) {
            return Ok(mockIntegrations.filter(i => i.category === category));
        }
        
        try {
            const result = await this.integrationService.getFullList({
                filter: `category = "${category}"`,
                sort: 'name',
                requestKey: null
            });
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to fetch integrations by category',
                'INTEGRATIONS_FETCH_FAILED',
                500
            ));
        }
    }

    /**
     * Toggle integration enabled/disabled
     */
    async toggleEnabled(id: string): Promise<Result<IntegrationConfig, AppError>> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    enabled: !mockIntegrations[index].enabled
                };
                return Ok(mockIntegrations[index]);
            }
            return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
        }
        
        try {
            const currentOption = await this.getById(id);
            if (!currentOption.some) {
                return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
            }
            const current = currentOption.value;
            
            const result = await this.integrationService.update(id, {
                enabled: !current.enabled
            } as Partial<IntegrationConfig>);
            
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to toggle integration',
                'INTEGRATION_TOGGLE_FAILED',
                500
            ));
        }
    }

    /**
     * Update integration config
     */
    async updateConfig(id: string, config: Partial<IntegrationConfigData>): Promise<Result<IntegrationConfig, AppError>> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    config: { ...mockIntegrations[index].config, ...config } as IntegrationConfigData,
                    updated: new Date().toISOString()
                };
                return Ok(mockIntegrations[index]);
            }
            return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
        }
        
        try {
            const result = await this.integrationService.update(id, { 
                config: config as IntegrationConfigData
            } as Partial<IntegrationConfig>);
            
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to update integration config',
                'INTEGRATION_UPDATE_FAILED',
                500
            ));
        }
    }

    /**
     * Test integration connection
     */
    async testConnection(id: string): Promise<Result<{ message: string }, AppError>> {
        if (isMockEnv()) {
            const integration = mockIntegrations.find(i => i.id === id);
            if (!integration) {
                return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
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
                return Ok({ message: `Successfully connected to ${integration.provider}` });
            }
            return Err(new AppError('Integration is disabled', 'INTEGRATION_DISABLED', 400));
        }
        
        try {
            const response = await fetch(`/api/integrations/${id}/test`, { method: 'POST' });
            const data = await response.json() as { success: boolean; message: string };
            
            if (data.success) {
                return Ok({ message: data.message });
            }
            return Err(new AppError(data.message, 'CONNECTION_TEST_FAILED', 500));
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Connection test failed',
                'CONNECTION_TEST_FAILED',
                500
            ));
        }
    }

    /**
     * Update integration status
     */
    async updateStatus(id: string, status: IntegrationConfig['status']): Promise<Result<IntegrationConfig, AppError>> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations[index] = {
                    ...mockIntegrations[index],
                    status,
                    last_synced: status === 'connected' ? 'Just now' : mockIntegrations[index].last_synced
                };
                return Ok(mockIntegrations[index]);
            }
            return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
        }
        
        try {
            const result = await this.integrationService.update(id, { 
                status,
                last_synced: status === 'connected' ? new Date().toISOString() : undefined
            } as Partial<IntegrationConfig>);
            
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to update integration status',
                'INTEGRATION_UPDATE_FAILED',
                500
            ));
        }
    }

    /**
     * Create new integration
     */
    async create(data: Omit<IntegrationConfig, 'id' | 'created' | 'updated'>): Promise<Result<IntegrationConfig, AppError>> {
        if (isMockEnv()) {
            const newIntegration: IntegrationConfig = {
                ...data,
                id: Date.now().toString(),
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            mockIntegrations.push(newIntegration);
            return Ok(newIntegration);
        }
        
        try {
            const result = await this.integrationService.create(data as Partial<IntegrationConfig>);
            if (result.success) {
                return Ok(result.data);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to create integration',
                'INTEGRATION_CREATE_FAILED',
                500
            ));
        }
    }

    /**
     * Delete integration
     */
    async delete(id: string): Promise<Result<boolean, AppError>> {
        if (isMockEnv()) {
            const index = mockIntegrations.findIndex(i => i.id === id);
            if (index !== -1) {
                mockIntegrations.splice(index, 1);
                return Ok(true);
            }
            return Err(new AppError('Integration not found', 'NOT_FOUND', 404));
        }
        
        try {
            const result = await this.integrationService.delete(id);
            if (result.success) {
                return Ok(true);
            }
            return result;
        } catch (error) {
            if (error instanceof AppError) {
                return Err(error);
            }
            return Err(new AppError(
                error instanceof Error ? error.message : 'Failed to delete integration',
                'INTEGRATION_DELETE_FAILED',
                500
            ));
        }
    }

    /**
     * Get integration stats
     */
    async getStats(): Promise<Result<{
        total: number;
        enabled: number;
        connected: number;
        byCategory: Record<string, number>;
    }, AppError>> {
        const integrationsResult = await this.getAll();
        if (!integrationsResult.success) {
            return integrationsResult;
        }
        
        const integrations = integrationsResult.data;
        const byCategory: Record<string, number> = {};
        integrations.forEach(i => {
            byCategory[i.category] = (byCategory[i.category] || 0) + 1;
        });
        
        return Ok({
            total: integrations.length,
            enabled: integrations.filter(i => i.enabled).length,
            connected: integrations.filter(i => i.status === 'connected').length,
            byCategory
        });
    }
}

export const integrationConfigService = new IntegrationConfigService();
