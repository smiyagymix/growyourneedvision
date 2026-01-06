import React from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useBackups, useBackupStats, useInitiateBackup, useRestoreBackup } from '../../hooks/usePhase2Data';
import { backupService } from '../../services/backupService';
import { useToast } from '../../hooks/useToast';

const BackupManager: React.FC = () => {
    const { data: backups, isLoading, error } = useBackups();
    const { data: stats } = useBackupStats();
    const initiateMutation = useInitiateBackup();
    const restoreMutation = useRestoreBackup();

    const handleCreateBackup = async () => {
        try {
            await initiateMutation.mutateAsync('manual');
            alert('Backup initiated successfully!');
        } catch (error) {
            alert('Failed to initiate backup');
        }
    };

    const handleRestore = async (id: string) => {
        if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) return;

        try {
            await restoreMutation.mutateAsync(id);
            alert('Restore completed successfully!');
        } catch (error) {
            alert('Failed to restore backup');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load backups. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backup Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage database backups and restore points</p>
                </div>
                <Button
                    variant="primary"
                    onClick={handleCreateBackup}
                    disabled={initiateMutation.isPending}
                    name="create-backup"
                >
                    <Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-2" />
                    {initiateMutation.isPending ? 'Creating...' : 'Create Backup'}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-4">
                        <Icon name="CircleStackIcon" className="w-10 h-10 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Backups</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total || backups?.length || 0}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-4">
                        <Icon name="CheckCircleIcon" className="w-10 h-10 text-green-600" />
                        <div>
                            <p className="text-sm text-gray-600">Last Backup</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <div className="flex items-center gap-4">
                        <Icon name="ServerIcon" className="w-10 h-10 text-purple-600" />
                        <div>
                            <p className="text-sm text-gray-600">Total Size</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{backupService.formatSize(stats?.totalSize || 0)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Backups List */}
            <div className="space-y-3">
                {backups?.map((backup) => (
                    <Card key={backup.id} className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <Icon name="ArchiveBoxIcon" className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white">
                                            {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                                        </h3>
                                        <Badge variant={backup.status === 'completed' ? 'success' : backup.status === 'in_progress' ? 'warning' : 'danger'}>
                                            {backup.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>{backupService.formatSize(backup.size_bytes)}</span>
                                        <span>•</span>
                                        <span>{new Date(backup.created).toLocaleString()}</span>
                                        <span>•</span>
                                        <span>Retention: {backup.retention_days} days</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(backup.id)}
                                    disabled={restoreMutation.isPending || backup.status !== 'completed'}
                                    name="restore-backup"
                                >
                                    <Icon name="ArrowPathIcon" className="w-4 h-4 mr-1" />
                                    {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                                </Button>
                                <Button variant="outline" size="sm" disabled={backup.status !== 'completed'} name="download-backup">
                                    <Icon name="ArrowDownTrayIcon" className="w-4 h-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Schedule Info */}
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                <div className="flex gap-3">
                    <Icon name="ClockIcon" className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-100">Automated Schedule</p>
                        <p className="text-yellow-700 dark:text-yellow-200">Full backups: Daily at 2:00 AM | Incremental: Every 6 hours</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BackupManager;
