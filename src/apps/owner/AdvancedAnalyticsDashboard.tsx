/**
 * Advanced Analytics Dashboard
 * 
 * Owner-level analytics with multi-tenant KPIs, revenue forecasting,
 * churn risk analysis, and usage trends
 */

import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Users, 
    AlertTriangle,
    BarChart3,
    PieChart,
    Activity,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { useOwnerAnalytics } from '../../hooks/useOwnerServices';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon, loading }) => {
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    {icon}
                </div>
                {change && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{change}</span>
                    </div>
                )}
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
            {loading ? (
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            )}
        </div>
    );
};

interface ChurnRiskTableProps {
    tenants: any[];
    loading: boolean;
}

const ChurnRiskTable: React.FC<ChurnRiskTableProps> = ({ tenants, loading }) => {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tenants at risk - excellent!</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk Level</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR at Risk</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Factors</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tenants.map((tenant) => {
                        const riskLevelColor = 
                            tenant.riskLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            tenant.riskLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';

                        return (
                            <tr key={tenant.tenantId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                    {tenant.tenantName}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskLevelColor}`}>
                                        {tenant.riskLevel}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                    {tenant.riskScore}/100
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    ${tenant.mrr}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                    <ul className="list-disc list-inside space-y-1">
                                        {tenant.riskFactors.slice(0, 2).map((factor: string, idx: number) => (
                                            <li key={idx}>{factor}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-4 py-3">
                                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const AdvancedAnalyticsDashboard: React.FC = () => {
    const { getKPIs, getChurnRisk, getForecast, getUsageTrends, loading, error } = useOwnerAnalytics();
    
    const [kpis, setKPIs] = useState<any>(null);
    const [churnRisk, setChurnRisk] = useState<any>(null);
    const [forecast, setForecast] = useState<any>(null);
    const [usageTrends, setUsageTrends] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [refreshing, setRefreshing] = useState(false);

    const loadAllData = async () => {
        try {
            setRefreshing(true);
            const [kpiData, riskData, forecastData, trendsData] = await Promise.all([
                getKPIs(),
                getChurnRisk(),
                getForecast(12),
                getUsageTrends(selectedPeriod)
            ]);
            
            setKPIs(kpiData);
            setChurnRisk(riskData);
            setForecast(forecastData);
            setUsageTrends(trendsData);
        } catch (err) {
            console.error('Failed to load analytics data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAllData();
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(loadAllData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [selectedPeriod]);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Advanced Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Platform-wide metrics and insights
                    </p>
                </div>
                <button
                    onClick={loadAllData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="font-medium">Error loading analytics: {error}</p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total MRR"
                    value={kpis ? `$${kpis.totalMRR.toLocaleString()}` : '-'}
                    change="+8.5%"
                    trend="up"
                    icon={<DollarSign className="w-6 h-6 text-blue-600" />}
                    loading={loading && !kpis}
                />
                <KPICard
                    title="Active Tenants"
                    value={kpis?.activeTenants || '-'}
                    change="+12"
                    trend="up"
                    icon={<Users className="w-6 h-6 text-green-600" />}
                    loading={loading && !kpis}
                />
                <KPICard
                    title="At Risk Tenants"
                    value={churnRisk?.totalAtRisk || '-'}
                    change={churnRisk ? `$${churnRisk.potentialMRRLoss} MRR` : '-'}
                    trend={churnRisk?.totalAtRisk > 0 ? 'down' : 'neutral'}
                    icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                    loading={loading && !churnRisk}
                />
                <KPICard
                    title="Total ARR"
                    value={kpis ? `$${kpis.totalARR.toLocaleString()}` : '-'}
                    change="+15.2%"
                    trend="up"
                    icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                    loading={loading && !kpis}
                />
            </div>

            {/* Revenue Forecast Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Revenue Forecast (12 Months)
                    </h2>
                </div>
                
                {loading && !forecast ? (
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : forecast ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Current MRR</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${forecast.currentMRR.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">12-Month Projection</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${forecast.forecast[11]?.projectedMRR.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {(forecast.growthRate * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Methodology</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                                    {forecast.methodology.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                        </div>

                        {/* Simple forecast table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Month</th>
                                        <th className="px-4 py-2 text-right">Projected MRR</th>
                                        <th className="px-4 py-2 text-right">Projected ARR</th>
                                        <th className="px-4 py-2 text-right">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {forecast.forecast.slice(0, 6).map((month: any) => (
                                        <tr key={month.month}>
                                            <td className="px-4 py-2">{month.date}</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                ${month.projectedMRR.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                                                ${month.projectedARR.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <span className="text-green-600">
                                                    {(month.confidence * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No forecast data available</p>
                    </div>
                )}
            </div>

            {/* Churn Risk Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Churn Risk Analysis
                    </h2>
                    {churnRisk && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{churnRisk.totalAtRisk}</span> tenants at risk
                            {' • '}
                            <span className="font-semibold text-red-600">${churnRisk.potentialMRRLoss}</span> potential MRR loss
                        </div>
                    )}
                </div>
                
                <ChurnRiskTable 
                    tenants={churnRisk?.tenants || []} 
                    loading={loading && !churnRisk}
                />
            </div>

            {/* Usage Trends Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Usage Trends
                    </h2>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </div>
                
                {loading && !usageTrends ? (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : usageTrends?.summary ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usageTrends.summary.avgDailyUsers.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg API Calls</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usageTrends.summary.avgDailyAPICalls.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Storage</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usageTrends.summary.totalStorageGB} GB
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Peak Users</p>
                            <p className="text-2xl font-bold text-green-600">
                                {usageTrends.summary.peakUsers.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Peak API Calls</p>
                            <p className="text-2xl font-bold text-green-600">
                                {usageTrends.summary.peakAPICalls.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No usage data available for selected period</p>
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default AdvancedAnalyticsDashboard;
