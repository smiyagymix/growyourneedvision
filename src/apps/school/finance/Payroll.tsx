import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Select } from '../../../components/shared/ui/Select';
import pb from '../../../lib/pocketbase';
import { User } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import { schoolFinanceService } from '../../../services/schoolFinanceService';
import { useToast } from '../../../hooks/useToast';
import { z } from 'zod';

// Payroll validation schema
const payrollRunSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
    tenantId: z.string().optional()
});

interface PayrollEntry {
    id: string;
    staff: string;
    expand?: { staff?: User };
    amount: number;
    month: string;
    status: 'Pending' | 'Paid';
    paid_at?: string;
}

export const Payroll: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const tenantFilter = user?.tenantId ? `tenantId = "${user.tenantId}"` : undefined;

    const query = useDataQuery<PayrollEntry>('payroll', {
        sort: '-created',
        expand: 'staff',
        filter: tenantFilter,
        requestKey: null
    });

    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [runMonth, setRunMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [processing, setProcessing] = useState(false);

    const handleRunPayroll = async () => {
        setProcessing(true);
        try {
            // Validate with Zod
            const validationResult = payrollRunSchema.safeParse({
                month: runMonth,
                tenantId: user?.tenantId
            });

            if (!validationResult.success) {
                addToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                setProcessing(false);
                return;
            }

            const result = await schoolFinanceService.runPayroll(runMonth);

            addToast(`Generated payroll for ${result.created} staff members.`, 'success');
            setIsRunModalOpen(false);
            query.refresh();
        } catch (e) {
            console.error(e);
            addToast('Failed to run payroll', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const markPaid = async (id: string) => {
        try {
            await schoolFinanceService.updatePayrollStatus(id, 'Paid');
            query.refresh();
        } catch (e) {
            addToast('Update failed', 'error');
        }
    };

    const columns: Column<PayrollEntry>[] = [
        { header: 'Staff Name', accessor: (p: PayrollEntry) => p.expand?.staff?.name || 'Unknown', sortable: true },
        { header: 'Month', accessor: 'month', sortable: true },
        { header: 'Amount', accessor: (p: PayrollEntry) => `$${p.amount}`, sortable: true },
        { 
            header: 'Status', 
            accessor: (p: PayrollEntry) => (
                <Badge variant={p.status === 'Paid' ? 'success' : 'warning'}>
                    {p.status}
                </Badge>
            ) 
        },
        { header: 'Paid Date', accessor: (p: PayrollEntry) => p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-', sortable: true },
        {
            header: 'Actions',
            accessor: (p: PayrollEntry) => (
                <div className="flex gap-2">
                    {p.status === 'Pending' && (
                        <Button size="sm" variant="primary" onClick={() => markPaid(p.id)}>Mark Paid</Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Payroll</h2>
                <Button variant="primary" onClick={() => setIsRunModalOpen(true)}>Run Payroll</Button>
            </div>

            <DataToolbar 
                collectionName="payroll_view"
                onSearch={(term) => query.setFilter(`month ~ "${term}"`)} // Simple search by month for now
                onExport={() => query.exportData('payroll.csv')}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable query={query} columns={columns} />

            <Modal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} title="Run Payroll">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        This will generate pending payroll entries for all active staff members for the selected month.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Month</label>
                        <input 
                            type="month" 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={runMonth}
                            onChange={e => setRunMonth(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsRunModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleRunPayroll} isLoading={processing}>Generate Entries</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
