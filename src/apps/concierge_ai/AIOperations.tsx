import React, { useEffect, useState } from 'react';
import { Card, Button, Icon, Badge } from '../../components/shared/ui/CommonUI';
import { aiManagementService } from '../../services/aiManagementService';

export const AIOperations: React.FC = () => {
    const [health, setHealth] = useState<any>({ database: 'Checking...', pythonService: 'Checking...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const checkHealth = async () => {
        try {
            const status = await aiManagementService.getSystemHealth();
            setHealth(status);
        } catch (error) {
            console.error("Failed to check health", error);
            setHealth({ database: 'Error', pythonService: 'Error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            {/* Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={`p-6 border-l-4 ${health.database === 'Operational' ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">System Status</h3>
                            <p className={`${health.database === 'Operational' ? 'text-green-600' : 'text-red-600'} font-bold mt-1`}>
                                {health.database === 'Operational' ? 'Operational' : 'Issues Detected'}
                            </p>
                        </div>
                        <Icon name={health.database === 'Operational' ? "CheckCircleIcon" : "ExclamationCircleIcon"} className={`w-6 h-6 ${health.database === 'Operational' ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>AI Service (Python):</span>
                            <span className="text-gray-600 font-bold">Unknown (No Endpoint)</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>PocketBase DB:</span>
                            <span className={`${health.database === 'Operational' ? 'text-green-600' : 'text-red-600'} font-bold`}>{health.database}</span>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Avg Latency</h3>
                            <p className="text-blue-600 font-bold mt-1">-- ms</p>
                        </div>
                        <Icon name="ClockIcon" className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="mt-4 text-xs text-gray-500">Real-time latency monitoring pending</div>
                </Card>
                <Card className="p-6 border-l-4 border-yellow-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white">Moderation Queue</h3>
                            <p className="text-yellow-600 font-bold mt-1">0 Items</p>
                        </div>
                        <Icon name="ShieldExclamationIcon" className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="mt-4 text-xs text-gray-500">Requires human review</div>
                </Card>
            </div>

            {/* Moderation Queue Placeholder */}
            <Card className="flex-1 p-6">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Moderation Queue</h3>
                <div className="text-center py-10 text-gray-500">
                    <Icon name="CheckBadgeIcon" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No items requiring moderation.</p>
                </div>
            </Card>
        </div>
    );
};

