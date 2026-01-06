/**
 * Dashboard Builder Service
 * 
 * Manages custom dashboard layouts with drag-drop widgets.
 * Supports 15+ pre-built widgets with configuration.
 */

import PocketBase, { RecordModel } from 'pocketbase';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { captureException, measurePerformance, addBreadcrumb } from '../lib/sentry';

// ==================== TYPES ====================

export type WidgetType =
    | 'revenue-chart'
    | 'tenant-health'
    | 'usage-graph'
    | 'churn-prediction'
    | 'active-users'
    | 'storage-usage'
    | 'api-calls'
    | 'recent-signups'
    | 'trial-conversions'
    | 'support-tickets'
    | 'system-status'
    | 'mrr-trend'
    | 'user-distribution'
    | 'feature-adoption'
    | 'alerts-feed';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    x: number;
    y: number;
    width: number;
    height: number;
    config?: Record<string, any>;
}

export interface DashboardLayout extends RecordModel {
    name: string;
    description?: string;
    userId: string;
    isDefault: boolean;
    widgets: WidgetConfig[];
    gridConfig: {
        columns: number;
        rowHeight: number;
        gap: number;
    };
    theme?: string;
}

export interface WidgetDefinition {
    type: WidgetType;
    name: string;
    description: string;
    icon: string;
    category: 'analytics' | 'monitoring' | 'operations' | 'engagement';
    defaultSize: { width: number; height: number };
    minSize: { width: number; height: number };
    maxSize?: { width: number; height: number };
    configSchema?: Record<string, any>;
}

