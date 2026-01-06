import pb from '../lib/pocketbase';
import { Fee, Invoice, Student } from '../apps/school/types';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Expense extends RecordModel {
    category: string;
    amount: number;
    date: string;
    description: string;
    approved_by: string;
}

// Platform Finance Interfaces
export interface Transaction extends RecordModel {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    status: 'Completed' | 'Pending' | 'Failed';
    category: string;
    reference_id?: string;
}

export interface FinancialSummary {
    totalRevenue: number;
    pendingInvoices: number;
    expensesMTD: number;
    revenueGrowth: number;
}

export interface RevenueReport {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', collectionId: 'transactions', collectionName: 'transactions', created: '', updated: '', date: '2025-12-01', description: 'Stripe Payout', amount: 4500.00, type: 'income', status: 'Completed', category: 'Sales' },
    { id: 't2', collectionId: 'transactions', collectionName: 'transactions', created: '', updated: '', date: '2025-11-30', description: 'AWS Infrastructure', amount: 320.50, type: 'expense', status: 'Completed', category: 'Infrastructure' },
    { id: 't3', collectionId: 'transactions', collectionName: 'transactions', created: '', updated: '', date: '2025-11-29', description: 'School Subscription #8821', amount: 299.00, type: 'income', status: 'Completed', category: 'Subscription' },
    { id: 't4', collectionId: 'transactions', collectionName: 'transactions', created: '', updated: '', date: '2025-11-28', description: 'Marketing Ads', amount: 150.00, type: 'expense', status: 'Pending', category: 'Marketing' },
    { id: 't5', collectionId: 'transactions', collectionName: 'transactions', created: '', updated: '', date: '2025-11-28', description: 'Consulting Fee', amount: 1200.00, type: 'income', status: 'Completed', category: 'Services' },
];

const MOCK_REPORT: RevenueReport[] = [
    { month: 'Jul', revenue: 12000, expenses: 4000, profit: 8000 },
    { month: 'Aug', revenue: 15000, expenses: 4500, profit: 10500 },
    { month: 'Sep', revenue: 18000, expenses: 5000, profit: 13000 },
    { month: 'Oct', revenue: 22000, expenses: 6000, profit: 16000 },
    { month: 'Nov', revenue: 25000, expenses: 7000, profit: 18000 },
    { month: 'Dec', revenue: 28000, expenses: 8000, profit: 20000 },
];

