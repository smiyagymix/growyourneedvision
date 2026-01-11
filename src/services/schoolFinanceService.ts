import env from '../config/environment';
import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { retry } from '../hooks/useRetry';
import { auditLog } from './auditLogger';

export interface FinanceSummary {
    totalRevenue: number;
    outstanding: number;
    totalExpenses: number;
    netIncome: number;
    monthlyTrend?: { month: string; revenue: number; expenses: number }[];
}

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';
export type PayrollStatus = 'Pending' | 'Paid';

export interface ExpenseRecord {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    status: ExpenseStatus;
    description?: string;
    receipt_url?: string;
    approved_by?: string;
    created?: string;
}

export interface PayrollRecord {
    id: string;
    staff: string;
    amount: number;
    month: string;
    status: PayrollStatus;
    paid_at?: string;
    deductions?: number;
    bonus?: number;
    expand?: { staff?: { name?: string; position?: string } };
}

export interface InvoiceRecord {
    id: string;
    student: string;
    fee: string;
    amount: number;
    status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled' | 'Partial';
    due_date: string;
    created: string;
    paid_amount?: number;
    paid_at?: string;
    notes?: string;
    expand?: { student?: { name?: string; email?: string }; fee?: { name?: string; type?: string } };
}

export interface PaginatedResult<T> {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

// Mock data for testing
const MOCK_EXPENSES: ExpenseRecord[] = [
    { id: 'exp-1', title: 'Classroom Supplies', amount: 500, category: 'Supplies', date: new Date().toISOString().split('T')[0], status: 'Approved', created: new Date().toISOString() },
    { id: 'exp-2', title: 'Computer Lab Equipment', amount: 3500, category: 'Equipment', date: new Date().toISOString().split('T')[0], status: 'Pending', created: new Date().toISOString() },
    { id: 'exp-3', title: 'Building Maintenance', amount: 1200, category: 'Maintenance', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Approved', created: new Date().toISOString() }
];

const MOCK_PAYROLL: PayrollRecord[] = [
    { id: 'pay-1', staff: 'staff-1', amount: 4500, month: new Date().toISOString().slice(0, 7), status: 'Paid', paid_at: new Date().toISOString(), expand: { staff: { name: 'Dr. Smith', position: 'Teacher' } } },
    { id: 'pay-2', staff: 'staff-2', amount: 4200, month: new Date().toISOString().slice(0, 7), status: 'Pending', expand: { staff: { name: 'Ms. Johnson', position: 'Teacher' } } },
    { id: 'pay-3', staff: 'staff-3', amount: 3800, month: new Date().toISOString().slice(0, 7), status: 'Paid', paid_at: new Date().toISOString(), expand: { staff: { name: 'Mr. Brown', position: 'Admin' } } }
];

const MOCK_INVOICES: InvoiceRecord[] = [
    { id: 'inv-1', student: 'student-1', fee: 'fee-1', amount: 1500, status: 'Paid', due_date: new Date().toISOString(), created: new Date().toISOString(), paid_amount: 1500, paid_at: new Date().toISOString(), expand: { student: { name: 'John Smith' }, fee: { name: 'Tuition - Spring 2024' } } },
    { id: 'inv-2', student: 'student-2', fee: 'fee-1', amount: 1500, status: 'Pending', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), created: new Date().toISOString(), expand: { student: { name: 'Jane Doe' }, fee: { name: 'Tuition - Spring 2024' } } },
    { id: 'inv-3', student: 'student-3', fee: 'fee-2', amount: 500, status: 'Overdue', due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), created: new Date().toISOString(), expand: { student: { name: 'Bob Wilson' }, fee: { name: 'Lab Fee' } } }
];

class SchoolFinanceService {
    private apiUrl: string;
    private serviceApiKey: string;

    constructor() {
        this.apiUrl = env.get('apiUrl') || '/api';
        this.serviceApiKey = env.get('serviceApiKey');
    }

