import React, { useState } from 'react';
import { Card, Button, Icon } from '../../../components/shared/ui/CommonUI';
import { useVideoExport } from '../hooks/useVideoExport';

export interface ExportQueueItem {
    id: string;
    name: string;
    format: 'mp4' | 'gif' | 'webm';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    resultUrl?: string;
    error?: string;
}

export const ExportQueue: React.FC = () => {
    const [queue, setQueue] = useState<ExportQueueItem[]>([]);
    const { exportVideo, exporting } = useVideoExport();

    const addToQueue = (name: string, format: 'mp4' | 'gif' | 'webm') => {
        const item: ExportQueueItem = {
            id: `export-${Date.now()}`,
            name,
            format,
            status: 'pending',
            progress: 0,
        };

        setQueue(prev => [...prev, item]);
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        setQueue(prev => prev.filter(item => item.status !== 'completed'));
    };

    const getStatusColor = (status: ExportQueueItem['status']): string => {
        switch (status) {
            case 'pending': return 'text-gray-500';
            case 'processing': return 'text-blue-500';
            case 'completed': return 'text-green-500';
            case 'failed': return 'text-red-500';
        }
    };

    const getStatusIcon = (status: ExportQueueItem['status']): string => {
        switch (status) {
            case 'pending': return 'ClockIcon';
            case 'processing': return 'ArrowPathIcon';
            case 'completed': return 'CheckCircleIcon';
            case 'failed': return 'XCircleIcon';
        }
    };

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Export Queue</h3>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearCompleted}
                        disabled={!queue.some(item => item.status === 'completed')}
                    >
                        Clear Completed
                    </Button>
                </div>
            </div>

            {queue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No items in queue</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {queue.map(item => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                        >
                            <Icon
                                name={getStatusIcon(item.status)}
                                className={`w-5 h-5 ${getStatusColor(item.status)}`}
                            />

                            <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-gray-500">
                                    {item.format.toUpperCase()} • {item.status}
                                </p>

                                {item.status === 'processing' && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-500 h-full rounded-full transition-all"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {item.error && (
                                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                                )}
                            </div>

                            {item.status === 'completed' && item.resultUrl && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    icon="ArrowDownTrayIcon"
                                    onClick={() => window.open(item.resultUrl, '_blank')}
                                >
                                    Download
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                icon="XMarkIcon"
                                onClick={() => removeFromQueue(item.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
