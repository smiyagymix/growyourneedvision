import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { auditLog } from '../../services/auditLogger';
import { integrationConfigService, type IntegrationConfig } from '../../services/integrationConfigService';
import { z } from 'zod';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const IntegrationSettings: React.FC = () => {
    const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<'all' | IntegrationConfig['category']>('all');
    const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const data = await integrationConfigService.getAll();
            setIntegrations(data);
        } catch (error) {
            console.error('Failed to load integrations:', error);
        }
        setLoading(false);
    };

    // Email configuration state
    const [emailConfig, setEmailConfig] = useState({
        provider: 'SMTP',
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        username: '',
        password: '',
        from_email: 'noreply@growyourneed.com',
        from_name: 'Grow Your Need'
    });

    // Analytics configuration state
    const [analyticsConfig, setAnalyticsConfig] = useState({
        provider: 'Google Analytics 4',
        tracking_id: '',
        measurement_id: '',
        enable_ecommerce: true,
        enable_user_tracking: true
    });

    // Payment configuration state
    const [paymentConfig, setPaymentConfig] = useState({
        provider: 'Stripe',
        mode: 'test',
        publishable_key: '',
        secret_key: '',
        webhook_secret: '',
        webhook_url: 'https://api.growyourneed.com/webhooks/stripe'
    });

    // Storage configuration state
    const [storageConfig, setStorageConfig] = useState({
        provider: 'MinIO',
        endpoint: 'minio.growyourneed.com',
        access_key: '',
        secret_key: '',
        bucket: 'platform-assets',
        region: 'us-east-1',
        use_ssl: true
    });

    const handleToggleIntegration = async (integrationId: string) => {
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
            try {
                const newState = !integration.enabled;
                await auditLog.settingsChange(
                    `integration.${integration.provider}.enabled`,
                    integration.enabled,
                    newState
                );
                const updated = await integrationConfigService.toggleEnabled(integrationId);
                if (updated) {
                    setIntegrations(integrations.map(i =>
                        i.id === integrationId ? updated : i
                    ));
                }
            } catch (error) {
                console.error('Failed to toggle integration:', error);
                alert('Failed to update integration');
            }
        }
    };

    const handleTestConnection = async (integrationId: string) => {
        const integration = integrations.find(i => i.id === integrationId);
        if (integration) {
            setTestingId(integrationId);
            try {
                const result = await integrationConfigService.testConnection(integrationId);
                if (result.success) {
                    // Update local state with new connection status
                    setIntegrations(integrations.map(i =>
                        i.id === integrationId ? { ...i, status: 'connected', last_synced: 'Just now' } : i
                    ));
                    alert(result.message);
                } else {
                    setIntegrations(integrations.map(i =>
                        i.id === integrationId ? { ...i, status: 'error' } : i
                    ));
                    alert(result.message);
                }
            } catch (error) {
                console.error('Test connection failed:', error);
                alert('Connection test failed');
            }
            setTestingId(null);
        }
    };

    const handleSaveEmailConfig = async () => {
        const { showToast } = useToast();
        const emailIntegration = integrations.find(i => i.category === 'email' && i.provider === 'SMTP');

        // Sanitize
        const sanitized = {
            provider: sanitizeText(emailConfig.provider),
            host: sanitizeText(emailConfig.host),
            port: sanitizeText(emailConfig.port),
            secure: emailConfig.secure,
            username: sanitizeText(emailConfig.username),
            password: emailConfig.password, // Don't sanitize passwords
            from_email: sanitizeText(emailConfig.from_email),
            from_name: sanitizeText(emailConfig.from_name)
        };

        // Validate
        const emailConfigSchema = z.object({
            provider: z.string().min(1),
            host: z.string().min(1, 'Host is required'),
            port: z.string().regex(/^\d+$/, 'Port must be a number'),
            secure: z.boolean(),
            username: z.string().min(1, 'Username is required'),
            password: z.string().min(1, 'Password is required'),
            from_email: emailSchema,
            from_name: z.string().min(1, 'From name is required')
        });

        const result = emailConfigSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        if (emailIntegration) {
            try {
                await integrationConfigService.updateConfig(emailIntegration.id, result.data as any);
                auditLog.settingsChange('integration.email.config', {}, result.data);
                showToast('Email configuration saved successfully!', 'success');
                loadIntegrations();
            } catch (error) {
                showToast('Failed to save email configuration', 'error');
            }
        } else {
            showToast('Email configuration saved successfully!', 'success');
        }
    };

    const handleSaveAnalyticsConfig = async () => {
        const { showToast } = useToast();
        const analyticsIntegration = integrations.find(i => i.category === 'analytics');

        // Sanitize
        const sanitized = {
            provider: sanitizeText(analyticsConfig.provider),
            tracking_id: sanitizeText(analyticsConfig.tracking_id),
            measurement_id: sanitizeText(analyticsConfig.measurement_id),
            enable_ecommerce: analyticsConfig.enable_ecommerce,
            enable_user_tracking: analyticsConfig.enable_user_tracking
        };

        // Validate
        const analyticsConfigSchema = z.object({
            provider: z.string().min(1),
            tracking_id: z.string().min(1, 'Tracking ID is required'),
            measurement_id: z.string().min(1, 'Measurement ID is required'),
            enable_ecommerce: z.boolean(),
            enable_user_tracking: z.boolean()
        });

        const result = analyticsConfigSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        if (analyticsIntegration) {
            try {
                await integrationConfigService.updateConfig(analyticsIntegration.id, result.data as any);
                auditLog.settingsChange('integration.analytics.config', {}, result.data);
                showToast('Analytics configuration saved successfully!', 'success');
                loadIntegrations();
            } catch (error) {
                showToast('Failed to save analytics configuration', 'error');
            }
        } else {
            showToast('Analytics configuration saved successfully!', 'success');
        }
    };

    const handleSavePaymentConfig = async () => {
        const { showToast } = useToast();
        const paymentIntegration = integrations.find(i => i.category === 'payment');
        
        // Sanitize
        const sanitized = {
            provider: sanitizeText(paymentConfig.provider),
            api_key: paymentConfig.api_key, // Don't sanitize keys
            secret_key: paymentConfig.secret_key,
            webhook_secret: paymentConfig.webhook_secret,
            test_mode: paymentConfig.test_mode
        };
        
        // Validate
        const paymentConfigSchema = z.object({
            provider: z.string().min(1, 'Provider is required'),
            api_key: z.string().min(1, 'API key is required'),
            secret_key: z.string().min(1, 'Secret key is required'),
            webhook_secret: z.string().min(1, 'Webhook secret is required'),
            test_mode: z.boolean()
        });
        
        const result = paymentConfigSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        if (paymentIntegration) {
            try {
                await integrationConfigService.updateConfig(paymentIntegration.id, result.data);
                auditLog.settingsChange('integration.payment.config', {}, result.data);
                showToast('Payment configuration saved successfully!', 'success');
                loadIntegrations();
            } catch (error) {
                showToast('Failed to save payment configuration', 'error');
            }
        } else {
            showToast('Payment configuration saved successfully!', 'success');
        }
    };

    const handleSaveStorageConfig = async () => {
        const { showToast } = useToast();
        const storageIntegration = integrations.find(i => i.category === 'storage');
        
        // Sanitize
        const sanitized = {
            provider: sanitizeText(storageConfig.provider),
            bucket_name: sanitizeText(storageConfig.bucket_name),
            region: sanitizeText(storageConfig.region),
            access_key: storageConfig.access_key, // Don't sanitize keys
            secret_key: storageConfig.secret_key,
            endpoint: sanitizeText(storageConfig.endpoint)
        };
        
        // Validate
        const storageConfigSchema = z.object({
            provider: z.string().min(1, 'Provider is required'),
            bucket_name: z.string().min(1, 'Bucket name is required'),
            region: z.string().min(1, 'Region is required'),
            access_key: z.string().min(1, 'Access key is required'),
            secret_key: z.string().min(1, 'Secret key is required'),
            endpoint: z.string().url('Invalid endpoint URL').optional()
        });
        
        const result = storageConfigSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        if (storageIntegration) {
            try {
                await integrationConfigService.updateConfig(storageIntegration.id, result.data);
                auditLog.settingsChange('integration.storage.config', {}, result.data);
                showToast('Storage configuration saved successfully!', 'success');
                loadIntegrations();
            } catch (error) {
                showToast('Failed to save storage configuration', 'error');
            }
        } else {
            showToast('Storage configuration saved successfully!', 'success');
        }
    };

    const filteredIntegrations = integrations.filter(i =>
        activeCategory === 'all' || i.category === activeCategory
    );

    const getCategoryIcon = (category: IntegrationConfig['category']) => {
        switch (category) {
            case 'email': return 'EnvelopeIcon';
            case 'analytics': return 'ChartBarIcon';
            case 'payment': return 'CreditCardIcon';
            case 'storage': return 'CloudIcon';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integration Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Configure external services and APIs</p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={activeCategory === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('all')}
                    name="filter-all"
                >
                    All Integrations
                </Button>
                <Button
                    variant={activeCategory === 'email' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('email')}
                    name="filter-email"
                >
                    <Icon name="EnvelopeIcon" className="w-4 h-4 mr-2" />
                    Email
                </Button>
                <Button
                    variant={activeCategory === 'analytics' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('analytics')}
                    name="filter-analytics"
                >
                    <Icon name="ChartBarIcon" className="w-4 h-4 mr-2" />
                    Analytics
                </Button>
                <Button
                    variant={activeCategory === 'payment' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('payment')}
                    name="filter-payment"
                >
                    <Icon name="CreditCardIcon" className="w-4 h-4 mr-2" />
                    Payment
                </Button>
                <Button
                    variant={activeCategory === 'storage' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('storage')}
                    name="filter-storage"
                >
                    <Icon name="CloudIcon" className="w-4 h-4 mr-2" />
                    Storage
                </Button>
            </div>

            {/* Integrations Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.category === 'email' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                        integration.category === 'analytics' ? 'bg-orange-100 dark:bg-orange-900/20' :
                                            integration.category === 'payment' ? 'bg-green-100 dark:bg-green-900/20' :
                                                'bg-purple-100 dark:bg-purple-900/20'
                                    }`}>
                                    <Icon name={getCategoryIcon(integration.category)} className={`w-6 h-6 ${integration.category === 'email' ? 'text-blue-600' :
                                            integration.category === 'analytics' ? 'text-orange-600' :
                                                integration.category === 'payment' ? 'text-green-600' :
                                                    'text-purple-600'
                                        }`} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{integration.name}</h4>
                                    <p className="text-sm text-gray-500">{integration.provider}</p>
                                </div>
                            </div>
                            <Badge variant={integration.status === 'connected' ? 'success' : integration.status === 'error' ? 'danger' : 'secondary'}>
                                {integration.status}
                            </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Enabled</span>
                                <button
                                    onClick={() => handleToggleIntegration(integration.id)}
                                    name="toggle-integration"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${integration.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${integration.enabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {integration.last_synced && (
                                <div className="text-xs text-gray-500">
                                    Last synced: {integration.last_synced}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleTestConnection(integration.id)}
                                name="test-integration"
                            >
                                Test
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setEditingIntegration(integration)}
                                name="configure-integration"
                            >
                                Configure
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Email Configuration Form */}
            {(activeCategory === 'all' || activeCategory === 'email') && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="EnvelopeIcon" className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                SMTP Host
                            </label>
                            <input
                                type="text"
                                name="smtp-host"
                                value={emailConfig.host}
                                onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="smtp.gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Port
                            </label>
                            <input
                                type="text"
                                name="smtp-port"
                                value={emailConfig.port}
                                onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="587"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="smtp-username"
                                value={emailConfig.username}
                                onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="your-email@gmail.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password / App Password
                            </label>
                            <input
                                type="password"
                                name="smtp-password"
                                value={emailConfig.password}
                                onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                From Email
                            </label>
                            <input
                                type="email"
                                name="from-email"
                                value={emailConfig.from_email}
                                onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="noreply@yourdomain.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                From Name
                            </label>
                            <input
                                type="text"
                                name="from-name"
                                value={emailConfig.from_name}
                                onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="Grow Your Need"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="email-use-tls"
                                checked={emailConfig.secure}
                                onChange={(e) => setEmailConfig({ ...emailConfig, secure: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Use TLS/SSL</span>
                        </label>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button variant="primary" onClick={handleSaveEmailConfig} name="save-email-config">
                            Save Email Configuration
                        </Button>
                        <Button variant="outline" name="send-test-email">Send Test Email</Button>
                    </div>
                </Card>
            )}

            {/* Analytics Configuration Form */}
            {(activeCategory === 'all' || activeCategory === 'analytics') && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="ChartBarIcon" className="w-6 h-6 text-orange-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analytics Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tracking ID (GA4)
                            </label>
                            <input
                                type="text"
                                name="tracking-id"
                                value={analyticsConfig.tracking_id}
                                onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, tracking_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="G-XXXXXXXXX"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Measurement ID
                            </label>
                            <input
                                type="text"
                                name="measurement-id"
                                value={analyticsConfig.measurement_id}
                                onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, measurement_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="G-XXXXXXXXX"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 mt-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="enable-ecommerce"
                                checked={analyticsConfig.enable_ecommerce}
                                onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, enable_ecommerce: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable E-commerce Tracking</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="enable-user-tracking"
                                checked={analyticsConfig.enable_user_tracking}
                                onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, enable_user_tracking: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable User ID Tracking</span>
                        </label>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button variant="primary" onClick={handleSaveAnalyticsConfig} name="save-analytics-config">
                            Save Analytics Configuration
                        </Button>
                        <Button variant="outline" name="view-reports">View Reports</Button>
                    </div>
                </Card>
            )}

            {/* Payment Configuration Form */}
            {(activeCategory === 'all' || activeCategory === 'payment') && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="CreditCardIcon" className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Gateway Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mode
                            </label>
                            <select
                                name="payment-mode"
                                value={paymentConfig.mode}
                                onChange={(e) => setPaymentConfig({ ...paymentConfig, mode: e.target.value as 'test' | 'live' })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            >
                                <option value="test">Test Mode</option>
                                <option value="live">Live Mode</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Publishable Key
                            </label>
                            <input
                                type="text"
                                name="publishable-key"
                                value={paymentConfig.publishable_key}
                                onChange={(e) => setPaymentConfig({ ...paymentConfig, publishable_key: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="pk_test_..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                name="payment-secret-key"
                                value={paymentConfig.secret_key}
                                onChange={(e) => setPaymentConfig({ ...paymentConfig, secret_key: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="sk_test_..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Webhook Secret
                            </label>
                            <input
                                type="password"
                                name="webhook-secret"
                                value={paymentConfig.webhook_secret}
                                onChange={(e) => setPaymentConfig({ ...paymentConfig, webhook_secret: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="whsec_..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Webhook URL
                            </label>
                            <input
                                type="text"
                                name="webhook-url"
                                value={paymentConfig.webhook_url}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button variant="primary" onClick={handleSavePaymentConfig} name="save-payment-config">
                            Save Payment Configuration
                        </Button>
                        <Button variant="outline" name="test-payment-connection">Test Connection</Button>
                    </div>
                </Card>
            )}

            {/* Storage Configuration Form */}
            {(activeCategory === 'all' || activeCategory === 'storage') && (
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Icon name="CloudIcon" className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cloud Storage Configuration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Endpoint
                            </label>
                            <input
                                type="text"
                                name="storage-endpoint"
                                value={storageConfig.endpoint}
                                onChange={(e) => setStorageConfig({ ...storageConfig, endpoint: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="minio.yourdomain.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Region
                            </label>
                            <input
                                type="text"
                                name="storage-region"
                                value={storageConfig.region}
                                onChange={(e) => setStorageConfig({ ...storageConfig, region: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="us-east-1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Access Key
                            </label>
                            <input
                                type="text"
                                name="storage-access-key"
                                value={storageConfig.access_key}
                                onChange={(e) => setStorageConfig({ ...storageConfig, access_key: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="AKIA..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Secret Key
                            </label>
                            <input
                                type="password"
                                name="storage-secret-key"
                                value={storageConfig.secret_key}
                                onChange={(e) => setStorageConfig({ ...storageConfig, secret_key: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bucket Name
                            </label>
                            <input
                                type="text"
                                name="storage-bucket"
                                value={storageConfig.bucket}
                                onChange={(e) => setStorageConfig({ ...storageConfig, bucket: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                placeholder="platform-assets"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="storage-use-ssl"
                                checked={storageConfig.use_ssl}
                                onChange={(e) => setStorageConfig({ ...storageConfig, use_ssl: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Use SSL/TLS</span>
                        </label>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t">
                        <Button variant="primary" onClick={handleSaveStorageConfig} name="save-storage-config">
                            Save Storage Configuration
                        </Button>
                        <Button variant="outline" name="test-storage-connection">Test Connection</Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default IntegrationSettings;
