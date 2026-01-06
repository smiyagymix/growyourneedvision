import { useCallback, useEffect, useMemo, useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { DataQueryResult } from '../../../hooks/useDataQuery';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Input } from '../../../components/shared/ui/Input';
import { Select } from '../../../components/shared/ui/Select';
import { schoolFinanceService, ExpenseRecord } from '../../../services/schoolFinanceService';
import { useToast } from '../../../hooks/useToast';
import { sanitizeText } from '../../../utils/sanitization';
import { expenseSchema } from '../../../validation/schemas';

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    approved_by?: string;
}

export const ExpenseManager: React.FC = () => {
    const { addToast } = useToast();
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        title: '',
        amount: 0,
        category: 'Supplies',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const items = await schoolFinanceService.listExpenses(search || undefined);
            setExpenses(items);
        } catch (e) {
            console.error(e);
            addToast('Failed to load expenses', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, search]);

    const isFormValid = useMemo(() => {
        const hasTitle = Boolean(newExpense.title && newExpense.title.trim().length >= 3);
        const hasAmount = Number(newExpense.amount) > 0;
        const hasDate = Boolean(newExpense.date);
        const hasCategory = Boolean(newExpense.category);
        return hasTitle && hasAmount && hasDate && hasCategory;
    }, [newExpense.amount, newExpense.category, newExpense.date, newExpense.title]);

    const formatCurrency = useCallback((value: number) => {
        if (Number.isNaN(value)) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }, []);

    const handleCreate = async () => {
        if (!isFormValid) {
            addToast('Please provide a title (min 3 chars), amount, date, and category.', 'warning');
            return;
        }

        // Validate with Zod
        const validationResult = expenseSchema.safeParse({
            title: newExpense.title,
            amount: Number(newExpense.amount),
            category: newExpense.category,
            date: newExpense.date,
            status: newExpense.status
        });

        if (!validationResult.success) {
            addToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Sanitize inputs to prevent XSS
            const sanitizedTitle = sanitizeText(newExpense.title || '');

            await schoolFinanceService.createExpense({
                title: sanitizedTitle,
                amount: Number(newExpense.amount) || 0,
                category: newExpense.category || 'Other',
                date: newExpense.date || new Date().toISOString().split('T')[0],
                status: newExpense.status,
            });
            setIsModalOpen(false);
            await loadData();
            setNewExpense({ title: '', amount: 0, category: 'Supplies', date: new Date().toISOString().split('T')[0], status: 'Pending' });
            addToast('Expense recorded successfully', 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to record expense', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = useCallback(async (id: string, status: string) => {
        setStatusUpdatingId(id);
        try {
            await schoolFinanceService.updateExpenseStatus(id, status as any);
            await loadData();
            addToast(`Expense ${status.toLowerCase()}`, 'success');
        } catch (e) {
            console.error(e);
            addToast('Failed to update expense', 'error');
        } finally {
            setStatusUpdatingId(null);
        }
    }, [addToast, loadData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const t = setTimeout(() => {
            loadData();
        }, 250);
        return () => clearTimeout(t);
    }, [loadData, search]);

    const columns: Column<ExpenseRecord>[] = useMemo(() => [
        { header: 'Title', accessor: 'title', sortable: true },
        { header: 'Category', accessor: 'category', sortable: true },
        { header: 'Date', accessor: (e: ExpenseRecord) => new Date(e.date).toLocaleDateString(), sortable: true },
        { header: 'Amount', accessor: (e: ExpenseRecord) => formatCurrency(e.amount), sortable: true },
        { 
            header: 'Status', 
            accessor: (e: ExpenseRecord) => (
                <Badge variant={e.status === 'Approved' ? 'success' : e.status === 'Rejected' ? 'danger' : 'warning'}>
                    {e.status}
                </Badge>
            ) 
        },
        {
            header: 'Actions',
            accessor: (e: ExpenseRecord) => (
                <div className="flex gap-2">
                    {e.status === 'Pending' && (
                        <>
                            <Button size="sm" variant="ghost" className="text-green-600" disabled={statusUpdatingId === e.id}
                                onClick={() => handleStatusChange(e.id, 'Approved')}>
                                {statusUpdatingId === e.id ? 'Saving…' : 'Approve'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" disabled={statusUpdatingId === e.id}
                                onClick={() => handleStatusChange(e.id, 'Rejected')}>
                                {statusUpdatingId === e.id ? 'Saving…' : 'Reject'}
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ], [formatCurrency, handleStatusChange, statusUpdatingId]);

    // Adapter to reuse shared DataTable component expecting DataQueryResult
    const tableQuery: DataQueryResult<ExpenseRecord> = useMemo(() => ({
        items: expenses,
        totalItems: expenses.length,
        totalPages: 1,
        loading,
        error: null,
        page: 1,
        perPage: Math.max(expenses.length, 1),
        sort: '',
        filter: search,
        setPage: () => {},
        setPerPage: () => {},
        setSort: () => {},
        setFilter: () => {},
        refresh: loadData,
        exportData: async () => {},
    }), [expenses, loading, loadData, search]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Expense Management</h2>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>Record Expense</Button>
            </div>

            <DataToolbar 
                collectionName="expenses_view"
                onSearch={(term) => setSearch(term)}
                onExport={() => {}}
                onRefresh={loadData}
                loading={loading}
            />

            <DataTable
                query={tableQuery}
                columns={columns}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
                <div className="space-y-4">
                    <Input label="Title" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input label="Amount" type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                            <Input label="Date" type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <Select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                            <option value="Supplies">Supplies</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Events">Events</option>
                            <option value="Other">Other</option>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreate} disabled={!isFormValid || submitting}>
                            {submitting ? 'Saving…' : 'Save Expense'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
