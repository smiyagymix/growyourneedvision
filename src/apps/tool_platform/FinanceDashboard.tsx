import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Badge } from '../../components/shared/ui/CommonUI';
import { financeService, Transaction, FinancialSummary, RevenueReport } from '../../services/financeService';
import { AddTransactionModal } from '../../components/finance/AddTransactionModal';
import { z } from 'zod';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category required'),
  description: z.string().max(500, 'Description too long'),
  date: z.string().optional()
});

export const FinanceDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [report, setReport] = useState<RevenueReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txs, sum, rep] = await Promise.all([
                financeService.getTransactions(),
                financeService.getPlatformSummary(),
                financeService.getRevenueReport()
            ]);
            setTransactions(txs);
            setSummary(sum);
            setReport(rep);
        } catch (error) {
            console.error("Failed to fetch finance data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddTransaction = async (data: Partial<Transaction>) => {
        const { showToast } = useToast();

        // Sanitize
        const sanitized = {
            amount: Number(data.amount),
            type: data.type,
            category: sanitizeText(data.category || ''),
            description: sanitizeText(data.description || ''),
            date: data.date
        };

        // Validate
        const result = transactionSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await financeService.createTransaction(result.data as any);
            await fetchData();
            showToast('Transaction added successfully', 'success');
        } catch (error) {
            console.error('Failed to add transaction:', error);
            showToast('Failed to add transaction', 'error');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading financial data...</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Financial Overview</h1>
                <Button onClick={() => setIsModalOpen(true)} icon="PlusIcon" className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">Add Transaction</Button>
            </div>

            {/* Finance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-emerald-100 font-medium text-sm">Total Revenue</p>
                            <h2 className="text-3xl font-black mt-1">${summary?.totalRevenue.toLocaleString()}</h2>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Icon name="CurrencyDollarIcon" className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-100">
                        <Icon name="ArrowTrendingUpIcon" className="w-4 h-4" />
                        <span>+{summary?.revenueGrowth}% vs last month</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Pending Invoices</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white mt-1">${summary?.pendingInvoices.toLocaleString()}</h2>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                            <Icon name="ClockIcon" className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-500">
                        <span>Action Required</span>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Expenses (MTD)</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white mt-1">${summary?.expensesMTD.toLocaleString()}</h2>
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                            <Icon name="CreditCardIcon" className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Server costs, API usage</span>
                    </div>
                </Card>
            </div>

            {/* Revenue Analytics Chart */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white">Revenue Analytics</h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="secondary">Monthly</Button>
                        <Button size="sm" variant="ghost">Quarterly</Button>
                    </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-4">
                    {report.length > 0 ? report.map((item, index) => {
                        const maxVal = Math.max(...report.map(r => r.revenue));
                        const height = maxVal > 0 ? (item.revenue / maxVal) * 100 : 0;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                    <div 
                                        className="w-full bg-emerald-500 dark:bg-emerald-600 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-400"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    {/* Profit marker */}
                                    <div 
                                        className="absolute bottom-0 w-full bg-emerald-700/50 h-1"
                                        style={{ height: `${item.revenue > 0 ? (item.profit / item.revenue) * height : 0}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.month}</div>
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-20 bg-black text-white text-xs p-2 rounded pointer-events-none transition-opacity z-10">
                                    Rev: ${item.revenue.toLocaleString()}<br/>
                                    Prof: ${item.profit.toLocaleString()}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No data available
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <Card className="lg:col-span-3 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-white">Recent Transactions</h3>
                        <Button size="sm" variant="outline" icon="ArrowDownTrayIcon">Export CSV</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions.length > 0 ? transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{t.description}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{t.category}</span>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-800 dark:text-white'}`}>
                                            {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }).replace('$', '')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'}>{t.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-blue-600"><Icon name="EllipsisHorizontalIcon" className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No transactions found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <AddTransactionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddTransaction}
            />
        </div>
    );
};
