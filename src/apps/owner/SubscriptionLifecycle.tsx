import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Clock,
    TrendingUp,
    TrendingDown,
    Users,
    RefreshCw,
    ChevronRight,
    Play,
    Pause,
    XCircle,
    CheckCircle,
    AlertTriangle,
    DollarSign,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    Settings
} from 'lucide-react';
import env from '../../config/environment';
import { useToast } from '../../hooks/useToast';

const subscriptionActionSchema = z.object({
    action: z.enum(['pause', 'resume', 'cancel', 'upgrade', 'downgrade', 'renew']),
    subscriptionId: z.string().min(1, 'Subscription ID required')
});

interface DashboardData {
    summary: {
        totalSubscriptions: number;
        activeSubscriptions: number;
        trialingSubscriptions: number;
        pastDueSubscriptions: number;
        canceledSubscriptions: number;
    };
    statusDistribution: Record<string, number>;
    recentEvents: {
        counts: Record<string, number>;
        events: Array<{
            id: string;
            type: string;
            created: string;
            subscriptionId: string;
            customerId: string;
        }>;
    };
    workflows: {
        upgrades: number;
        downgrades: number;
        renewals: number;
        churnRate: number;
    };
}

interface Subscription {
    id: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    status: string;
    planName: string;
    amount: number;
    interval: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
    created: string;
}

