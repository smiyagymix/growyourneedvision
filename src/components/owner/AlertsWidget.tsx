import React, { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle, X, ExternalLink } from 'lucide-react';
import { useSystemAlerts } from '../../hooks/useSystemAlerts';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertsWidgetProps {
    mode?: 'badge' | 'panel' | 'full';
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ mode = 'badge' }) => {
    const { alerts, criticalAlerts, warningAlerts, unacknowledgedCount, loading, acknowledgeAlert, resolveAlert } = useSystemAlerts();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

    if (loading) {
        return mode === 'badge' ? (
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
        ) : <div>Loading alerts...</div>;
    }

    // Badge mode - notification bell with count
    if (mode === 'badge') {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <Bell className={`w-5 h-5 ${unacknowledgedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                    {unacknowledgedCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                            {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col"
                            >
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <h3 className="font-bold text-lg">System Alerts</h3>
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    {alerts.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                            <p className="text-gray-600 dark:text-gray-400">All clear! No active alerts.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {alerts.slice(0, 10).map(alert => (
                                                <div
                                                    key={alert.id}
                                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${alert.acknowledged ? 'opacity-60' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-1 ${alert.type === 'critical' ? 'text-red-600' : alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'}`}>
                                                            <AlertTriangle className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                                    alert.type === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                                                    alert.type === 'warning' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                                }`}>
                                                                    {alert.type}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {new Date(alert.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{alert.message}</p>
                                                            
                                                            {alert.metric && (
                                                                <div className="mt-2 text-xs">
                                                                    <span className="text-gray-500 dark:text-gray-400">Metric:</span>{' '}
                                                                    <span className="font-mono">{alert.currentValue}</span>
                                                                    {alert.threshold && (
                                                                        <span className="text-gray-500 dark:text-gray-400"> / {alert.threshold} threshold</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2 mt-3">
                                                                {!alert.acknowledged && (
                                                                    <button
                                                                        onClick={() => user && acknowledgeAlert(alert.id, user.id)}
                                                                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                    >
                                                                        Acknowledge
                                                                    </button>
                                                                )}
                                                                {!alert.resolved && (
                                                                    <button
                                                                        onClick={() => resolveAlert(alert.id)}
                                                                        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                                    >
                                                                        Resolve
                                                                    </button>
                                                                )}
                                                                {alert.actionUrl && (
                                                                    <button
                                                                        onClick={() => {
                                                                            navigate(alert.actionUrl!);
                                                                            setIsOpen(false);
                                                                        }}
                                                                        className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                                                                    >
                                                                        View <ExternalLink className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {alerts.length > 0 && (
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                        <button
                                            onClick={() => {
                                                navigate('/owner/system-health');
                                                setIsOpen(false);
                                            }}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            View All Alerts
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Panel mode - inline alerts display
    if (mode === 'panel') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Active Alerts</h3>
                    <div className="flex gap-2">
                        <span className="text-sm px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
                            {criticalAlerts.length} Critical
                        </span>
                        <span className="text-sm px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded">
                            {warningAlerts.length} Warning
                        </span>
                    </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.slice(0, 5).map(alert => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-lg border ${
                                alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                alert.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold mb-1">{alert.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                                    {alert.tenantName && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Tenant: {alert.tenantName}</p>
                                    )}
                                </div>
                                {!alert.acknowledged && (
                                    <button
                                        onClick={() => user && acknowledgeAlert(alert.id, user.id)}
                                        className="ml-4 text-xs px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
