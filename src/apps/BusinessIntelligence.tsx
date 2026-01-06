import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

// Lazy load all BI components for better performance
const TrialManagement = lazy(() => import('./owner/TrialManagement'));
const ChurnPrediction = lazy(() => import('./owner/ChurnPrediction'));
const ReportBuilder = lazy(() => import('./owner/ReportBuilder'));
const RevenueAnalysis = lazy(() => import('./owner/RevenueAnalysis'));
const CustomerHealth = lazy(() => import('./owner/CustomerHealth'));
const SubscriptionLifecycle = lazy(() => import('./owner/SubscriptionLifecycle'));
const ExportCenter = lazy(() => import('./owner/ExportCenter'));
const TrialAutomationDashboard = lazy(() => import('./owner/TrialAutomationDashboard'));
const IPRateLimitingDashboard = lazy(() => import('./owner/IPRateLimitingDashboard'));
const AnomalyDetectionDashboard = lazy(() => import('./owner/AnomalyDetectionDashboard'));
const AdvancedAnalyticsDashboard = lazy(() => import('./owner/AdvancedAnalyticsDashboard'));
const ComplianceDashboard = lazy(() => import('./owner/ComplianceDashboard'));

interface BusinessIntelligenceProps {
    activeTab: string;
    activeSubNav: string;
}

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

/**
 * Business Intelligence Module
 * Routes to Trial Management, Churn Prediction, and Report Builder
 */
const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({ activeTab, activeSubNav }) => {
    const renderContent = () => {
        // Operations Tab
        if (activeTab === 'Operations') {
            if (activeSubNav === 'Trial Management') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <TrialManagement />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Subscription Lifecycle') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <SubscriptionLifecycle />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Automated Tasks') {
                return (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Automated Tasks</h2>
                        <p className="text-gray-600 dark:text-gray-300">View and manage scheduled automation jobs.</p>
                        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Active Scheduled Jobs</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <div>
                                        <div className="font-medium">Trial Reminder Emails</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Every 6 hours</div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <div>
                                        <div className="font-medium">Churn Risk Monitoring</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Daily at 9:00 AM</div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <div>
                                        <div className="font-medium">Trial Expiration Check</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Every hour</div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <div>
                                        <div className="font-medium">Weekly Revenue Report</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Every Monday at 10:00 AM</div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <div>
                                        <div className="font-medium">Monthly Revenue Summary</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">1st of each month at 9:00 AM</div>
                                    </div>
                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        // Analytics Tab
        if (activeTab === 'Analytics') {
            if (activeSubNav === 'Churn Prediction') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <ChurnPrediction />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Revenue Analysis') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <RevenueAnalysis />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Customer Health') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <CustomerHealth />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Advanced Analytics') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <AdvancedAnalyticsDashboard />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Anomaly Detection') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <AnomalyDetectionDashboard />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
        }

        // Reports Tab
        if (activeTab === 'Reports') {
            if (activeSubNav === 'Report Builder') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <ReportBuilder />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Export Center') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <ExportCenter />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Scheduled Reports') {
                return (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Scheduled Reports</h2>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                Create Schedule
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Configure and manage automated report generation and delivery.
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">Weekly Performance Report</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sent every Monday at 9:00 AM</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Active</span>
                                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Edit</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">Monthly Revenue Summary</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sent 1st of each month at 8:00 AM</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Active</span>
                                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Edit</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        // Automation Tab
        if (activeTab === 'Automation') {
            if (activeSubNav === 'Trial Automation') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <TrialAutomationDashboard />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'IP Rate Limiting') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <IPRateLimitingDashboard />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
            if (activeSubNav === 'Anomaly Detection') {
                return (
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <AnomalyDetectionDashboard />
                        </Suspense>
                    </ErrorBoundary>
                );
            }
        }

        // Compliance Tab
        if (activeTab === 'Compliance') {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <ComplianceDashboard />
                    </Suspense>
                </ErrorBoundary>
            );
        }

        // Default view
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-8"
            >
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Business Intelligence</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Trial Management</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Monitor trial users, track conversions, and automate trial workflows.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Operations → Trial Management</div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Churn Prediction</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">AI-powered churn risk analysis and proactive retention strategies.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Analytics → Churn Prediction</div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Report Builder</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Create custom reports with flexible filters, exports, and templates.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Reports → Report Builder</div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Automated Tasks</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">5 active scheduled jobs running hourly, daily, and weekly.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Operations → Automated Tasks</div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Revenue Analysis</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Deep insights into revenue trends, forecasts, and growth metrics.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Analytics → Revenue Analysis</div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Customer Health</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">Monitor engagement patterns, satisfaction, and usage metrics.</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Analytics → Customer Health</div>
                    </motion.div>
                </div>
            </motion.div>
        );
    };

    return renderContent();
};

export default BusinessIntelligence;