export const financeService = {
    /**
     * Get all fee structures
     */
    async getFees() {
        return await pb.collection('fees').getFullList<Fee>({
            sort: 'name',
            requestKey: null
        });
    },

    /**
     * Create a new fee structure
     */
    async createFee(data: Partial<Fee>) {
        return await pb.collection('fees').create(data);
    },

    /**
     * Delete a fee structure
     */
    async deleteFee(id: string) {
        return await pb.collection('fees').delete(id);
    },

    /**
     * Get all invoices
     */
    async getInvoices(filter?: string) {
        return await pb.collection('invoices').getFullList<Invoice>({
            filter: filter || '',
            expand: 'student,fee',
            sort: '-created',
            requestKey: null
        });
    },

    /**
     * Create a single invoice
     */
    async createInvoice(data: Partial<Invoice>) {
        return await pb.collection('invoices').create(data);
    },

    /**
     * Update invoice status
     */
    async updateInvoiceStatus(id: string, status: Invoice['status']) {
        return await pb.collection('invoices').update(id, { status });
    },

    /**
     * Generate invoices for a specific fee for all students in a class
     */
    async generateInvoicesForClass(classId: string, feeId: string) {
        // 1. Get all students in the class
        const enrollments = await pb.collection('enrollments').getFullList({
            filter: `class = "${classId}"`,
            requestKey: null
        });

        if (enrollments.length === 0) return 0;

        // 2. Get fee details
        const fee = await pb.collection('fees').getOne<Fee>(feeId);

        // 3. Create invoices for each student
        const promises = enrollments.map(enrollment => {
            return pb.collection('invoices').create({
                student: enrollment.student,
                fee: feeId,
                amount: fee.amount,
                status: 'Pending'
            });
        });

        await Promise.all(promises);
        return enrollments.length;
    },

    /**
     * Get financial stats
     */
    async getStats() {
        const invoices = await this.getInvoices();

        const totalRevenue = invoices
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => sum + i.amount, 0);

        const outstanding = invoices
            .filter(i => i.status === 'Pending' || i.status === 'Overdue')
            .reduce((sum, i) => sum + i.amount, 0);

        // Simple "collected this month" logic (filtering by created date string match)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const collectedThisMonth = invoices
            .filter(i => i.status === 'Paid' && i.updated.startsWith(currentMonth))
            .reduce((sum, i) => sum + i.amount, 0);

        return {
            totalRevenue,
            outstanding,
            collectedThisMonth
        };
    },

    /**
     * Get expenses (kept for compatibility)
     */
    async getExpenses() {
        return await pb.collection('expenses').getFullList<Expense>({
            sort: '-date',
            requestKey: null
        });
    },

    // Platform Finance Methods
    async getTransactions() {
        try {
            if (isMockEnv()) {
                return [...MOCK_TRANSACTIONS];
            }
            const records = await pb.collection('transactions').getFullList<Transaction>({
                sort: '-date',
                requestKey: null
            });
            return records;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return isMockEnv() ? [...MOCK_TRANSACTIONS] : [];
        }
    },

    async createTransaction(data: Partial<Transaction>) {
        if (isMockEnv()) {
            const newTx: Transaction = {
                id: `mock-tx-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'transactions',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                date: new Date().toISOString().slice(0, 10),
                description: data.description || 'Mock Transaction',
                amount: data.amount || 0,
                type: (data.type as Transaction['type']) || 'income',
                status: (data.status as Transaction['status']) || 'Completed',
                category: data.category || 'General',
            } as Transaction;
            MOCK_TRANSACTIONS.unshift(newTx);
            return newTx;
        }
        return await pb.collection('transactions').create(data);
    },

    async deleteTransaction(id: string) {
        if (isMockEnv()) {
            const idx = MOCK_TRANSACTIONS.findIndex(t => t.id === id);
            if (idx >= 0) MOCK_TRANSACTIONS.splice(idx, 1);
            return true;
        }
        return await pb.collection('transactions').delete(id);
    },

    async getPlatformSummary(): Promise<FinancialSummary> {
        try {
            const transactions = await this.getTransactions();

            const totalRevenue = transactions
                .filter(t => t.type === 'income' && t.status === 'Completed')
                .reduce((sum, t) => sum + t.amount, 0);

            const pendingInvoices = transactions
                .filter(t => t.status === 'Pending')
                .reduce((sum, t) => sum + t.amount, 0);

            const currentMonth = new Date().toISOString().slice(0, 7);
            const lastMonthDate = new Date();
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
            const lastMonth = lastMonthDate.toISOString().slice(0, 7);

            const expensesMTD = transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            const currentMonthRevenue = transactions
                .filter(t => t.type === 'income' && t.status === 'Completed' && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            const lastMonthRevenue = transactions
                .filter(t => t.type === 'income' && t.status === 'Completed' && t.date.startsWith(lastMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            let revenueGrowth = 0;
            if (lastMonthRevenue > 0) {
                revenueGrowth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
            } else if (currentMonthRevenue > 0) {
                revenueGrowth = 100; // 100% growth if starting from 0
            }

            return {
                totalRevenue,
                pendingInvoices,
                expensesMTD,
                revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
            };
        } catch (error) {
            const fallbackRevenue = MOCK_TRANSACTIONS.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const fallbackPending = MOCK_TRANSACTIONS.filter(t => t.status === 'Pending').reduce((s, t) => s + t.amount, 0);
            const fallbackExpenses = MOCK_TRANSACTIONS.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            return {
                totalRevenue: fallbackRevenue,
                pendingInvoices: fallbackPending,
                expensesMTD: fallbackExpenses,
                revenueGrowth: 8
            };
        }
    },

    async getRevenueReport(): Promise<RevenueReport[]> {
        try {
            const transactions = await this.getTransactions();
            const reportMap = new Map<string, RevenueReport>();

            transactions.forEach(t => {
                const month = t.date.slice(0, 7); // YYYY-MM
                if (!reportMap.has(month)) {
                    reportMap.set(month, { month, revenue: 0, expenses: 0, profit: 0 });
                }
                const entry = reportMap.get(month)!;
                if (t.type === 'income' && t.status === 'Completed') {
                    entry.revenue += t.amount;
                } else if (t.type === 'expense') {
                    entry.expenses += t.amount;
                }
                entry.profit = entry.revenue - entry.expenses;
            });

            return Array.from(reportMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        } catch (error) {
            return isMockEnv() ? [...MOCK_REPORT] : [];
        }
    }
};