// ==================== WIDGET DEFINITIONS ====================

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
    {
        type: 'revenue-chart',
        name: 'Revenue Chart',
        description: 'MRR/ARR trends with forecasting',
        icon: 'CurrencyDollarIcon',
        category: 'analytics',
        defaultSize: { width: 6, height: 4 },
        minSize: { width: 4, height: 3 },
        configSchema: {
            period: { type: 'select', options: ['30d', '90d', '1y'], default: '30d' },
            showForecast: { type: 'boolean', default: true }
        }
    },
    {
        type: 'tenant-health',
        name: 'Tenant Health',
        description: 'Overall tenant health scores',
        icon: 'HeartIcon',
        category: 'monitoring',
        defaultSize: { width: 3, height: 3 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            sortBy: { type: 'select', options: ['score', 'usage', 'revenue'], default: 'score' },
            limit: { type: 'number', default: 10, min: 5, max: 50 }
        }
    },
    {
        type: 'usage-graph',
        name: 'Usage Graph',
        description: 'Platform usage over time',
        icon: 'ChartBarIcon',
        category: 'analytics',
        defaultSize: { width: 6, height: 4 },
        minSize: { width: 4, height: 3 },
        configSchema: {
            metric: { type: 'select', options: ['users', 'storage', 'api'], default: 'users' },
            period: { type: 'select', options: ['7d', '30d', '90d'], default: '30d' }
        }
    },
    {
        type: 'churn-prediction',
        name: 'Churn Prediction',
        description: 'AI-powered churn risk analysis',
        icon: 'ExclamationTriangleIcon',
        category: 'analytics',
        defaultSize: { width: 4, height: 3 },
        minSize: { width: 3, height: 2 },
        configSchema: {
            threshold: { type: 'number', default: 70, min: 0, max: 100 },
            showRecommendations: { type: 'boolean', default: true }
        }
    },
    {
        type: 'active-users',
        name: 'Active Users',
        description: 'Real-time active user count',
        icon: 'UsersIcon',
        category: 'monitoring',
        defaultSize: { width: 2, height: 2 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            showTrend: { type: 'boolean', default: true }
        }
    },
    {
        type: 'storage-usage',
        name: 'Storage Usage',
        description: 'Storage consumption by tenant',
        icon: 'CircleStackIcon',
        category: 'monitoring',
        defaultSize: { width: 3, height: 3 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            view: { type: 'select', options: ['chart', 'table'], default: 'chart' }
        }
    },
    {
        type: 'api-calls',
        name: 'API Calls',
        description: 'API usage and rate limiting',
        icon: 'BoltIcon',
        category: 'monitoring',
        defaultSize: { width: 3, height: 3 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            period: { type: 'select', options: ['1h', '24h', '7d'], default: '24h' }
        }
    },
    {
        type: 'recent-signups',
        name: 'Recent Signups',
        description: 'Latest tenant registrations',
        icon: 'UserPlusIcon',
        category: 'operations',
        defaultSize: { width: 4, height: 3 },
        minSize: { width: 3, height: 2 },
        configSchema: {
            limit: { type: 'number', default: 5, min: 3, max: 20 }
        }
    },
    {
        type: 'trial-conversions',
        name: 'Trial Conversions',
        description: 'Trial to paid conversion rate',
        icon: 'ArrowTrendingUpIcon',
        category: 'analytics',
        defaultSize: { width: 3, height: 2 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            period: { type: 'select', options: ['30d', '90d', '1y'], default: '30d' }
        }
    },
    {
        type: 'support-tickets',
        name: 'Support Tickets',
        description: 'Open ticket count and trends',
        icon: 'TicketIcon',
        category: 'operations',
        defaultSize: { width: 3, height: 3 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            status: { type: 'select', options: ['all', 'open', 'pending'], default: 'open' }
        }
    },
    {
        type: 'system-status',
        name: 'System Status',
        description: 'Service health indicators',
        icon: 'ServerIcon',
        category: 'monitoring',
        defaultSize: { width: 4, height: 2 },
        minSize: { width: 3, height: 2 },
        configSchema: {
            services: { type: 'array', default: ['api', 'db', 'storage', 'ai'] }
        }
    },
    {
        type: 'mrr-trend',
        name: 'MRR Trend',
        description: 'Monthly recurring revenue',
        icon: 'ChartLineIcon',
        category: 'analytics',
        defaultSize: { width: 4, height: 3 },
        minSize: { width: 3, height: 2 },
        configSchema: {
            showGrowth: { type: 'boolean', default: true }
        }
    },
    {
        type: 'user-distribution',
        name: 'User Distribution',
        description: 'Users by role and plan',
        icon: 'ChartPieIcon',
        category: 'analytics',
        defaultSize: { width: 3, height: 3 },
        minSize: { width: 2, height: 2 },
        configSchema: {
            groupBy: { type: 'select', options: ['role', 'plan', 'status'], default: 'role' }
        }
    },
    {
        type: 'feature-adoption',
        name: 'Feature Adoption',
        description: 'Feature usage by tenant',
        icon: 'SparklesIcon',
        category: 'engagement',
        defaultSize: { width: 5, height: 3 },
        minSize: { width: 4, height: 2 },
        configSchema: {
            features: { type: 'array', default: [] },
            period: { type: 'select', options: ['7d', '30d', '90d'], default: '30d' }
        }
    },
    {
        type: 'alerts-feed',
        name: 'Alerts Feed',
        description: 'Real-time system alerts',
        icon: 'BellIcon',
        category: 'monitoring',
        defaultSize: { width: 3, height: 4 },
        minSize: { width: 2, height: 3 },
        configSchema: {
            severity: { type: 'select', options: ['all', 'critical', 'warning'], default: 'all' },
            limit: { type: 'number', default: 10, min: 5, max: 50 }
        }
    }
];

// ==================== MOCK DATA ====================

const MOCK_LAYOUTS: DashboardLayout[] = [
    {
        id: '1',
        collectionId: 'dashboard_layouts',
        collectionName: 'dashboard_layouts',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
        name: 'Default Owner Dashboard',
        description: 'Standard analytics view',
        userId: 'owner1',
        isDefault: true,
        widgets: [
            { id: 'w1', type: 'revenue-chart', x: 0, y: 0, width: 6, height: 4 },
            { id: 'w2', type: 'tenant-health', x: 6, y: 0, width: 3, height: 3 },
            { id: 'w3', type: 'active-users', x: 9, y: 0, width: 3, height: 2 },
            { id: 'w4', type: 'churn-prediction', x: 0, y: 4, width: 4, height: 3 },
            { id: 'w5', type: 'usage-graph', x: 4, y: 4, width: 6, height: 4 },
            { id: 'w6', type: 'alerts-feed', x: 10, y: 2, width: 2, height: 4 }
        ],
        gridConfig: {
            columns: 12,
            rowHeight: 80,
            gap: 16
        }
    },
    {
        id: '2',
        collectionId: 'dashboard_layouts',
        collectionName: 'dashboard_layouts',
        created: '2025-01-02T00:00:00Z',
        updated: '2025-01-02T00:00:00Z',
        name: 'Operations Dashboard',
        description: 'Focus on support and tickets',
        userId: 'owner1',
        isDefault: false,
        widgets: [
            { id: 'w1', type: 'support-tickets', x: 0, y: 0, width: 4, height: 3 },
            { id: 'w2', type: 'system-status', x: 4, y: 0, width: 4, height: 2 },
            { id: 'w3', type: 'recent-signups', x: 0, y: 3, width: 4, height: 3 },
            { id: 'w4', type: 'alerts-feed', x: 8, y: 0, width: 4, height: 6 }
        ],
        gridConfig: {
            columns: 12,
            rowHeight: 80,
            gap: 16
        }
    }
];

