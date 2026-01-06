import React, { useEffect, useState } from 'react';
import { Card, Icon } from '../../components/shared/ui/CommonUI';
import { aiManagementService } from '../../services/aiManagementService';

export const AIAnalytics: React.FC = () => {
    const [stats, setStats] = useState<any>({ totalTokens: 0, totalCost: 0, logs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await aiManagementService.getUsageStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Total Interactions</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">{stats.logs.length}</div>
                    <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                        <Icon name="ArrowTrendingUpIcon" className="w-3 h-3" /> Real-time
                    </div>
                </Card>
                <Card className="p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Total Tokens</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalTokens.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Input + Output</div>
                </Card>
                <Card className="p-6">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Est. Cost</h3>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">${stats.totalCost.toFixed(4)}</div>
                    <div className="text-xs text-gray-400 mt-1">Based on model rates</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 h-80 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Usage Trends</h3>
                    <div className="flex-1 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                        {stats.logs.length > 0 ? (
                            <div className="w-full h-full p-4 overflow-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b dark:border-slate-700">
                                            <th className="pb-2">Time</th>
                                            <th className="pb-2">Model</th>
                                            <th className="pb-2">Tokens</th>
                                            <th className="pb-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.logs.slice(0, 10).map((log: any) => (
                                            <tr key={log.id} className="border-b dark:border-slate-700/50">
                                                <td className="py-2">{new Date(log.created).toLocaleTimeString()}</td>
                                                <td className="py-2">{log.model}</td>
                                                <td className="py-2">{log.tokens_input + log.tokens_output}</td>
                                                <td className="py-2">${log.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <>
                                <Icon name="ChartBarIcon" className="w-8 h-8 opacity-50" />
                                <span>No usage data available yet</span>
                            </>
                        )}
                    </div>
                </Card>
                <Card className="p-6 h-80 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Topic Distribution</h3>
                    <div className="flex-1 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
                        <Icon name="PieChartIcon" className="w-8 h-8 opacity-50" />
                        <span>[Chart Placeholder: Pie Chart of Topics]</span>
                        <span className="text-xs opacity-50">Requires NLP analysis of chat logs</span>
                    </div>
                </Card>
            </div>
        </div>
    );
};
