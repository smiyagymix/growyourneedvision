import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { anomalyDetectionService, Anomaly, AnomalyStats, AnomalyPattern } from '../../services/anomalyDetectionService';
import { useAuth } from '../../context/AuthContext';

export const AnomalyDetectionDashboard: React.FC = () => {
    const { user } = useAuth();
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [stats, setStats] = useState<AnomalyStats | null>(null);
    const [patterns, setPatterns] = useState<AnomalyPattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('active');

    useEffect(() => {
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [filterSeverity, filterStatus]);

    const loadData = async () => {
        try {
            const filter: any = {};
            if (filterStatus !== 'all') filter.status = filterStatus;
            if (filterSeverity !== 'all') filter.severity = filterSeverity;

            const [anomaliesData, statsData, patternsData] = await Promise.all([
                anomalyDetectionService.getAnomalies(filter),
                anomalyDetectionService.getAnomalyStats(),
                anomalyDetectionService.getAnomalyPatterns()
            ]);

            setAnomalies(anomaliesData);
            setStats(statsData);
            setPatterns(patternsData);
        } catch (error) {
            console.error('Error loading anomaly data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (anomalyId: string) => {
        if (!user) return;
        await anomalyDetectionService.acknowledgeAnomaly(anomalyId, user.id);
        await loadData();
    };

    const handleResolve = async (anomalyId: string) => {
        await anomalyDetectionService.resolveAnomaly(anomalyId);
        await loadData();
    };

    const handleFalsePositive = async (anomalyId: string) => {
        await anomalyDetectionService.markFalsePositive(anomalyId);
        await loadData();
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'revenue_drop': return <TrendingDown className="w-5 h-5" />;
            case 'usage_spike': return <TrendingUp className="w-5 h-5" />;
            case 'error_rate': return <AlertTriangle className="w-5 h-5" />;
            default: return <Activity className="w-5 h-5" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'false_positive': return <XCircle className="w-4 h-4 text-gray-600" />;
            case 'acknowledged': return <Clock className="w-4 h-4 text-blue-600" />;
            default: return <AlertTriangle className="w-4 h-4 text-red-600" />;
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Anomaly Detection</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Real-time anomaly alerts powered by ML detection
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Activity className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Anomalies</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.totalAnomalies}
                                </p>
                            </div>
                            <Activity className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                    {stats.activeAnomalies}
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {stats.criticalAnomalies}
                                </p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Today</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {stats.resolvedToday}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.averageResolutionTime}m
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Status:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="resolved">Resolved</option>
                            <option value="false_positive">False Positive</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Severity:</label>
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Anomalies List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Detected Anomalies ({anomalies.length})
                    </h2>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {anomalies.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No anomalies detected</p>
                            <p className="text-sm mt-1">All systems operating normally</p>
                        </div>
                    ) : (
                        anomalies.map((anomaly) => (
                            <div
                                key={anomaly.id}
                                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 ${
                                    anomaly.severity === 'critical' ? 'border-red-500' :
                                    anomaly.severity === 'high' ? 'border-orange-500' :
                                    anomaly.severity === 'medium' ? 'border-yellow-500' :
                                    'border-blue-500'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`p-3 rounded-lg ${getSeverityColor(anomaly.severity).split(' ')[0]}`}>
                                            {getTypeIcon(anomaly.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(anomaly.severity)}`}>
                                                    {anomaly.severity}
                                                </span>
                                                {getStatusIcon(anomaly.status)}
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                                {anomaly.description}
                                            </p>
                                            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                                <div>
                                                    <span className="font-medium">Current:</span> {anomaly.currentValue.toFixed(2)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Expected:</span> {anomaly.expectedValue.toFixed(2)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Deviation:</span>{' '}
                                                    <span className={anomaly.deviation > 50 ? 'text-red-600' : 'text-yellow-600'}>
                                                        {anomaly.deviation.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Detected:</span>{' '}
                                                    {new Date(anomaly.detectedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {anomaly.status === 'active' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcknowledge(anomaly.id)}
                                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Acknowledge
                                            </button>
                                            <button
                                                onClick={() => handleResolve(anomaly.id)}
                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Resolve
                                            </button>
                                            <button
                                                onClick={() => handleFalsePositive(anomaly.id)}
                                                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                                            >
                                                False Positive
                                            </button>
                                        </div>
                                    )}
                                    {anomaly.status === 'acknowledged' && (
                                        <button
                                            onClick={() => handleResolve(anomaly.id)}
                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detection Patterns/Baselines */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Detection Baselines
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {patterns.map((pattern) => (
                        <div key={pattern.metric} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 capitalize">
                                {pattern.metric.replace(/_/g, ' ')}
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Baseline:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {pattern.baseline.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Std Dev:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ±{pattern.stdDev.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Upper Threshold:</span>
                                    <span className="font-medium text-red-600">
                                        {pattern.upperThreshold.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Lower Threshold:</span>
                                    <span className="font-medium text-yellow-600">
                                        {pattern.lowerThreshold.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-500">Data Points:</span>
                                    <span className="text-gray-500 dark:text-gray-500">
                                        {pattern.dataPoints} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    About Anomaly Detection
                </h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <p>
                        <strong>Detection Method:</strong> Z-score analysis with configurable thresholds (2-3 standard deviations)
                    </p>
                    <p>
                        <strong>Monitored Metrics:</strong> Revenue, API usage, error rates, response times, storage, user churn
                    </p>
                    <p>
                        <strong>Baseline Calculation:</strong> Rolling 7-30 day averages updated daily
                    </p>
                    <p>
                        <strong>Alerting:</strong> Critical anomalies trigger system alerts and notifications
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnomalyDetectionDashboard;
