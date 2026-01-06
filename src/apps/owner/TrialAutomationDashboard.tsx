import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Calendar, Clock, Users, TrendingUp, Mail, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { trialAutomationService, TrialAutomationStats, TenantTrial } from '../../services/trialAutomationService';

export const TrialAutomationDashboard: React.FC = () => {
    const [stats, setStats] = useState<TrialAutomationStats | null>(null);
    const [activeTrials, setActiveTrials] = useState<TenantTrial[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningJob, setRunningJob] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, trialsData] = await Promise.all([
                trialAutomationService.getTrialStats(),
                trialAutomationService.getActiveTrials()
            ]);
            setStats(statsData);
            setActiveTrials(trialsData);
        } catch (error) {
            console.error('Error loading trial automation data:', error);
        } finally {
            setLoading(false);
        }
    };

    const runReminderJob = async (type: '7day' | '1day') => {
        setRunningJob(type);
        try {
            const result = await trialAutomationService.runTrialReminderJob(type);
            alert(`${type} reminder job completed:\n${result.emailsSent}/${result.tenantsProcessed} emails sent`);
            await loadData();
        } catch (error) {
            alert(`Failed to run ${type} reminder job: ${error}`);
        } finally {
            setRunningJob(null);
        }
    };

    const runExpirationCheck = async () => {
        setRunningJob('expiration');
        try {
            const result = await trialAutomationService.runTrialExpirationJob();
            alert(`Expiration check completed:\n${result.tenantsProcessed} trials processed`);
            await loadData();
        } catch (error) {
            alert(`Failed to run expiration check: ${error}`);
        } finally {
            setRunningJob(null);
        }
    };

    const getDaysRemaining = (endDate: string): number => {
        const now = new Date();
        const end = new Date(endDate);
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100';
            case 'expiring_soon': return 'text-yellow-600 bg-yellow-100';
            case 'expired': return 'text-red-600 bg-red-100';
            case 'converted': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trial Automation</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Automated trial reminders and conversion tracking
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => runReminderJob('7day')}
                        disabled={runningJob !== null}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        {runningJob === '7day' ? 'Running...' : 'Send 7-Day Reminders'}
                    </button>
                    <button
                        onClick={() => runReminderJob('1day')}
                        disabled={runningJob !== null}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        {runningJob === '1day' ? 'Running...' : 'Send 1-Day Reminders'}
                    </button>
                    <button
                        onClick={runExpirationCheck}
                        disabled={runningJob !== null}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        {runningJob === 'expiration' ? 'Running...' : 'Check Expirations'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Active Trials */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Trials</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {stats.activeTrials}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Expiring Soon */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon (7d)</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {stats.expiringSoon}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    {/* Expiring Today */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Today</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">
                                    {stats.expiringToday}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {stats.conversionRate}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Avg: {stats.averageConversionTime} days
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Trials Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Trials</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {activeTrials.length} trials currently running
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tenant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    End Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Days Left
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Reminders
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {activeTrials.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No active trials found</p>
                                    </td>
                                </tr>
                            ) : (
                                activeTrials.map((trial) => {
                                    const daysLeft = getDaysRemaining(trial.trialEndDate);
                                    return (
                                        <tr key={trial.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {trial.tenantName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {trial.adminEmail}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {trial.planName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {new Date(trial.trialEndDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${
                                                    daysLeft <= 1 ? 'text-red-600' : 
                                                    daysLeft <= 7 ? 'text-yellow-600' : 
                                                    'text-gray-900 dark:text-white'
                                                }`}>
                                                    {daysLeft} days
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trial.status)}`}>
                                                    {trial.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-1">
                                                    {trial.remindersSent.includes('7day') ? (
                                                        <div title="7-day reminder sent">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        </div>
                                                    ) : daysLeft <= 7 ? (
                                                        <div title="7-day reminder pending">
                                                            <XCircle className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    ) : null}
                                                    {trial.remindersSent.includes('1day') ? (
                                                        <div title="1-day reminder sent">
                                                            <CheckCircle className="w-4 h-4 text-orange-600" />
                                                        </div>
                                                    ) : daysLeft <= 1 ? (
                                                        <div title="1-day reminder pending">
                                                            <XCircle className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Automation Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Automation Schedule
                </h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>7-Day Reminders:</strong> Sent automatically to trials expiring in 7 days (runs daily at 9 AM)
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>1-Day Reminders:</strong> Sent automatically to trials expiring today (runs daily at 8 AM)
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Expiration Check:</strong> Runs hourly to suspend expired trials and send suspension emails
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <strong>Conversion Check:</strong> Runs every 6 hours to track trial-to-paid conversions
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialAutomationDashboard;
