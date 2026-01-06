import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Users, Zap, Clock, CheckCircle,
    AlertTriangle, ArrowUpRight, Calendar, Download, RefreshCw,
    Mail, MessageSquare, Bell, MousePointer, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService } from '../../services/marketingService';
import { marketingExportService } from '../../services/marketingExportService';
import { Card, Button } from '../shared/ui/CommonUI';

interface AnalyticsData {
    totalTriggered: number;
    totalCompleted: number;
    avgSuccessRate: number;
    avgCompletionTime: string;
    channelBreakdown: Array<{ channel: string; count: number; successRate: number }>;
    dailyStats: Array<{ date: string; triggered: number; completed: number }>;
}

export const AutomationAnalytics: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    const getChannelIcon = (channel: string): React.ElementType => {
        const channelLower = channel.toLowerCase();
        if (channelLower.includes('email')) return Mail;
        if (channelLower.includes('sms')) return MessageSquare;
        if (channelLower.includes('push')) return Bell;
        if (channelLower.includes('webhook')) return MousePointer;
        return Target;
    };

    const formatPercentage = (value: number): string => {
        return `${Math.round(value)}%`;
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await marketingService.getAutomationAnalytics();
            setData(result);
        } catch (error) {
            console.error('Error fetching automation analytics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automation Performance</h2>
                    <p className="text-sm text-gray-500">Real-time tracking of your automation workflows and conversion triggers.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => marketingExportService.exportAutomationAnalyticsToCSV(data)}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        CSV
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => marketingExportService.exportAutomationAnalyticsToPDF(data)}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        PDF Report
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Executions', value: data.totalTriggered.toLocaleString(), icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Completed', value: data.totalCompleted.toLocaleString(), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Success Rate', value: `${data.avgSuccessRate}%`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Avg Time', value: data.avgCompletionTime, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                12%
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Performance Map */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            Daily Execution Volume
                        </h3>
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 text-xs">
                            <button className="px-3 py-1 bg-white dark:bg-gray-700 shadow-sm rounded-md font-medium">7 Days</button>
                            <button className="px-3 py-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">30 Days</button>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-2 px-2">
                        {data.dailyStats.map((day, idx) => {
                            const maxVal = Math.max(...data.dailyStats.map(d => d.triggered));
                            const height = (day.triggered / maxVal) * 100;
                            const successHeight = (day.completed / day.triggered) * 100;

                            return (
                                <div key={day.date} className="flex-1 group relative">
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                        {day.date}: {day.triggered} triggered
                                    </div>
                                    <div className="w-full bg-purple-100 dark:bg-purple-900/20 rounded-t-sm" style={{ height: `${height}%` }}>
                                        <div className="w-full bg-purple-500 rounded-t-sm" style={{ height: `${successHeight}%` }} />
                                    </div>
                                    <div className="mt-2 text-[10px] text-gray-500 text-center truncate">
                                        {day.date.split('-')[2]}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Channel Breakdown */}
                <Card className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                        <Target className="w-5 h-5 text-blue-500" />
                        Channel Breakdown
                    </h3>
                    <div className="space-y-6">
                        {data.channelBreakdown.map((channel) => (
                            <div key={channel.channel}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {channel.channel === 'Email' ? <Mail className="w-4 h-4 text-blue-500" /> :
                                            channel.channel === 'SMS' ? <MessageSquare className="w-4 h-4 text-green-500" /> :
                                                <Bell className="w-4 h-4 text-orange-500" />}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{channel.channel}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{channel.successRate}% rate</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${channel.successRate}%` }}
                                        className={cn(
                                            "h-full rounded-full",
                                            channel.channel === 'Email' ? 'bg-blue-500' :
                                                channel.channel === 'SMS' ? 'bg-green-500' : 'bg-orange-500'
                                        )}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {channel.count.toLocaleString()} triggers sent
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="p-6 border-l-4 border-l-yellow-400">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Optimization Suggestions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Based on the last 7 days of performance, we've identified some areas for improvement:
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-gray-500">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                The "Abandoned Cart" SMS trigger has an 85% success rate. Consider refining the wait time.
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                Email click-through rates are peaking at 10 AM. Adjust your "Weekly Digest" schedule.
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AutomationAnalytics;
