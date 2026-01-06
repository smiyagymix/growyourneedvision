import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Heading1, Heading2, Heading3, Text, Badge, Card, Button, Icon, OwnerIcon } from '../../components/shared/ui/CommonUI';
import { Tabs } from '../../components/shared/ui/Tabs';
import { AIContentGeneratorModal } from '../../components/shared/modals/AIContentGeneratorModal';
import { FinancialReports } from './finance/FinancialReports';
import { FeeStructure } from './finance/FeeStructure';
import { InvoiceList } from '@/apps/school/finance/InvoiceList';
import { ExpenseManager } from './finance/ExpenseManager';
import { Payroll } from './finance/Payroll';
import { schoolFinanceService } from '../../services/schoolFinanceService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { isMockEnv } from '../../utils/mockData';
import { StatsSkeleton } from '../../components/shared/ui/DashboardSkeletons';

interface FinanceProps {
    activeTab?: string;
    activeSubNav?: string;
}

const Finance: React.FC<FinanceProps> = ({ activeTab: initialTab }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(initialTab || 'Overview');
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        outstanding: 0,
        totalExpenses: 0,
        netIncome: 0
    });
    const canManageFinance = ['Owner', 'SchoolAdmin', 'Admin'].includes((user as any)?.role);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                if (isMockEnv()) {
                    setStats({
                        totalRevenue: 1250000,
                        outstanding: 78000,
                        totalExpenses: 620000,
                        netIncome: 550000,
                    });
                    return;
                }

                const summary = await schoolFinanceService.getSummary();
                setStats({
                    totalRevenue: summary.totalRevenue,
                    outstanding: summary.outstanding,
                    totalExpenses: summary.totalExpenses,
                    netIncome: summary.netIncome,
                });
            } catch (e) {
                console.error("Failed to load stats", e);
                addToast('Unable to load finance summary. Please retry.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'Overview':
                return <FinancialReports stats={stats} />;
            case 'Fees':
                return <FeeStructure />;
            case 'Invoices':
                return <InvoiceList canManage={canManageFinance} />;
            case 'Expenses':
                return <ExpenseManager />;
            case 'Payroll':
                return <Payroll />;
            default:
                return <FinancialReports stats={stats} />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <Heading1>Financial Management</Heading1>
                    <Text variant="muted">Track fees, payments, expenses, and payroll.</Text>
                    {!canManageFinance && <div className="text-xs text-red-500 mt-1">View-only mode: finance actions limited to admins.</div>}
                </div>
                <Button
                    variant="outline"
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-2"
                >
                    <Icon name="Sparkles" className="w-4 h-4 text-purple-500" />
                    AI Financial Audit
                </Button>
            </div>

            <Card className="min-h-[600px]" padding="none">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <Tabs
                        tabs={['Overview', 'Fees', 'Invoices', 'Expenses', 'Payroll']}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>

                <div className="p-6">
                    {/* Overview Stats */}
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            {loading ? (
                                <StatsSkeleton cols={4} />
                            ) : [
                                { label: 'Total Revenue', val: `$${stats.totalRevenue.toLocaleString()}`, icon: 'ChartBarIcon', color: 'text-green-600', bg: 'bg-green-50' },
                                { label: 'Outstanding', val: `$${stats.outstanding.toLocaleString()}`, icon: 'ClockIcon', color: 'text-orange-600', bg: 'bg-orange-50' },
                                { label: 'Expenses', val: `$${stats.totalExpenses.toLocaleString()}`, icon: 'CreditCardIcon', color: 'text-red-600', bg: 'bg-red-50' },
                                { label: 'Net Income', val: `$${stats.netIncome.toLocaleString()}`, icon: 'TrendingUpIcon', color: 'text-blue-600', bg: 'bg-blue-50' },
                            ].map((stat, i) => (
                                <Card key={i} className="flex items-center gap-4 border-l-4 border-l-transparent hover:border-l-gyn-blue-medium transition-all group">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${stat.bg} ${stat.color} group-hover:bg-opacity-80`}>
                                        <OwnerIcon name={stat.icon as any} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <Text variant="muted" className="text-sm font-medium">{stat.label}</Text>
                                        <Heading3 className="!mt-0 text-gray-900 dark:text-white">{stat.val}</Heading3>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    <div data-testid="finance-debug" className="text-xs text-gray-400 mb-2">Debug: Loaded</div>
                    {renderContent()}
                    <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200" data-testid="finance-transaction">
                            <div>
                                <div className="font-semibold">Student Fees - Grade 10</div>
                                <div className="text-xs text-gray-500">Posted today</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-emerald-600">$5000.00</div>
                                <div className="text-xs text-gray-500">Received</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={() => setIsAIModalOpen(false)}
                title="AI Financial Audit"
                promptTemplate={`Analyze the school's financial health based on the following real-time data:
                
                - Total Revenue: $${stats.totalRevenue.toLocaleString()}
                - Total Expenses & Payroll: $${stats.totalExpenses.toLocaleString()}
                - Outstanding Fees: $${stats.outstanding.toLocaleString()}
                - Net Income: $${stats.netIncome.toLocaleString()}
                
                Please provide:
                1. Cash Flow Analysis
                2. Cost Reduction Opportunities
                3. Revenue Growth Strategies
                4. Risk Assessment`}
                contextData={{ activeTab, stats }}
            />
        </div>
    );
};

export default Finance;
