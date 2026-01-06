import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card } from '../../components/shared/ui/CommonUI';
import analyticsService from '../../services/analyticsService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Calendar, Filter } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AdvancedAnalytics() {
    const [activeTab, setActiveTab] = useState('cohorts');
    const [loading, setLoading] = useState(false);
    const [cohortData, setCohortData] = useState(null);
    const [retentionData, setRetentionData] = useState(null);
    const [mrrData, setMRRData] = useState(null);
    const [ltvData, setLTVData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const { showToast } = useToast();

    useEffect(() => {
        loadAnalytics();
    }, [activeTab, dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'cohorts':
                    const cohorts = await analyticsService.getCohortAnalysis({
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                        cohortBy: 'month'
                    });
                    setCohortData(cohorts);
                    break;
                case 'retention':
                    const retention = await analyticsService.getRetentionCurve({
                        startDate: dateRange.startDate,
                        period: 'month',
                        maxPeriods: 12
                    });
                    setRetentionData(retention);
                    break;
                case 'mrr':
                    const mrr = await analyticsService.getMRRMetrics({
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    });
                    setMRRData(mrr);
                    break;
                case 'ltv':
                    const ltv = await analyticsService.getLTVMetrics();
                    setLTVData(ltv);
                    break;
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            let data, type;
            switch (activeTab) {
                case 'cohorts':
                    data = cohortData;
                    type = 'cohorts';
                    break;
                case 'retention':
                    data = retentionData;
                    type = 'retention';
                    break;
                case 'mrr':
                    data = mrrData;
                    type = 'mrr';
                    break;
                case 'ltv':
                    data = ltvData;
                    type = 'ltv';
                    break;
            }

            if (format === 'pdf') {
                await analyticsService.exportAnalytics(type, 'pdf', {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                });
            } else {
                const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
                await analyticsService.exportToExcel(data, filename);
            }
        } catch (error) {
            console.error('Error exporting:', error);
            showToast('Failed to export report', 'error');
        }
    };

    const tabs = [
        { id: 'cohorts', label: 'Cohort Analysis', icon: Users },
        { id: 'retention', label: 'Retention Curve', icon: TrendingUp },
        { id: 'mrr', label: 'MRR/ARR', icon: DollarSign },
        { id: 'ltv', label: 'Lifetime Value', icon: Calendar }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Comprehensive business intelligence and insights
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('pdf')}
                        name="export-pdf"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        PDF
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        name="export-excel"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <input
                            type="date"
                            name="start-date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            name="end-date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            name={`tab-${tab.id}`}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading analytics...</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {activeTab === 'cohorts' && cohortData && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total Cohorts</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{cohortData.summary.totalCohorts}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total Users</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{cohortData.summary.totalUsers.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Avg Retention</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{cohortData.summary.avgRetentionRate.toFixed(1)}%</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Cohort Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cohort Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b dark:border-gray-700">
                                                    <th className="text-left p-3">Cohort</th>
                                                    <th className="text-right p-3">Size</th>
                                                    <th className="text-right p-3">Revenue</th>
                                                    <th className="text-right p-3">Avg LTV</th>
                                                    <th className="text-right p-3">M1</th>
                                                    <th className="text-right p-3">M3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cohortData.cohorts.map((cohort, idx) => (
                                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                        <td className="p-3 font-medium">{cohort.cohort}</td>
                                                        <td className="text-right p-3">{cohort.size}</td>
                                                        <td className="text-right p-3">${cohort.revenue.toFixed(0)}</td>
                                                        <td className="text-right p-3">${cohort.avgLifetimeValue.toFixed(2)}</td>
                                                        <td className="text-right p-3">
                                                            {cohort.retention.find(r => r.period === 1)?.retentionRate.toFixed(1) || 0}%
                                                        </td>
                                                        <td className="text-right p-3">
                                                            {cohort.retention.find(r => r.period === 3)?.retentionRate.toFixed(1) || 0}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'retention' && retentionData && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total Users</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{retentionData.totalUsers.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Month 1</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-green-600">
                                            {retentionData.summary.period1Retention.toFixed(1)}%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Month 6</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-yellow-600">
                                            {retentionData.summary.period6Retention.toFixed(1)}%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Month 12</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-red-600">
                                            {retentionData.summary.period12Retention.toFixed(1)}%
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Retention Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Retention Curve</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={retentionData.curve}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="periodLabel" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="retentionRate" stroke="#3b82f6" name="Retention %" strokeWidth={2} />
                                            <Line type="monotone" dataKey="churnRate" stroke="#ef4444" name="Churn %" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'mrr' && mrrData && (
                        <div className="space-y-6">
                            {/* MRR Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>MRR</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${mrrData.current.mrr.toLocaleString()}</p>
                                        <p className="text-sm text-green-600 mt-2">
                                            +{mrrData.growth.mrrGrowthRate.toFixed(2)}%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ARR</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${mrrData.current.arr.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>ARPU</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${mrrData.current.avgRevenuePerUser.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Churn Rate</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold text-red-600">{mrrData.churn.churnRate.toFixed(2)}%</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* MRR Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue Breakdown</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">Growth</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                +${mrrData.growth.mrrGrowth.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">Churned</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                -${mrrData.churn.churnedMRR.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'ltv' && ltvData && (
                        <div className="space-y-6">
                            {/* LTV Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Avg LTV</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${ltvData.overall.avgLTV.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Avg Lifetime</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{ltvData.overall.avgLifetimeMonths.toFixed(1)}</p>
                                        <p className="text-sm text-gray-500">months</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Value</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">${ltvData.overall.avgMonthlyValue.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Total Customers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{ltvData.overall.totalCustomers.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* LTV by Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>LTV by Plan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={ltvData.byPlan}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="plan" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="avgLTV" fill="#3b82f6" name="Avg LTV ($)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Plan Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b dark:border-gray-700">
                                                <th className="text-left p-3">Plan</th>
                                                <th className="text-right p-3">Avg LTV</th>
                                                <th className="text-right p-3">Avg Lifetime</th>
                                                <th className="text-right p-3">Customers</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ltvData.byPlan.map((plan, idx) => (
                                                <tr key={idx} className="border-b dark:border-gray-700">
                                                    <td className="p-3 font-medium">{plan.plan}</td>
                                                    <td className="text-right p-3">${plan.avgLTV.toFixed(2)}</td>
                                                    <td className="text-right p-3">{plan.avgLifetimeMonths.toFixed(1)} months</td>
                                                    <td className="text-right p-3">{plan.customers}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