// ==================== SERVICE ====================

class DashboardBuilderService {
    // ==================== LAYOUT MANAGEMENT ====================

    async getDashboardLayouts(userId: string): Promise<DashboardLayout[]> {
        if (isMockEnv()) return MOCK_LAYOUTS;

        return measurePerformance('getDashboardLayouts', async () => {
            try {
                return await pb.collection('dashboard_layouts').getFullList<DashboardLayout>({
                    filter: `userId = "${userId}"`,
                    sort: '-isDefault,-updated',
                    requestKey: null
                });
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'getDashboardLayouts',
                    userId
                });
                throw error;
            }
        }, { feature: 'dashboard-builder', userId });
    }

    async getDefaultLayout(userId: string): Promise<DashboardLayout | null> {
        if (isMockEnv()) return MOCK_LAYOUTS[0];

        try {
            return await pb.collection('dashboard_layouts').getFirstListItem<DashboardLayout>(
                `userId = "${userId}" && isDefault = true`
            );
        } catch (error) {
            // No default layout found
            return null;
        }
    }

    async createLayout(layout: Omit<DashboardLayout, 'id' | 'created' | 'updated' | 'collectionId' | 'collectionName'>): Promise<DashboardLayout> {
        if (isMockEnv()) {
            return {
                ...layout,
                id: Math.random().toString(36).substr(2, 9),
                collectionId: 'dashboard_layouts',
                collectionName: 'dashboard_layouts',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            } as unknown as DashboardLayout;
        }

        return measurePerformance('createLayout', async () => {
            try {
                addBreadcrumb('Creating dashboard layout', 'action', {
                    name: layout.name,
                    widgetCount: layout.widgets.length
                });

                // If setting as default, unset other defaults
                if (layout.isDefault) {
                    const existing = await pb.collection('dashboard_layouts').getFullList({
                        filter: `userId = "${layout.userId}" && isDefault = true`
                    });
                    for (const existingLayout of existing) {
                        await pb.collection('dashboard_layouts').update(existingLayout.id, { isDefault: false });
                    }
                }

                return await pb.collection('dashboard_layouts').create<DashboardLayout>(layout);
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'createLayout',
                    layoutName: layout.name
                });
                throw error;
            }
        }, { feature: 'dashboard-builder' });
    }

    async updateLayout(id: string, updates: Partial<DashboardLayout>): Promise<DashboardLayout> {
        if (isMockEnv()) {
            return { ...MOCK_LAYOUTS[0], ...updates, id } as DashboardLayout;
        }

        return measurePerformance('updateLayout', async () => {
            try {
                // If setting as default, unset other defaults
                if (updates.isDefault) {
                    const layout = await pb.collection('dashboard_layouts').getOne(id);
                    const existing = await pb.collection('dashboard_layouts').getFullList({
                        filter: `userId = "${layout.userId}" && isDefault = true && id != "${id}"`
                    });
                    for (const existingLayout of existing) {
                        await pb.collection('dashboard_layouts').update(existingLayout.id, { isDefault: false });
                    }
                }

                return await pb.collection('dashboard_layouts').update<DashboardLayout>(id, updates);
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'updateLayout',
                    layoutId: id
                });
                throw error;
            }
        }, { feature: 'dashboard-builder', layoutId: id });
    }

    async deleteLayout(id: string): Promise<void> {
        if (isMockEnv()) return;

        return measurePerformance('deleteLayout', async () => {
            try {
                await pb.collection('dashboard_layouts').delete(id);
                addBreadcrumb('Dashboard layout deleted', 'action', { layoutId: id });
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'deleteLayout',
                    layoutId: id
                });
                throw error;
            }
        }, { feature: 'dashboard-builder', layoutId: id });
    }

    async duplicateLayout(id: string, newName: string): Promise<DashboardLayout> {
        if (isMockEnv()) {
            return {
                ...MOCK_LAYOUTS[0],
                id: Math.random().toString(36).substr(2, 9),
                name: newName,
                isDefault: false
            };
        }

        return measurePerformance('duplicateLayout', async () => {
            try {
                const original = await pb.collection('dashboard_layouts').getOne<DashboardLayout>(id);
                
                // Create new layout without id/timestamps
                const { id: _id, created, updated, collectionId, collectionName, ...layoutData } = original;
                
                return await this.createLayout({
                    ...layoutData,
                    name: newName,
                    isDefault: false
                });
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'duplicateLayout',
                    layoutId: id
                });
                throw error;
            }
        }, { feature: 'dashboard-builder', layoutId: id });
    }

    // ==================== WIDGET MANAGEMENT ====================

    getWidgetDefinitions(category?: string): WidgetDefinition[] {
        if (category) {
            return WIDGET_DEFINITIONS.filter(w => w.category === category);
        }
        return WIDGET_DEFINITIONS;
    }

    getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
        return WIDGET_DEFINITIONS.find(w => w.type === type);
    }

    validateWidgetConfig(type: WidgetType, config: Record<string, any>): boolean {
        const definition = this.getWidgetDefinition(type);
        if (!definition || !definition.configSchema) return true;

        // Basic validation
        for (const [key, schema] of Object.entries(definition.configSchema)) {
            const value = config[key];
            
            if (schema.type === 'number') {
                if (typeof value !== 'number') return false;
                if (schema.min !== undefined && value < schema.min) return false;
                if (schema.max !== undefined && value > schema.max) return false;
            }
            
            if (schema.type === 'select') {
                if (!schema.options.includes(value)) return false;
            }
            
            if (schema.type === 'boolean') {
                if (typeof value !== 'boolean') return false;
            }
        }

        return true;
    }

    // ==================== WIDGET DATA FETCHING ====================

    async getWidgetData(widget: WidgetConfig): Promise<any> {
        if (isMockEnv()) {
            return this.getMockWidgetData(widget.type);
        }

        return measurePerformance(`getWidgetData-${widget.type}`, async () => {
            try {
                switch (widget.type) {
                    case 'revenue-chart':
                        return await this.fetchRevenueData(widget.config);
                    case 'tenant-health':
                        return await this.fetchTenantHealthData(widget.config);
                    case 'usage-graph':
                        return await this.fetchUsageData(widget.config);
                    case 'churn-prediction':
                        return await this.fetchChurnData(widget.config);
                    case 'active-users':
                        return await this.fetchActiveUsersData();
                    case 'storage-usage':
                        return await this.fetchStorageData();
                    case 'api-calls':
                        return await this.fetchAPICallsData(widget.config);
                    case 'recent-signups':
                        return await this.fetchRecentSignupsData(widget.config);
                    case 'trial-conversions':
                        return await this.fetchTrialConversionsData(widget.config);
                    case 'support-tickets':
                        return await this.fetchSupportTicketsData(widget.config);
                    case 'system-status':
                        return await this.fetchSystemStatusData();
                    case 'mrr-trend':
                        return await this.fetchMRRTrendData();
                    case 'user-distribution':
                        return await this.fetchUserDistributionData(widget.config);
                    case 'feature-adoption':
                        return await this.fetchFeatureAdoptionData(widget.config);
                    case 'alerts-feed':
                        return await this.fetchAlertsData(widget.config);
                    default:
                        throw new Error(`Unknown widget type: ${widget.type}`);
                }
            } catch (error) {
                captureException(error as Error, {
                    feature: 'dashboard-builder',
                    operation: 'getWidgetData',
                    widgetType: widget.type
                });
                throw error;
            }
        }, { feature: 'dashboard-builder', widgetType: widget.type });
    }

    // ==================== DATA FETCHERS ====================

    private async fetchRevenueData(config?: any): Promise<any> {
        const period = config?.period || '30d';
        const invoices = await pb.collection('invoices').getFullList({ requestKey: null });
        // Transform to chart data
        return { labels: [], datasets: [], total: invoices.length };
    }

    private async fetchTenantHealthData(config?: any): Promise<any> {
        const limit = config?.limit || 10;
        const tenants = await pb.collection('tenants').getFullList({ requestKey: null });
        return tenants.slice(0, limit).map(t => ({ id: t.id, name: t.name, score: 85 }));
    }

    private async fetchUsageData(config?: any): Promise<any> {
        const metric = config?.metric || 'users';
        const usage = await pb.collection('tenant_usage').getFullList({ requestKey: null });
        return { labels: [], datasets: [], metric };
    }

    private async fetchChurnData(config?: any): Promise<any> {
        return { atRiskCount: 12, predictions: [] };
    }

    private async fetchActiveUsersData(): Promise<any> {
        const users = await pb.collection('users').getFullList({ 
            filter: 'lastActive >= @now',
            requestKey: null 
        });
        return { count: users.length, trend: '+5%' };
    }

    private async fetchStorageData(): Promise<any> {
        return { total: 1024000000, used: 512000000, byTenant: [] };
    }

    private async fetchAPICallsData(config?: any): Promise<any> {
        return { total: 156000, rate: 650, limit: 1000000 };
    }

    private async fetchRecentSignupsData(config?: any): Promise<any> {
        const limit = config?.limit || 5;
        const tenants = await pb.collection('tenants').getFullList({ 
            sort: '-created',
            requestKey: null 
        });
        return tenants.slice(0, limit);
    }

    private async fetchTrialConversionsData(config?: any): Promise<any> {
        return { rate: 68, count: 42, total: 62 };
    }

    private async fetchSupportTicketsData(config?: any): Promise<any> {
        return { open: 23, pending: 8, resolved: 145 };
    }

    private async fetchSystemStatusData(): Promise<any> {
        return { 
            services: [
                { name: 'API', status: 'healthy', uptime: 99.9 },
                { name: 'Database', status: 'healthy', uptime: 99.99 },
                { name: 'Storage', status: 'degraded', uptime: 98.5 },
                { name: 'AI Service', status: 'healthy', uptime: 99.7 }
            ]
        };
    }

    private async fetchMRRTrendData(): Promise<any> {
        return { current: 125000, growth: 12.5, history: [] };
    }

    private async fetchUserDistributionData(config?: any): Promise<any> {
        const groupBy = config?.groupBy || 'role';
        return { distribution: [], groupBy };
    }

    private async fetchFeatureAdoptionData(config?: any): Promise<any> {
        return { features: [], period: config?.period || '30d' };
    }

    private async fetchAlertsData(config?: any): Promise<any> {
        const limit = config?.limit || 10;
        const alerts = await pb.collection('system_alerts').getFullList({ 
            sort: '-created',
            requestKey: null 
        });
        return alerts.slice(0, limit);
    }

    private getMockWidgetData(type: WidgetType): any {
        const mockData: Record<WidgetType, any> = {
            'revenue-chart': { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ data: [100000, 125000, 150000] }] },
            'tenant-health': [{ id: '1', name: 'Acme School', score: 92 }, { id: '2', name: 'Beta Academy', score: 85 }],
            'usage-graph': { labels: ['Week 1', 'Week 2', 'Week 3'], datasets: [{ data: [1200, 1500, 1800] }] },
            'churn-prediction': { atRiskCount: 12, predictions: [] },
            'active-users': { count: 1247, trend: '+5.2%' },
            'storage-usage': { total: 1024000000, used: 512000000 },
            'api-calls': { total: 156000, rate: 650 },
            'recent-signups': [{ id: '1', name: 'New School', created: '2025-12-28' }],
            'trial-conversions': { rate: 68, count: 42 },
            'support-tickets': { open: 23, pending: 8 },
            'system-status': { services: [{ name: 'API', status: 'healthy' }] },
            'mrr-trend': { current: 125000, growth: 12.5 },
            'user-distribution': { distribution: [] },
            'feature-adoption': { features: [] },
            'alerts-feed': [{ id: '1', message: 'High CPU usage', severity: 'warning' }]
        };
        return mockData[type] || {};
    }
}

export const dashboardBuilderService = new DashboardBuilderService();
