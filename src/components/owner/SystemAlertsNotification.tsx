/**
 * System Alerts Notification Bell
 * 
 * Real-time alert notifications in Owner navbar
 */

import React, { useState } from 'react';
import { Bell, X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useSystemAlerts, type SystemAlert } from '../../hooks/useSystemAlerts';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const SystemAlertsNotification: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showOnlyUnacknowledged, setShowOnlyUnacknowledged] = useState(false);
    const { user } = useAuth();
    const { alerts, unacknowledgedCount, acknowledgeAlert, resolveAlert, loading } = useSystemAlerts();

    const unacknowledged = alerts.filter(a => !a.acknowledged);
    const displayAlerts = showOnlyUnacknowledged ? unacknowledged : alerts.slice(0, 10);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
        }
    };

    const getAlertStyles = (type: string) => {
        const baseStyles = 'border-l-4 bg-opacity-10 dark:bg-opacity-20';
        switch (type) {
            case 'critical':
                return `${baseStyles} border-red-500 bg-red-500`;
            case 'warning':
                return `${baseStyles} border-yellow-500 bg-yellow-500`;
            case 'info':
                return `${baseStyles} border-blue-500 bg-blue-500`;
            default:
                return `${baseStyles} border-gray-400 bg-gray-400`;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const handleAcknowledge = async (alertId: string) => {
        if (user?.id) {
            await acknowledgeAlert(alertId, user.id);
        }
    };

    const handleResolve = async (alertId: string) => {
        await resolveAlert(alertId);
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-lg transition-all duration-200",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isOpen && "bg-gray-100 dark:bg-gray-800"
                )}
                aria-label="System Alerts"
            >
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                
                {/* Badge */}
                {unacknowledgedCount > 0 && (
                    <span className={cn(
                        "absolute -top-1 -right-1 flex items-center justify-center",
                        "w-5 h-5 text-xs font-bold text-white rounded-full",
                        "animate-pulse",
                        unacknowledgedCount > 0 && "bg-red-500"
                    )}>
                        {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Alert Panel */}
                    <div className={cn(
                        "absolute right-0 top-full mt-2 w-96 z-40",
                        "bg-white dark:bg-gray-900 rounded-lg shadow-2xl",
                        "border border-gray-200 dark:border-gray-700",
                        "max-h-[600px] overflow-hidden flex flex-col"
                    )}>
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    System Alerts
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filter Toggle */}
                        {unacknowledged.length > 0 && (
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setShowOnlyUnacknowledged(!showOnlyUnacknowledged)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full",
                                        showOnlyUnacknowledged
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    )}
                                >
                                    {showOnlyUnacknowledged ? `Showing ${unacknowledged.length} Unacknowledged` : `Show Unacknowledged (${unacknowledged.length})`}
                                </button>
                            </div>
                        )}

                        {/* Alerts List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Loading alerts...
                                    </p>
                                </div>
                            )}

                            {!loading && displayAlerts.length === 0 && (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {showOnlyUnacknowledged ? 'No unacknowledged alerts' : 'No alerts'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        You're all caught up!
                                    </p>
                                </div>
                            )}

                            {!loading && displayAlerts.map((alert: SystemAlert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-4 border-b border-gray-100 dark:border-gray-800",
                                        getAlertStyles(alert.type),
                                        !alert.acknowledged && "font-medium"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getAlertIcon(alert.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className={cn(
                                                    "text-sm font-medium truncate",
                                                    alert.type === 'critical' && "text-red-700 dark:text-red-400",
                                                    alert.type === 'warning' && "text-yellow-700 dark:text-yellow-400",
                                                    alert.type === 'info' && "text-blue-700 dark:text-blue-400",
                                                    !['critical', 'warning', 'info'].includes(alert.type) && "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {alert.title}
                                                </h4>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {formatTime(alert.timestamp)}
                                                </span>
                                            </div>

                                            {/* Message */}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                {alert.message}
                                            </p>

                                            {/* Category Badge */}
                                            {alert.category && (
                                                <span className={cn(
                                                    "inline-block px-2 py-0.5 text-xs rounded-full mb-2",
                                                    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {alert.category}
                                                </span>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {!alert.acknowledged && (
                                                    <button
                                                        onClick={() => handleAcknowledge(alert.id)}
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-1 text-xs rounded",
                                                            "bg-blue-500 text-white hover:bg-blue-600",
                                                            "transition-colors duration-200"
                                                        )}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Acknowledge
                                                    </button>
                                                )}

                                                {alert.acknowledged && !alert.resolved && (
                                                    <button
                                                        onClick={() => handleResolve(alert.id)}
                                                        className={cn(
                                                            "flex items-center gap-1 px-2 py-1 text-xs rounded",
                                                            "bg-green-500 text-white hover:bg-green-600",
                                                            "transition-colors duration-200"
                                                        )}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Resolve
                                                    </button>
                                                )}

                                                {alert.resolved && (
                                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <Check className="w-3 h-3" />
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        {displayAlerts.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <a
                                    href="/admin/system-health"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View All Alerts →
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
