import React from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { Card } from '../../../components/shared/ui/Card';
import { Heading2, Text } from '../../../components/shared/ui/Typography';

interface FinancialReportsProps {
    stats?: {
        totalRevenue: number;
        outstanding: number;
        totalExpenses: number;
        netIncome: number;
    };
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ stats }) => {
    if (!stats) return <div className="p-10 text-center text-gray-500">Loading financial data...</div>;

    return (
        <div className="space-y-6">
            <Heading2 className="text-lg">Financial Overview</Heading2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                    <Heading2 className="text-blue-700 dark:text-blue-300">${stats.totalRevenue.toLocaleString()}</Heading2>
                    <Text className="text-blue-600 dark:text-blue-400">Total Revenue</Text>
                </Card>
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
                    <Heading2 className="text-red-700 dark:text-red-300">${stats.outstanding.toLocaleString()}</Heading2>
                    <Text className="text-red-600 dark:text-red-400">Outstanding Fees</Text>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800">
                    <Heading2 className="text-orange-700 dark:text-orange-300">${stats.totalExpenses.toLocaleString()}</Heading2>
                    <Text className="text-orange-600 dark:text-orange-400">Total Expenses & Payroll</Text>
                </Card>
                <Card className={`border-opacity-50 ${stats.netIncome >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
                    <Heading2 className={stats.netIncome >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        ${stats.netIncome.toLocaleString()}
                    </Heading2>
                    <Text className={stats.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        Net Income
                    </Text>
                </Card>
            </div>

            {/* Placeholder for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <Heading2 className="mb-4 text-lg">Revenue vs Expenses</Heading2>
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-400">
                        Chart Visualization Placeholder
                    </div>
                </Card>
                <Card>
                    <Heading2 className="mb-4 text-lg">Expense Breakdown</Heading2>
                    <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-400">
                        Pie Chart Placeholder
                    </div>
                </Card>
            </div>
        </div>
    );
};
