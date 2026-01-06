import React, { useMemo } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { Inquiry } from '../types';
import { MetricCard } from '../../../components/shared/ui/MetricCard';
import { ProgressCircle } from '../../../components/shared/ui/ProgressCircle';
import { Card } from '../../../components/shared/ui/Card';

export const CrmAnalytics: React.FC = () => {
    const { items: inquiries, loading } = useDataQuery<Inquiry>('crm_inquiries', {
        sort: '-created',
        perPage: 1000 // Fetch enough for analytics
    });

    const stats = useMemo(() => {
        if (!inquiries) return null;

        const total = inquiries.length;
        const enrolled = inquiries.filter(i => i.status === 'Enrolled').length;
        const rejected = inquiries.filter(i => i.status === 'Rejected').length;
        const active = total - enrolled - rejected;
        const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

        // Status Breakdown
        const statusCounts: Record<string, number> = {};
        inquiries.forEach(i => {
            statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
        });

        // Source Breakdown
        const sourceCounts: Record<string, number> = {};
        inquiries.forEach(i => {
            sourceCounts[i.source] = (sourceCounts[i.source] || 0) + 1;
        });

        return {
            total,
            enrolled,
            rejected,
            active,
            conversionRate,
            statusCounts,
            sourceCounts
        };
    }, [inquiries]);

    if (loading || !stats) {
        return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;
    }

    return (
        <div className="space-y-6 h-full overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    label="Total Inquiries" 
                    value={stats.total.toString()} 
                    icon="DocumentText" 
                    bgGradient="from-blue-50 to-indigo-50"
                    color="text-blue-600"
                />
                <MetricCard 
                    label="Active Pipeline" 
                    value={stats.active.toString()} 
                    subValue={`${Math.round((stats.active / stats.total) * 100)}% of total`}
                    icon="Filter" 
                    bgGradient="from-orange-50 to-amber-50"
                    color="text-orange-600"
                />
                <MetricCard 
                    label="Enrolled" 
                    value={stats.enrolled.toString()} 
                    trend="up"
                    subValue="Students"
                    icon="AcademicCap" 
                    bgGradient="from-green-50 to-emerald-50"
                    color="text-green-600"
                />
                <MetricCard 
                    label="Conversion Rate" 
                    value={`${stats.conversionRate}%`} 
                    icon="ChartBar" 
                    bgGradient="from-purple-50 to-fuchsia-50"
                    color="text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversion Funnel / Status Breakdown */}
                <Card className="lg:col-span-2 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Pipeline Status</h3>
                    <div className="space-y-4">
                        {Object.entries(stats.statusCounts)
                            .sort(([,a], [,b]) => b - a)
                            .map(([status, count]) => (
                            <div key={status} className="space-y-1">
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>{status}</span>
                                    <span>{count} ({Math.round((count / stats.total) * 100)}%)</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${
                                            status === 'Enrolled' ? 'bg-green-500' :
                                            status === 'Rejected' ? 'bg-red-400' :
                                            status === 'New Inquiry' ? 'bg-blue-500' :
                                            'bg-orange-400'
                                        }`} 
                                        style={{ width: `${(count / stats.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Source Breakdown */}
                <Card className="p-6 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 w-full text-left">Acquisition Sources</h3>
                    <div className="flex gap-8 items-center">
                        <ProgressCircle 
                            percentage={stats.conversionRate} 
                            size={160} 
                            color="#10b981" 
                            trackColor="#f3f4f6"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-black text-gray-800">{stats.conversionRate}%</span>
                                <span className="text-xs font-bold text-gray-400 uppercase">Conversion</span>
                            </div>
                        </ProgressCircle>
                    </div>
                    <div className="w-full mt-8 space-y-3">
                        {Object.entries(stats.sourceCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([source, count]) => (
                            <div key={source} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-gray-600">{source}</span>
                                </div>
                                <span className="font-bold text-gray-800">{count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
