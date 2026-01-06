import React from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useSystemHealth, useOverallHealth } from '../../hooks/usePhase2Data';

const SystemHealthDashboard: React.FC = () => {
    const { data: metrics, isLoading, error, refetch } = useSystemHealth();
    const { data: overallHealth } = useOverallHealth();

    const handleRefresh = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load system health. Please try again.</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-50';
            case 'degraded': return 'text-orange-600 bg-orange-50';
            case 'down': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h2>
                    <p className="text-sm text-gray-500 mt-1">Real-time monitoring of all platform services</p>
                </div>
                <Button name="refresh-page" variant="outline" onClick={() => window.location.reload()}>
                    <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overall Status */}
            <Card className="p-6 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStatusColor(overallHealth?.status || 'healthy')}`}>
                            <Icon name="CheckCircleIcon" className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{overallHealth?.message || 'All Systems Operational'}</h3>
                            <p className="text-sm text-gray-600">{overallHealth?.healthy_count || 0} of {overallHealth?.total_count || 0} services healthy</p>
                        </div>
                    </div>
                    <Button name="refresh-health" variant="outline" onClick={handleRefresh}>
                        <Icon name="ArrowPathIcon" className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Service Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.map((metric) => (
                    <Card key={metric.id} className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white">{metric.service_name}</h3>
                            <Badge variant={metric.status === 'healthy' ? 'success' : metric.status === 'degraded' ? 'warning' : 'danger'}>
                                {metric.status}
                            </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Uptime:</span>
                                <span className="font-medium">{metric.uptime_percentage.toFixed(2)}%</span>
                            </div>
                            {metric.response_time_ms && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Response time:</span>
                                    <span className="font-medium">{metric.response_time_ms}ms</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Last check:</span>
                                <span className="font-medium">{new Date(metric.last_check).toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                ))}</div>

            {/* Alerts Info */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-3">
                    <Icon name="BellIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Alert Notifications</p>
                        <p className="text-blue-700 dark:text-blue-200">You'll receive email notifications if any service goes down or degrades.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SystemHealthDashboard;
