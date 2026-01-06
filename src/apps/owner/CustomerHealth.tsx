import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MinusCircle,
    RefreshCw,
    Heart,
    Shield,
    Target,
    Zap,
    BarChart3,
    PieChart
} from 'lucide-react';
import env from '../../config/environment';

interface HealthSummary {
    totalCustomers: number;
    healthyCustomers: number;
    overallHealthPercentage: number;
    atRiskCount: number;
    highEngagementCount: number;
    averageHealthScore: number;
}

interface EngagementSummary {
    totalCustomers: number;
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
    highEngagementPercentage: number;
    mediumEngagementPercentage: number;
    lowEngagementPercentage: number;
}

interface UsageData {
    usageByPlan: Array<{
        planName: string;
        activeUsers: number;
        totalRevenue: number;
        averageLifetime: number;
    }>;
    featureAdoption: Record<string, number>;
    totalActiveSubscriptions: number;
}

interface RiskData {
    totalAtRisk: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    topRiskyCustomers: Array<{
        customerId: string;
        email: string;
        riskScore: number;
        riskLevel: string;
        riskFactors: {
            noActiveSubscription: boolean;
            recentFailedPayments: number;
            overdueInvoices: number;
            daysSinceLastActivity: number;
        };
        recommendations: string[];
    }>;
}

interface SegmentsSummary {
    champions: number;
    loyalists: number;
    atRisk: number;
    newCustomers: number;
    hibernating: number;
}

interface TrendData {
    month: string;
    date: string;
    activeCustomers: number;
    averageHealthScore: number;
    healthStatus: string;
}

interface DashboardData {
    summary: HealthSummary;
    engagement: EngagementSummary;
    usage: UsageData;
    risk: RiskData;
    segments: SegmentsSummary;
    trends: TrendData[];
}

