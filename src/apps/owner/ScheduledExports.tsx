/**
 * Scheduled Export Center Dashboard
 * 
 * Owner dashboard for managing automated scheduled data exports.
 * Different from ExportCenter which is for manual exports.
 */

import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { useExportCenter } from '../../hooks/useExportCenter';
import { ExportConfig, ExportJob, ExportFormat, ExportSchedule } from '../../services/exportCenterService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export const ScheduledExports: React.FC = () => {
    const { configs, jobs, stats, loading, runExport, downloadExport, isRunning, isDownloading } = useExportCenter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<ExportConfig | null>(null);
    const [activeTab, setActiveTab] = useState<'configs' | 'jobs' | 'stats'>('configs');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getFormatIcon = (format: ExportFormat) => {
        switch (format) {
            case 'pdf': return 'DocumentTextIcon';
            case 'csv': return 'TableCellsIcon';
            case 'excel': return 'DocumentChartBarIcon';
            default: return 'DocumentIcon';
        }
    };

    const getScheduleLabel = (schedule: ExportSchedule, config?: any) => {
        if (schedule === 'manual') return 'Manual';
        if (schedule === 'daily') return 'Daily';
        if (schedule === 'weekly') return `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][config?.dayOfWeek || 1]})`;
        if (schedule === 'monthly') return `Monthly (Day ${config?.dayOfMonth || 1})`;
        return schedule;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Scheduled Exports</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Automated data exports with scheduling</p>
                </div>
                <Button name="create-schedule" variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Create Schedule
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalJobs}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Icon name="DocumentDuplicateIcon" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedJobs}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Icon name="CheckCircleIcon" className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.failedJobs}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                <Icon name="XCircleIcon" className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Records Exported</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    {stats.totalExports.toLocaleString()}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Icon name="ArrowDownTrayIcon" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                                    {formatFileSize(stats.totalSize)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <Icon name="CircleStackIcon" className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {(['configs', 'jobs', 'stats'] as const).map(tab => (
                    <button
                        name={`tab-${tab}`}
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-semibold capitalize transition-colors relative ${
                            activeTab === tab
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {tab === 'configs' && 'Configurations'}
                        {tab === 'jobs' && 'Export Jobs'}
                        {tab === 'stats' && 'Statistics'}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'configs' && (
                    <motion.div
                        key="configs"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {configs.map(config => (
                            <Card key={config.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                            config.enabled
                                                ? 'bg-green-100 dark:bg-green-900'
                                                : 'bg-gray-100 dark:bg-gray-800'
                                        }`}>
                                            <Icon
                                                name={getFormatIcon(config.format)}
                                                className={`w-6 h-6 ${
                                                    config.enabled
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-gray-400'
                                                }`}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {config.name}
                                                </h3>
                                                {!config.enabled && (
                                                    <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {config.description || 'No description'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {config.dataType.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {getScheduleLabel(config.schedule, config.scheduleConfig)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Format: {config.format.toUpperCase()}
                                                </span>
                                                {config.nextRun && (
                                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                                        Next: {formatDistanceToNow(new Date(config.nextRun), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            name="run-export"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => runExport(config.id)}
                                            disabled={isRunning || !config.enabled}
                                        >
                                            <Icon name="PlayIcon" className="w-4 h-4 mr-1" />
                                            Run Now
                                        </Button>
                                        <Button name="edit-config" variant="ghost" size="sm">
                                            <Icon name="PencilIcon" className="w-4 h-4" />
                                        </Button>
                                        <Button name="delete-config" variant="ghost" size="sm">
                                            <Icon name="TrashIcon" className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {configs.length === 0 && (
                            <Card className="p-12 text-center">
                                <Icon name="DocumentDuplicateIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Export Schedules</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Create your first scheduled export to automate data delivery
                                </p>
                                <Button name="create-first-schedule" variant="primary" onClick={() => setShowCreateModal(true)}>
                                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                                    Create First Schedule
                                </Button>
                            </Card>
                        )}
                    </motion.div>
                )}

                {activeTab === 'jobs' && (
                    <motion.div
                        key="jobs"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 gap-4"
                    >
                        {jobs.slice(0, 50).map(job => (
                            <Card key={job.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            job.status === 'completed'
                                                ? 'bg-green-100 dark:bg-green-900'
                                                : job.status === 'failed'
                                                ? 'bg-red-100 dark:bg-red-900'
                                                : 'bg-blue-100 dark:bg-blue-900'
                                        }`}>
                                            <Icon
                                                name={getFormatIcon(job.format)}
                                                className={`w-5 h-5 ${
                                                    job.status === 'completed'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : job.status === 'failed'
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-blue-600 dark:text-blue-400'
                                                }`}
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {job.fileName}
                                                </h4>
                                                <span className={`text-xs px-2 py-1 rounded font-semibold ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                <span>{job.recordCount.toLocaleString()} records</span>
                                                {job.fileSize && <span>{formatFileSize(job.fileSize)}</span>}
                                                {job.startedAt && (
                                                    <span>{formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}</span>
                                                )}
                                                {job.downloadCount > 0 && (
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        ↓ {job.downloadCount} downloads
                                                    </span>
                                                )}
                                            </div>
                                            {job.error && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    Error: {job.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {job.status === 'completed' && job.fileUrl && (
                                        <Button
                                            name="download-export"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadExport(job.id)}
                                            disabled={isDownloading}
                                        >
                                            <Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-1" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}

                        {jobs.length === 0 && (
                            <Card className="p-12 text-center">
                                <Icon name="ClockIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Export Jobs</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Jobs will appear here once exports are run
                                </p>
                            </Card>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
