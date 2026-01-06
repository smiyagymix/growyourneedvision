import React from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon } from '../../components/shared/ui/CommonUI';
import { useQuery } from '@tanstack/react-query';
import { ownerService } from '../../services/ownerService';

export const AnalyticsDashboard: React.FC = () => {
    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['ownerDashboard'],
        queryFn: async () => {
            const data = await ownerService.getDashboardData();
            // Transform data structure if necessary to match component expectations
            // The service now returns a unified OwnerDashboardData interface
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error || !dashboardData) {
        return (
            <div className="p-6 text-center text-red-500">
                Failed to load analytics data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        );
    }

    // Parse data from simplified service
    const { kpis, revenueHistory, expensesByCategory, predictiveRevenue, cohortRetention } = dashboardData;

    return (
        <div className="space-y-6 animate-fadeIn pb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.values(kpis).map((kpi: any, index: number) => (
                    <Card key={index} className="p-5 border-t-4" style={{ borderColor: `var(--color-${kpi.color}-500)` }}>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</h3>
                        <div className={`flex items-center mt-2 text-xs font-bold ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                            {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {kpi.change > 0 ? kpi.change : ''}{typeof kpi.change === 'number' ? '%' : ''} {kpi.changeLabel}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Growth */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Revenue Trend</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {revenueHistory.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                    <div
                                        style={{ height: `${(item.value / 20000) * 100}%` }} // Adjusted denominator for scale
                                        className="w-full bg-indigo-500 rounded-t-lg transition-all duration-1000 group-hover:bg-indigo-400"
                                    />
                                </div>
                                <span className="text-xs text-gray-500">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Expenses */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Expenses by Category</h3>
                    {expensesByCategory && expensesByCategory.length > 0 ? (
                        <div className="space-y-4">
                            {expensesByCategory.map((expense: any, i: number) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">{expense.label}</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{expense.percentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${expense.percentage}%`, backgroundColor: expense.color }}
                                            className="h-full rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No expense data available.
                        </div>
                    )}
                </Card>
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Predictive Revenue */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon name="trending-up" className="w-5 h-5 text-purple-500" />
                        Predictive Revenue (Next 3 Months)
                    </h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {predictiveRevenue && predictiveRevenue.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                    <div
                                        style={{ height: `${Math.min((item.value / 25000) * 100, 100)}%` }}
                                        className={`w-full rounded-t-lg transition-all duration-1000 ${
                                            item.type === 'projected' 
                                                ? 'bg-purple-400 dark:bg-purple-500 opacity-70 border-t-2 border-dashed border-white' 
                                                : 'bg-indigo-500 dark:bg-indigo-600'
                                        }`}
                                    />
                                </div>
                                <span className={`text-xs ${item.type === 'projected' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                            <span>Actual</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-purple-400 rounded opacity-70"></div>
                            <span>Projected</span>
                        </div>
                    </div>
                </Card>

                {/* Cohort Retention */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <Icon name="users" className="w-5 h-5 text-blue-500" />
                        User Retention Cohorts
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-500 border-b dark:border-gray-700">
                                    <th className="pb-2 font-medium">Cohort</th>
                                    <th className="pb-2 font-medium text-center">Month 0</th>
                                    <th className="pb-2 font-medium text-center">Month 1</th>
                                    <th className="pb-2 font-medium text-center">Month 2</th>
                                    <th className="pb-2 font-medium text-center">Month 3</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {cohortRetention && cohortRetention.map((cohort, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-3 font-medium text-gray-900 dark:text-white">{cohort.cohort}</td>
                                        {cohort.retention.map((val, j) => (
                                            <td key={j} className="py-3 text-center">
                                                <div 
                                                    className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                        val >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        val >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        val >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                                >
                                                    {val}%
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
