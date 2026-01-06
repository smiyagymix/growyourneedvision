import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';

interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    auth_required: boolean;
    rate_limit: string;
}

const APIDocumentationViewer: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<'tenants' | 'users' | 'billing' | 'analytics'>('tenants');

    const endpoints: Record<string, APIEndpoint[]> = {
        tenants: [
            { method: 'GET', path: '/api/v1/tenants', description: 'List all tenants', auth_required: true, rate_limit: '100/min' },
            { method: 'POST', path: '/api/v1/tenants', description: 'Create new tenant', auth_required: true, rate_limit: '10/min' },
            { method: 'GET', path: '/api/v1/tenants/:id', description: 'Get tenant details', auth_required: true, rate_limit: '100/min' },
            { method: 'PUT', path: '/api/v1/tenants/:id', description: 'Update tenant', auth_required: true, rate_limit: '50/min' },
            { method: 'DELETE', path: '/api/v1/tenants/:id', description: 'Delete tenant', auth_required: true, rate_limit: '10/min' },
        ],
        users: [
            { method: 'GET', path: '/api/v1/users', description: 'List all users', auth_required: true, rate_limit: '100/min' },
            { method: 'POST', path: '/api/v1/users', description: 'Create new user', auth_required: true, rate_limit: '50/min' },
        ],
        billing: [
            { method: 'GET', path: '/api/v1/invoices', description: 'List all invoices', auth_required: true, rate_limit: '100/min' },
            { method: 'POST', path: '/api/v1/payments', description: 'Process payment', auth_required: true, rate_limit: '20/min' },
        ],
        analytics: [
            { method: 'GET', path: '/api/v1/analytics/overview', description: 'Get analytics overview', auth_required: true, rate_limit: '50/min' },
            { method: 'GET', path: '/api/v1/analytics/revenue', description: 'Get revenue analytics', auth_required: true, rate_limit: '50/min' },
        ]
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'bg-blue-100 text-blue-700';
            case 'POST': return 'bg-green-100 text-green-700';
            case 'PUT': return 'bg-orange-100 text-orange-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'PATCH': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h2>
                <p className="text-sm text-gray-500 mt-1">REST API endpoints for platform integration</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {Object.keys(endpoints).map((category) => (
                    <button
                        key={category}
                        name={`api-category-${category}`}
                        onClick={() => setSelectedCategory(category as any)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${selectedCategory === category
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Endpoints List */}
            <div className="space-y-3">
                {endpoints[selectedCategory].map((endpoint, idx) => (
                    <Card key={idx} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <span className={`px-3 py-1 rounded font-bold text-sm ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                            </span>
                            <div className="flex-1">
                                <code className="text-sm font-mono text-gray-900 dark:text-white font-bold">
                                    {endpoint.path}
                                </code>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {endpoint.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                    {endpoint.auth_required && (
                                        <Badge variant="secondary">
                                            <Icon name="LockClosedIcon" className="w-3 h-3 mr-1" />
                                            Auth Required
                                        </Badge>
                                    )}
                                    <span className="text-gray-500">
                                        Rate Limit: {endpoint.rate_limit}
                                    </span>
                                </div>
                            </div>
                            <Button name="view-api-details" variant="outline" size="sm">
                                <Icon name="DocumentTextIcon" className="w-4 h-4 mr-1" />
                                Details
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Info */}
            <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200">
                <div className="flex gap-3">
                    <Icon name="KeyIcon" className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-indigo-900 dark:text-indigo-100">API Keys</p>
                        <p className="text-indigo-700 dark:text-indigo-200">Manage your API keys in Settings → Integrations</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default APIDocumentationViewer;