const SubscriptionLifecycle: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const paymentServerUrl = env.get('paymentServerUrl');
    const apiKey = env.get('serviceApiKey');

    const fetchDashboard = async () => {
        try {
            const response = await fetch(`${paymentServerUrl}/api/subscription-lifecycle/dashboard`, {
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch dashboard');
            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    };

    const fetchSubscriptions = async (status: string = 'all') => {
        try {
            const url = status === 'all'
                ? `${paymentServerUrl}/api/subscription-lifecycle/statuses`
                : `${paymentServerUrl}/api/subscription-lifecycle/statuses?status=${status}`;

            const response = await fetch(url, {
                headers: {
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch subscriptions');
            const data = await response.json();
            setSubscriptions(data);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchSubscriptions(selectedStatus);
    }, [selectedStatus]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
        fetchSubscriptions(selectedStatus);
    };

    const handleAction = async (action: string, subscriptionId: string, data?: any) => {
        // Validate action
        const validationData = {
            action: action as 'pause' | 'resume' | 'cancel' | 'upgrade' | 'downgrade' | 'renew',
            subscriptionId
        };
        
        const result = subscriptionActionSchema.safeParse(validationData);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        setActionLoading(subscriptionId);
        try {
            const response = await fetch(`${paymentServerUrl}/api/subscription-lifecycle/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': typeof apiKey === 'string' ? apiKey : 'demo-key',
                },
                body: JSON.stringify({ subscriptionId, ...data }),
            });

            if (!response.ok) throw new Error(`Failed to ${action} subscription`);
            
            // Refresh data
            await fetchDashboard();
            await fetchSubscriptions(selectedStatus);
            
            alert(`Successfully ${action}d subscription`);
        } catch (error) {
            console.error(`Error ${action}ing subscription:`, error);
            alert(`Failed to ${action} subscription`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: 'text-green-500',
            trialing: 'text-blue-500',
            past_due: 'text-yellow-500',
            canceled: 'text-red-500',
            unpaid: 'text-orange-500',
            incomplete: 'text-gray-500',
            paused: 'text-purple-500'
        };
        return colors[status] || 'text-gray-500';
    };

    const getStatusBg = (status: string) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 dark:bg-green-900/30',
            trialing: 'bg-blue-100 dark:bg-blue-900/30',
            past_due: 'bg-yellow-100 dark:bg-yellow-900/30',
            canceled: 'bg-red-100 dark:bg-red-900/30',
            unpaid: 'bg-orange-100 dark:bg-orange-900/30',
            incomplete: 'bg-gray-100 dark:bg-gray-700/30',
            paused: 'bg-purple-100 dark:bg-purple-900/30'
        };
        return colors[status] || 'bg-gray-100 dark:bg-gray-700/30';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, any> = {
            active: CheckCircle,
            trialing: Clock,
            past_due: AlertTriangle,
            canceled: XCircle,
            unpaid: DollarSign,
            incomplete: Settings,
            paused: Pause
        };
        const Icon = icons[status] || Settings;
        return <Icon className="w-4 h-4" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-gyn-primary" />
                    <p className="text-gray-600 dark:text-gray-400">Loading subscription data...</p>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="p-8">
                <p className="text-red-500">Failed to load subscription lifecycle data</p>
            </div>
        );
    }

    const { summary, statusDistribution, recentEvents, workflows } = dashboardData;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <RotateCcw className="w-8 h-8 text-gyn-primary" />
                        Subscription Lifecycle
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                        Manage subscription states, upgrades, downgrades, and renewals
                    </p>
                </div>
                <button
                    name="refresh-lifecycle-data"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gyn-primary text-white rounded-lg hover:bg-gyn-primary-dark transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                        {summary.totalSubscriptions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All subscriptions</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                    onClick={() => setSelectedStatus('active')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</h3>
                    <p className="text-3xl font-bold text-green-500 mt-1">
                        {summary.activeSubscriptions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Currently active</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                    onClick={() => setSelectedStatus('trialing')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Clock className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Trialing</h3>
                    <p className="text-3xl font-bold text-blue-500 mt-1">
                        {summary.trialingSubscriptions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">In trial period</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                    onClick={() => setSelectedStatus('past_due')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Past Due</h3>
                    <p className="text-3xl font-bold text-yellow-500 mt-1">
                        {summary.pastDueSubscriptions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Payment failed</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                    onClick={() => setSelectedStatus('canceled')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Canceled</h3>
                    <p className="text-3xl font-bold text-red-500 mt-1">
                        {summary.canceledSubscriptions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Churned customers</p>
                </motion.div>
            </div>

            {/* Workflow Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <div className="flex items-center justify-between mb-4">
                        <ArrowUpCircle className="w-8 h-8" />
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Upgrades</h3>
                    <p className="text-4xl font-bold mt-1">{workflows.upgrades}</p>
                    <p className="text-xs opacity-80 mt-2">Last 30 days</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <div className="flex items-center justify-between mb-4">
                        <ArrowDownCircle className="w-8 h-8" />
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Downgrades</h3>
                    <p className="text-4xl font-bold mt-1">{workflows.downgrades}</p>
                    <p className="text-xs opacity-80 mt-2">Last 30 days</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8" />
                        <RotateCcw className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Upcoming Renewals</h3>
                    <p className="text-4xl font-bold mt-1">{workflows.renewals}</p>
                    <p className="text-xs opacity-80 mt-2">Next 30 days</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
                >
                    <div className="flex items-center justify-between mb-4">
                        <XCircle className="w-8 h-8" />
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Churn Rate</h3>
                    <p className="text-4xl font-bold mt-1">{workflows.churnRate}%</p>
                    <p className="text-xs opacity-80 mt-2">Overall rate</p>
                </motion.div>
            </div>

            {/* Status Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
                    {['all', 'active', 'trialing', 'past_due', 'canceled', 'paused'].map((status) => (
                        <button
                            key={status}
                            name={`filter-status-${status}`}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                selectedStatus === status
                                    ? 'bg-gyn-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subscriptions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        Subscriptions {selectedStatus !== 'all' && `(${selectedStatus})`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {subscriptions.length} subscriptions found
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Period End
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {sub.customerName}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {sub.customerEmail}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(sub.status)}`}>
                                            {getStatusIcon(sub.status)}
                                            <span className={getStatusColor(sub.status)}>
                                                {sub.status}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{sub.planName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{sub.interval}ly</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        ${sub.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {formatDate(sub.currentPeriodEnd)}
                                        {sub.cancelAtPeriodEnd && (
                                            <span className="ml-2 text-xs text-red-500">(canceling)</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
                                                <>
                                                    <button
                                                        name="pause-subscription"
                                                        onClick={() => handleAction('pause', sub.id)}
                                                        disabled={actionLoading === sub.id}
                                                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
                                                        title="Pause"
                                                    >
                                                        <Pause className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        name="cancel-subscription"
                                                        onClick={() => handleAction('cancel', sub.id, { immediately: false })}
                                                        disabled={actionLoading === sub.id}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                        title="Cancel"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {sub.cancelAtPeriodEnd && (
                                                <button
                                                    name="reactivate-subscription"
                                                    onClick={() => handleAction('reactivate', sub.id)}
                                                    disabled={actionLoading === sub.id}
                                                    className="text-green-600 hover:text-green-800 dark:text-green-400"
                                                    title="Reactivate"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )}
                                            {sub.status === 'paused' && (
                                                <button
                                                    name="resume-subscription"
                                                    onClick={() => handleAction('resume', sub.id)}
                                                    disabled={actionLoading === sub.id}
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                    title="Resume"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {subscriptions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No subscriptions found</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SubscriptionLifecycle;