const CustomerHealth: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const paymentServerUrl = env.get('paymentServerUrl');

    const fetchHealthData = async () => {
        try {
            const apiKey = env.get('serviceApiKey');
            const response = await fetch(`${paymentServerUrl}/api/customer-health/dashboard`, {
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch customer health data');

            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching customer health:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealthData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchHealthData();
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-blue-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getHealthBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
        if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
        if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    const getHealthStatus = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    };

    const getRiskColor = (level: string) => {
        if (level === 'high') return 'text-red-500';
        if (level === 'medium') return 'text-yellow-500';
        return 'text-green-500';
    };

    const getRiskBgColor = (level: string) => {
        if (level === 'high') return 'bg-red-100 dark:bg-red-900/30';
        if (level === 'medium') return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-green-100 dark:bg-green-900/30';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-gyn-primary" />
                    <p className="text-gray-600 dark:text-gray-400">Loading customer health data...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-8">
                <p className="text-red-500">Failed to load customer health data</p>
            </div>
        );
    }

    const { summary, engagement, usage, risk, segments, trends } = dashboardData;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Heart className="w-8 h-8 text-gyn-primary" />
                        Customer Health
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Monitor engagement, usage patterns, and identify at-risk customers
                    </p>
                </div>
                <button
                    name="refresh-health-data"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gyn-primary text-white rounded-lg hover:bg-gyn-primary-dark transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${getHealthBgColor(summary.overallHealthPercentage)}`}>
                            <Heart className={`w-6 h-6 ${getHealthColor(summary.overallHealthPercentage)}`} />
                        </div>
                        <span className={`text-2xl font-bold ${getHealthColor(summary.overallHealthPercentage)}`}>
                            {summary.overallHealthPercentage}%
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Health</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                        {getHealthStatus(summary.overallHealthPercentage)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {summary.healthyCustomers} of {summary.totalCustomers} customers healthy
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Activity className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-2xl font-bold text-blue-500">
                            {summary.averageHealthScore}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Health Score</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                        {summary.averageHealthScore}/100
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Based on engagement & usage
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-2xl font-bold text-green-500">
                            {engagement.highEngagementPercentage}%
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">High Engagement</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                        {engagement.highEngagement}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Active in last 7 days
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <span className="text-2xl font-bold text-red-500">
                            {summary.atRiskCount}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">At Risk</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                        {risk.highRisk} High Risk
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Require immediate attention
                    </p>
                </motion.div>
            </div>

            {/* Engagement Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gyn-primary" />
                    Engagement Distribution
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">High Engagement</span>
                            <span className="text-sm font-bold text-green-500">{engagement.highEngagementPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${engagement.highEngagementPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{engagement.highEngagement} customers</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Medium Engagement</span>
                            <span className="text-sm font-bold text-yellow-500">{engagement.mediumEngagementPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${engagement.mediumEngagementPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{engagement.mediumEngagement} customers</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Engagement</span>
                            <span className="text-sm font-bold text-red-500">{engagement.lowEngagementPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${engagement.lowEngagementPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{engagement.lowEngagement} customers</p>
                    </div>
                </div>
            </motion.div>

            {/* Customer Segments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-gyn-primary" />
                        Customer Segments
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-purple-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Champions</span>
                            </div>
                            <span className="text-xl font-bold text-purple-500">{segments.champions}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Loyalists</span>
                            </div>
                            <span className="text-xl font-bold text-blue-500">{segments.loyalists}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-green-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">New Customers</span>
                            </div>
                            <span className="text-xl font-bold text-green-500">{segments.newCustomers}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">At Risk</span>
                            </div>
                            <span className="text-xl font-bold text-red-500">{segments.atRisk}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <MinusCircle className="w-5 h-5 text-gray-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Hibernating</span>
                            </div>
                            <span className="text-xl font-bold text-gray-500">{segments.hibernating}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Usage by Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gyn-primary" />
                        Usage by Plan
                    </h3>
                    <div className="space-y-4">
                        {usage.usageByPlan.slice(0, 5).map((plan, index) => (
                            <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{plan.planName}</span>
                                    <span className="text-sm font-bold text-gyn-primary">{plan.activeUsers} users</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Avg Lifetime: {plan.averageLifetime} days</span>
                                    <span>Revenue: ${plan.totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Health Trends */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gyn-primary" />
                    Health Trends (Last 6 Months)
                </h3>
                <div className="space-y-4">
                    {trends.map((trend, index) => {
                        const percentage = (trend.averageHealthScore / 100) * 100;
                        return (
                            <div key={index}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{trend.month}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                            {trend.averageHealthScore}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            trend.healthStatus === 'healthy' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : trend.healthStatus === 'moderate'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {trend.healthStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                                        className={`h-2 rounded-full ${
                                            trend.healthStatus === 'healthy' 
                                                ? 'bg-green-500'
                                                : trend.healthStatus === 'moderate'
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                        }`}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {trend.activeCustomers} active customers
                                </p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* At-Risk Customers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    High-Risk Customers
                </h3>
                <div className="space-y-4">
                    {risk.topRiskyCustomers.slice(0, 5).map((customer, index) => (
                        <div key={index} className={`p-4 rounded-lg ${getRiskBgColor(customer.riskLevel)}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white">{customer.email}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {customer.customerId}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold ${getRiskColor(customer.riskLevel)}`}>
                                        {customer.riskScore}
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Risk Score</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {customer.riskFactors.noActiveSubscription && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-gray-600 dark:text-gray-400">No active subscription</span>
                                    </div>
                                )}
                                {customer.riskFactors.recentFailedPayments > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                        <span className="text-gray-600 dark:text-gray-400">{customer.riskFactors.recentFailedPayments} failed payments</span>
                                    </div>
                                )}
                                {customer.riskFactors.overdueInvoices > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        <span className="text-gray-600 dark:text-gray-400">{customer.riskFactors.overdueInvoices} overdue invoices</span>
                                    </div>
                                )}
                                {customer.riskFactors.daysSinceLastActivity > 30 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <MinusCircle className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-600 dark:text-gray-400">{customer.riskFactors.daysSinceLastActivity} days inactive</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Recommendations:</p>
                                <ul className="space-y-1">
                                    {customer.recommendations.slice(0, 2).map((rec, idx) => (
                                        <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                            <span className="text-gyn-primary mt-0.5">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default CustomerHealth;