    private buildHeaders(): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.serviceApiKey) {
            headers['x-api-key'] = this.serviceApiKey;
        }

        const tenantId = (pb.authStore.model as any)?.tenantId;
        if (tenantId) {
            headers['x-tenant-id'] = tenantId;
        }

        const role = (pb.authStore.model as any)?.role;
        if (role) {
            const elevated = ['Owner', 'SchoolAdmin', 'Admin'].includes(role);
            headers['x-user-role'] = elevated ? 'admin' : String(role);
        }
        const userId = (pb.authStore.model as any)?.id;
        if (userId) headers['x-user-id'] = String(userId);

        return headers;
    }

    async getSummary(): Promise<FinanceSummary> {
        if (isMockEnv()) {
            const totalRevenue = MOCK_INVOICES.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.paid_amount || 0), 0);
            const outstanding = MOCK_INVOICES.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((sum, i) => sum + i.amount, 0);
            const totalExpenses = MOCK_EXPENSES.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);
            return {
                totalRevenue,
                outstanding,
                totalExpenses,
                netIncome: totalRevenue - totalExpenses,
                monthlyTrend: [
                    { month: 'Jan', revenue: 15000, expenses: 8000 },
                    { month: 'Feb', revenue: 16500, expenses: 9200 },
                    { month: 'Mar', revenue: 18000, expenses: 7500 }
                ]
            };
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/summary`, {
                method: 'GET',
                headers: this.buildHeaders(),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to load finance summary');
            }

            return response.json();
        });
    }

    async createExpense(payload: { title: string; amount: number; category: string; date: string; status?: ExpenseStatus; description?: string }): Promise<ExpenseRecord> {
        if (isMockEnv()) {
            const newExpense: ExpenseRecord = {
                id: `exp-${Date.now()}`,
                ...payload,
                status: payload.status || 'Pending',
                created: new Date().toISOString()
            };
            MOCK_EXPENSES.push(newExpense);
            return newExpense;
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/expenses`, {
                method: 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to create expense');
            }

            const record = await response.json();
            await auditLog.log('finance.expense_create', { expense_id: record.id, title: payload.title, amount: payload.amount }, 'info');
            return record;
        });
    }

    async updateExpenseStatus(id: string, status: ExpenseStatus): Promise<ExpenseRecord> {
        if (isMockEnv()) {
            const index = MOCK_EXPENSES.findIndex(e => e.id === id);
            if (index === -1) throw new Error('Expense not found');
            MOCK_EXPENSES[index].status = status;
            return MOCK_EXPENSES[index];
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/expenses/${id}/status`, {
                method: 'PATCH',
                headers: this.buildHeaders(),
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to update expense');
            }

            const record = await response.json();
            await auditLog.log('finance.expense_status_update', { expense_id: id, status }, 'info');
            return record;
        });
    }

    async listExpenses(search?: string): Promise<ExpenseRecord[]> {
        if (isMockEnv()) {
            if (!search) return MOCK_EXPENSES;
            const lowerSearch = search.toLowerCase();
            return MOCK_EXPENSES.filter(e =>
                e.title.toLowerCase().includes(lowerSearch) ||
                e.category.toLowerCase().includes(lowerSearch)
            );
        }

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const response = await fetch(`${this.apiUrl}/school/finance/expenses?${params.toString()}`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to load expenses');
        }

        return response.json();
    }

    async runPayroll(month: string): Promise<{ created: number }> {
        if (isMockEnv()) {
            // Simulate creating payroll for 5 staff members
            return { created: 5 };
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/payroll/run`, {
                method: 'POST',
                headers: this.buildHeaders(),
                body: JSON.stringify({ month }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to run payroll');
            }

            const result = await response.json();
            await auditLog.log('finance.payroll_run', { month, created: result.created }, 'info');
            return result;
        });
    }

    async updatePayrollStatus(id: string, status: PayrollStatus): Promise<PayrollRecord> {
        if (isMockEnv()) {
            const index = MOCK_PAYROLL.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Payroll record not found');
            MOCK_PAYROLL[index].status = status;
            if (status === 'Paid') {
                MOCK_PAYROLL[index].paid_at = new Date().toISOString();
            }
            return MOCK_PAYROLL[index];
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/payroll/${id}/status`, {
                method: 'PATCH',
                headers: this.buildHeaders(),
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to update payroll');
            }

            const record = await response.json();
            await auditLog.log('finance.payroll_status_update', { payroll_id: id, status }, 'info');
            return record;
        });
    }

    async listPayroll(search?: string): Promise<PayrollRecord[]> {
        if (isMockEnv()) {
            if (!search) return MOCK_PAYROLL;
            const lowerSearch = search.toLowerCase();
            return MOCK_PAYROLL.filter(p =>
                p.expand?.staff?.name?.toLowerCase().includes(lowerSearch) ||
                p.month.includes(search)
            );
        }

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const response = await fetch(`${this.apiUrl}/school/finance/payroll?${params.toString()}`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to load payroll');
        }

        return response.json();
    }

    async listInvoices(options: { page?: number; perPage?: number; search?: string; sort?: string; status?: string; dueFrom?: string; dueTo?: string; studentName?: string; feeName?: string } = {}): Promise<PaginatedResult<InvoiceRecord>> {
        if (isMockEnv()) {
            let filtered = [...MOCK_INVOICES];

            if (options.search) {
                const lowerSearch = options.search.toLowerCase();
                filtered = filtered.filter(i =>
                    i.expand?.student?.name?.toLowerCase().includes(lowerSearch) ||
                    i.expand?.fee?.name?.toLowerCase().includes(lowerSearch)
                );
            }
            if (options.status) {
                filtered = filtered.filter(i => i.status === options.status);
            }
            if (options.studentName) {
                filtered = filtered.filter(i =>
                    i.expand?.student?.name?.toLowerCase().includes(options.studentName!.toLowerCase())
                );
            }

            const page = options.page || 1;
            const perPage = options.perPage || 20;
            const start = (page - 1) * perPage;
            const items = filtered.slice(start, start + perPage);

            return {
                page,
                perPage,
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage),
                items
            };
        }

        const params = new URLSearchParams();
        if (options.page) params.append('page', String(options.page));
        if (options.perPage) params.append('perPage', String(options.perPage));
        if (options.search) params.append('search', options.search);
        if (options.sort) params.append('sort', options.sort);
        if (options.status) params.append('status', options.status);
        if (options.dueFrom) params.append('dueFrom', options.dueFrom);
        if (options.dueTo) params.append('dueTo', options.dueTo);
        if (options.studentName) params.append('studentName', options.studentName);
        if (options.feeName) params.append('feeName', options.feeName);
        const response = await fetch(`${this.apiUrl}/school/finance/invoices?${params.toString()}`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to load invoices');
        }

        return response.json();
    }

    async exportInvoices(options: { search?: string; sort?: string; status?: string; dueFrom?: string; dueTo?: string; studentName?: string; feeName?: string } = {}): Promise<Blob> {
        const params = new URLSearchParams();
        if (options.search) params.append('search', options.search);
        if (options.sort) params.append('sort', options.sort);
        if (options.status) params.append('status', options.status);
        if (options.dueFrom) params.append('dueFrom', options.dueFrom);
        if (options.dueTo) params.append('dueTo', options.dueTo);
        if (options.studentName) params.append('studentName', options.studentName);
        if (options.feeName) params.append('feeName', options.feeName);

        const response = await fetch(`${this.apiUrl}/school/finance/invoices/export?${params.toString()}`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to export invoices');
        }

        return response.blob();
    }

    async sendInvoiceReminders(invoiceIds: string[], options: { channels?: { email?: boolean; sms?: boolean; inApp?: boolean }; message?: string; throttleSeconds?: number } = {}) {
        if (isMockEnv()) {
            return { sent: invoiceIds.length, failed: 0 };
        }

        const response = await fetch(`${this.apiUrl}/school/finance/invoices/reminders`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({ invoiceIds, ...options }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to send reminders');
        }
        return response.json();
    }

    async uploadPaymentProof(invoiceId: string, payload: { proofUrl: string; note?: string }) {
        if (isMockEnv()) {
            const index = MOCK_INVOICES.findIndex(i => i.id === invoiceId);
            if (index !== -1) {
                MOCK_INVOICES[index].notes = payload.note;
            }
            return { success: true };
        }

        const response = await fetch(`${this.apiUrl}/school/finance/invoices/${invoiceId}/proof`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to upload proof');
        }
        return response.json();
    }

    async downloadReceiptPdf(invoiceId: string): Promise<Blob> {
        if (isMockEnv()) {
            // Return a mock PDF blob
            return new Blob(['Mock PDF content'], { type: 'application/pdf' });
        }

        const response = await fetch(`${this.apiUrl}/school/finance/invoices/${invoiceId}/receipt.pdf`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Receipt unavailable');
        }
        return response.blob();
    }

    async searchStudents(term: string) {
        if (isMockEnv()) {
            const mockStudents = [
                { id: 'student-1', name: 'John Smith', email: 'john@school.com' },
                { id: 'student-2', name: 'Jane Doe', email: 'jane@school.com' },
                { id: 'student-3', name: 'Bob Wilson', email: 'bob@school.com' }
            ];
            if (!term) return mockStudents;
            const lowerTerm = term.toLowerCase();
            return mockStudents.filter(s =>
                s.name.toLowerCase().includes(lowerTerm) ||
                s.email.toLowerCase().includes(lowerTerm)
            );
        }

        const params = new URLSearchParams();
        if (term) params.append('term', term);
        const response = await fetch(`${this.apiUrl}/school/finance/students/search?${params.toString()}`, {
            method: 'GET',
            headers: this.buildHeaders(),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to search students');
        }
        return response.json();
    }

    // =============== ADDITIONAL METHODS ===============

    /**
     * Get expense categories
     */
    async getExpenseCategories(): Promise<string[]> {
        if (isMockEnv()) {
            return ['Supplies', 'Equipment', 'Maintenance', 'Utilities', 'Salaries', 'Transportation', 'Events', 'Other'];
        }

        const expenses = await this.listExpenses();
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories);
    }

    /**
     * Get expense statistics
     */
    async getExpenseStatistics(dateRange?: { start: string; end: string }) {
        const expenses = await this.listExpenses();
        let filtered = expenses;

        if (dateRange) {
            filtered = expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);
        }

        const byCategory: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        let total = 0;

        for (const expense of filtered) {
            byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
            byStatus[expense.status] = (byStatus[expense.status] || 0) + expense.amount;
            total += expense.amount;
        }

        return {
            total,
            count: filtered.length,
            byCategory,
            byStatus,
            averageAmount: filtered.length > 0 ? total / filtered.length : 0
        };
    }

    /**
     * Get payroll statistics
     */
    async getPayrollStatistics(month?: string) {
        const payroll = await this.listPayroll();
        let filtered = payroll;

        if (month) {
            filtered = payroll.filter(p => p.month === month);
        }

        const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
        const paidAmount = filtered.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = filtered.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

        return {
            totalRecords: filtered.length,
            totalAmount,
            paidAmount,
            pendingAmount,
            paidCount: filtered.filter(p => p.status === 'Paid').length,
            pendingCount: filtered.filter(p => p.status === 'Pending').length
        };
    }

    /**
     * Get invoice statistics
     */
    async getInvoiceStatistics() {
        const result = await this.listInvoices({ perPage: 1000 });
        const invoices = result.items;

        const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
        const paidAmount = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.paid_amount || i.amount), 0);
        const overdueAmount = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);

        return {
            totalInvoices: invoices.length,
            totalAmount,
            paidAmount,
            overdueAmount,
            pendingAmount: totalAmount - paidAmount,
            collectionRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
            byStatus: {
                Paid: invoices.filter(i => i.status === 'Paid').length,
                Pending: invoices.filter(i => i.status === 'Pending').length,
                Overdue: invoices.filter(i => i.status === 'Overdue').length,
                Cancelled: invoices.filter(i => i.status === 'Cancelled').length,
                Partial: invoices.filter(i => i.status === 'Partial').length
            }
        };
    }

    /**
     * Update invoice status
     */
    async updateInvoiceStatus(invoiceId: string, status: InvoiceRecord['status'], paidAmount?: number): Promise<InvoiceRecord> {
        if (isMockEnv()) {
            const index = MOCK_INVOICES.findIndex(i => i.id === invoiceId);
            if (index === -1) throw new Error('Invoice not found');
            MOCK_INVOICES[index].status = status;
            if (status === 'Paid') {
                MOCK_INVOICES[index].paid_amount = paidAmount || MOCK_INVOICES[index].amount;
                MOCK_INVOICES[index].paid_at = new Date().toISOString();
            }
            return MOCK_INVOICES[index];
        }

        return await retry(async () => {
            const response = await fetch(`${this.apiUrl}/school/finance/invoices/${invoiceId}/status`, {
                method: 'PATCH',
                headers: this.buildHeaders(),
                body: JSON.stringify({ status, paidAmount }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Failed to update invoice');
            }

            const record = await response.json();
            await auditLog.log('finance.invoice_status_update', { invoice_id: invoiceId, status, paidAmount: paidAmount ?? null }, 'info');
            return record;
        });
    }
}

export const schoolFinanceService = new SchoolFinanceService();
