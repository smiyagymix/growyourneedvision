import React, { useState } from 'react';
import { Card, Icon, Badge } from '../../components/shared/ui/CommonUI';
import { useUsageMetrics, useUsageTrend, usePeakHours, useModelPerformance } from '../../hooks/useAIUsageAnalytics';

const AIUsageAnalytics: React.FC = () => {
    const [dateRange, setDateRange] = useState(30); // Last 30 days

    const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const { data: metrics, isLoading } = useUsageMetrics(startDate, endDate);
    const { data: trend } = useUsageTrend(dateRange);
    const { data: peakHours } = usePeakHours(7);
    const { data: modelPerformance } = useModelPerformance();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const formatNumber = (num: number) => num?.toLocaleString() || '0';
    const formatCost = (cost: number) => `$${cost?.toFixed(4) || '0'}`;
    const formatTime = (ms: number) => `${(ms / 1000)?.toFixed(2) || '0'}s`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Usage Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive usage insights and trends</p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="BoltIcon" className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(metrics?.total_requests || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="CubeIcon" className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Tokens</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(metrics?.total_tokens || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCost(metrics?.total_cost || 0)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="ClockIcon" className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Response</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatTime(metrics?.avg_response_time || 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Usage Trend */}
            {trend && (
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Usage Trend</h3>
                        <Badge variant={trend.growth_rate >= 0 ? 'success' : 'danger'}>
                            {trend.growth_rate >= 0 ? '↑' : '↓'} {Math.abs(trend.growth_rate).toFixed(1)}%
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Current Period</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(trend.current_period)} requests
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Previous Period</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(trend.previous_period)} requests
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Daily Usage Chart */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Daily Usage</h3>
                <div className="space-y-2">
                    {metrics?.by_day?.slice(-14).map((day, idx) => {
                        const maxRequests = Math.max(...(metrics.by_day?.map(d => d.requests) || [1]));
                        const percentage = (day.requests / maxRequests) * 100;

                        return (
                            <div key={idx}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-900 dark:text-white font-medium">
                                            {day.requests} requests
                                        </span>
                                        <span className="text-gray-500">
                                            {formatCost(day.cost)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Model Performance */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Model Performance</h3>
                <div className="space-y-3">
                    {modelPerformance?.map((model, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-gray-900 dark:text-white">{model.model}</span>
                                <Badge variant="info">{formatNumber(model.total_requests)} requests</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Avg Response Time</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatTime(model.avg_response_time)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Avg Cost/Request</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatCost(model.avg_cost_per_request)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Peak Usage Hours */}
            {peakHours && peakHours.length > 0 && (
                <Card className="p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Peak Usage Hours (Last 7 Days)</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {peakHours.slice(0, 12).map((hour, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                                <p className="text-xs text-gray-600 mb-1">
                                    {hour.hour}:00
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {hour.requests}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Usage by Feature */}
            <Card className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Usage by Feature</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {metrics && Object.entries(metrics.by_feature).map(([feature, data]) => (
                        <div key={feature} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1 capitalize">{feature}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                {formatNumber(data.requests)}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatCost(data.cost)}
                            </p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Info Alert */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-3">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Analytics Dashboard</p>
                        <p className="text-blue-700 dark:text-blue-200">
                            All metrics are calculated from real usage logs. Use the date range selector to view different time periods.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIUsageAnalytics;
