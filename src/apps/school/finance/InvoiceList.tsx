import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { DataQueryResult } from '../../../hooks/useDataQuery';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Select } from '../../../components/shared/ui/Select';
import { Input } from '../../../components/shared/ui/Input';
import { Text } from '../../../components/shared/ui/Typography';
import pb from '../../../lib/pocketbase';
import { useAuth, User } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import { schoolFinanceService, InvoiceRecord } from '../../../services/schoolFinanceService';
import { invoiceSchema } from '../../../validation/schemas';

export const InvoiceList: React.FC<{ canManage?: boolean }> = ({ canManage = true }) => {
    const { user }: { user: User | null } = useAuth();
    const { addToast } = useToast();
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sort, setSort] = useState('-created');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [dueFrom, setDueFrom] = useState<string>('');
    const [dueTo, setDueTo] = useState<string>('');
    const [studentName, setStudentName] = useState('');
    const [feeName, setFeeName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<string>('');

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
    const [paymentData, setPaymentData] = useState({ amount: 0, method: 'Cash', reference: '' });
    const [paymentsTotal, setPaymentsTotal] = useState<Record<string, number>>({});

    const [generateForm, setGenerateForm] = useState({ classId: '', feeId: '' });
    const [classes, setClasses] = useState<any[]>([]);
    const [fees, setFees] = useState<any[]>([]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [reminderForm, setReminderForm] = useState({ message: '', email: true, sms: false, inApp: true, throttleSeconds: 30 });
    const [proofModal, setProofModal] = useState<{ open: boolean; invoice: InvoiceRecord | null; proofUrl: string; note: string }>({ open: false, invoice: null, proofUrl: '', note: '' });
    const [studentOptions, setStudentOptions] = useState<string[]>([]);
    const [studentFetchLoading, setStudentFetchLoading] = useState(false);

    const isAdmin = useMemo(() => ['Owner', 'SchoolAdmin', 'Admin'].includes((user as any)?.role) && canManage, [user, canManage]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await schoolFinanceService.listInvoices({
                page,
                perPage,
                search: search || undefined,
                sort,
                status: statusFilter || undefined,
                dueFrom: dueFrom || undefined,
                dueTo: dueTo || undefined,
                studentName: studentName || undefined,
                feeName: feeName || undefined,
            });
            setInvoices(result.items);
            setTotalItems(result.totalItems || result.items.length);
            setTotalPages(result.totalPages || 1);
            setPage(result.page || 1);
            setPerPage(result.perPage || perPage);
            setLastRefreshed(new Date().toLocaleString());
            setSelectedIds([]);
        } catch (e: any) {
            console.error('Failed to load invoices', e);
            setError(e);
            addToast('Failed to load invoices', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast, page, perPage, search, sort, statusFilter, dueFrom, dueTo, studentName, feeName]);

    useEffect(() => {
        if (isGenerateModalOpen) {
            pb.collection('school_classes').getList(1, 50, { sort: 'name', filter: user?.tenantId ? `tenantId = "${user.tenantId}"` : undefined }).then(res => setClasses(res.items));
            pb.collection('fees').getList(1, 50, { sort: 'name', filter: user?.tenantId ? `tenantId = "${user.tenantId}"` : undefined }).then(res => setFees(res.items));
        }
    }, [isGenerateModalOpen, user?.tenantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            loadData();
        }, 300);
        return () => clearTimeout(t);
    }, [loadData, search]);

    useEffect(() => {
        setPage(1);
        loadData();
    }, [statusFilter, dueFrom, dueTo, perPage, studentName, feeName, loadData]);

    useEffect(() => {
        if (!studentName || studentName.length < 2) {
            setStudentOptions([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                setStudentFetchLoading(true);
                const results = await schoolFinanceService.searchStudents(studentName);
                setStudentOptions(results.map((r: any) => r.name).filter(Boolean));
            } catch (err) {
                console.warn('Student search failed', err);
            } finally {
                setStudentFetchLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [studentName]);

    const handleGenerate = async () => {
        if (!isAdmin) {
            addToast('Only admins can generate invoices', 'warning');
            return;
        }
        if (!generateForm.classId || !generateForm.feeId) {
            addToast('Select a class and fee before generating invoices.', 'error');
            return;
        }
        try {
            const enrollments = await pb.collection('enrollments').getFullList({
                filter: `class = "${generateForm.classId}"`,
                expand: 'student',
                requestKey: null
            });

            const fee = fees.find(f => f.id === generateForm.feeId);
            if (!fee) return;

            let created = 0;
            let skipped = 0;
            for (const enr of enrollments) {
                const existing = await pb.collection('school_invoices').getList(1, 1, {
                    filter: `student = "${enr.student}" && fee = "${fee.id}" && status != "Cancelled"`,
                    requestKey: null
                });
                if (existing.items.length > 0) {
                    skipped++;
                    continue;
                }

                // Validate with Zod
                const invoiceData = {
                    student: enr.student,
                    fee: fee.id,
                    amount: fee.amount,
                    status: 'Pending' as const,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    tenantId: user?.tenantId || ''
                };

                const validationResult = invoiceSchema.safeParse(invoiceData);
                if (!validationResult.success) {
                    console.error('Validation error:', validationResult.error.issues[0].message);
                    skipped++;
                    continue;
                }

                await pb.collection('school_invoices').create(invoiceData);
                created++;
            }
            addToast(`Generated ${created} invoices${skipped ? ` • skipped ${skipped} duplicates` : ''}`, 'success');
            setIsGenerateModalOpen(false);
            loadData();
        } catch (e) {
            console.error(e);
            addToast('Failed to generate invoices', 'error');
        }
    };

    const fetchPaidTotal = async (invoiceId: string) => {
        try {
            const payments = await pb.collection('school_payments').getFullList({
                filter: `invoice = "${invoiceId}"`,
                requestKey: null
            });
            const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            setPaymentsTotal(prev => ({ ...prev, [invoiceId]: total }));
            return total;
        } catch (err) {
            console.error('Failed to load payments', err);
            return 0;
        }
    };

    const openPaymentModal = async (invoice: InvoiceRecord) => {
        setSelectedInvoice(invoice);
        const paid = await fetchPaidTotal(invoice.id);
        const remaining = Math.max(invoice.amount - paid, 0);
        setPaymentData({ amount: remaining || invoice.amount, method: 'Cash', reference: '' });
        setIsPaymentModalOpen(true);
    };

    const handleRecordPayment = async () => {
        if (!isAdmin) {
            addToast('Only admins can record payments', 'warning');
            return;
        }
        if (!selectedInvoice) return;
        try {
            const paid = paymentsTotal[selectedInvoice.id] ?? (await fetchPaidTotal(selectedInvoice.id));
            const remaining = Math.max(selectedInvoice.amount - paid, 0);
            if (paymentData.amount <= 0) {
                addToast('Payment amount must be greater than 0', 'error');
                return;
            }
            if (paymentData.amount > remaining) {
                addToast(`Amount exceeds remaining balance ($${remaining})`, 'error');
                return;
            }

            await pb.collection('school_payments').create({
                invoice: selectedInvoice.id,
                student: selectedInvoice.student,
                amount: paymentData.amount,
                method: paymentData.method,
                reference: paymentData.reference,
                date: new Date().toISOString(),
                tenantId: user?.tenantId
            });

            const newPaid = paid + paymentData.amount;
            const newStatus = newPaid >= selectedInvoice.amount ? 'Paid' : 'Partial';
            await pb.collection('school_invoices').update(selectedInvoice.id, { status: newStatus });

            setPaymentsTotal(prev => ({ ...prev, [selectedInvoice.id]: newPaid }));
            setIsPaymentModalOpen(false);
            loadData();
            addToast('Payment recorded successfully', 'success');

            // Lightweight client-side receipt download
            const receipt = [
                `Receipt for Invoice #${selectedInvoice.id.substring(0, 8)}`,
                `Student: ${selectedInvoice.expand?.student?.name || selectedInvoice.student}`,
                `Amount Paid: $${paymentData.amount}`,
                `Method: ${paymentData.method}`,
                `Reference: ${paymentData.reference || 'N/A'}`,
                `Date: ${new Date().toLocaleString()}`,
                `Status: ${newStatus}`
            ].join('\n');
            const blob = new Blob([receipt], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-${selectedInvoice.id.substring(0, 8)}.txt`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            addToast('Failed to record payment', 'error');
        }
    };

    const effectiveStatus = useMemo(() => {
        const now = Date.now();
        const map: Record<string, InvoiceRecord['status'] | 'Partial'> = {};
        invoices.forEach((inv) => {
            const baseStatus = inv.status as InvoiceRecord['status'];
            if (baseStatus === 'Paid' || baseStatus === 'Cancelled') {
                map[inv.id] = baseStatus;
                return;
            }
            const due = new Date(inv.due_date).getTime();
            map[inv.id] = due < now ? 'Overdue' : baseStatus;
        });
        return map;
    }, [invoices]);

    const handleReceiptDownload = async (invoice: InvoiceRecord) => {
        try {
            if (!isAdmin) {
                addToast('Only admins can download receipts', 'warning');
                return;
            }
            const blob = await schoolFinanceService.downloadReceiptPdf(invoice.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice.id.substring(0, 8)}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            console.error(e);
            addToast(e?.message || 'Receipt unavailable', 'error');
        }
    };

    const toggleSelect = (id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const set = new Set(prev);
            if (checked) set.add(id); else set.delete(id);
            return Array.from(set);
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(invoices.map(i => i.id));
        else setSelectedIds([]);
    };

    const openReminderModal = () => {
        if (selectedIds.length === 0) {
            addToast('Select at least one invoice first', 'warning');
            return;
        }
        if (!isAdmin) {
            addToast('Only admins can send reminders', 'warning');
            return;
        }
        setIsReminderModalOpen(true);
    };

    const sendReminders = async () => {
        try {
            await schoolFinanceService.sendInvoiceReminders(selectedIds, {
                channels: { email: reminderForm.email, sms: reminderForm.sms, inApp: reminderForm.inApp },
                message: reminderForm.message,
                throttleSeconds: reminderForm.throttleSeconds,
            });
            addToast(`Queued reminders for ${selectedIds.length} invoices`, 'success');
            setIsReminderModalOpen(false);
        } catch (e: any) {
            console.error(e);
            addToast(e?.message || 'Failed to send reminders', 'error');
        }
    };

    const openProof = (invoice: InvoiceRecord) => {
        if (!isAdmin) {
            addToast('Only admins can upload payment proof', 'warning');
            return;
        }
        setProofModal({ open: true, invoice, proofUrl: '', note: '' });
    };

    const submitProof = async () => {
        try {
            if (!proofModal.invoice) return;
            if (!proofModal.proofUrl) {
                addToast('Proof URL required', 'error');
                return;
            }
            await schoolFinanceService.uploadPaymentProof(proofModal.invoice.id, { proofUrl: proofModal.proofUrl, note: proofModal.note });
            addToast('Payment proof uploaded', 'success');
            setProofModal({ open: false, invoice: null, proofUrl: '', note: '' });
        } catch (e: any) {
            console.error(e);
            addToast(e?.message || 'Failed to upload proof', 'error');
        }
    };

    const allSelected = selectedIds.length > 0 && selectedIds.length === invoices.length;

    const columns: Column<InvoiceRecord>[] = [
        {
            header: (
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    disabled={!isAdmin}
                />
            ),
            accessor: (i: InvoiceRecord) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(i.id)}
                    onChange={(e) => toggleSelect(i.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={!isAdmin}
                />
            ),
            className: 'w-10'
        },
        { header: 'Invoice ID', accessor: (i: InvoiceRecord) => `#${i.id.substring(0, 8)}`, sortable: true, sortKey: 'id' },
        { header: 'Student', accessor: (i: InvoiceRecord) => i.expand?.student?.name || 'Unknown' },
        { header: 'Fee Type', accessor: (i: InvoiceRecord) => i.expand?.fee?.name || 'Custom' },
        { header: 'Amount', accessor: (i: InvoiceRecord) => `$${i.amount.toFixed(2)}`, sortable: true, sortKey: 'amount' },
        { header: 'Due Date', accessor: (i: InvoiceRecord) => new Date(i.due_date).toLocaleDateString(), sortable: true, sortKey: 'due_date' },
        { 
            header: 'Status', 
            accessor: (i: InvoiceRecord) => {
                const status = effectiveStatus[i.id] || i.status;
                return (
                    <Badge variant={status === 'Paid' ? 'success' : status === 'Overdue' ? 'danger' : status === 'Partial' ? 'neutral' : 'warning'}>
                        {status}
                    </Badge>
                );
            },
            sortable: true,
            sortKey: 'status'
        },
        {
            header: 'Actions',
            accessor: (i: InvoiceRecord) => (
                isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                        {i.status !== 'Paid' && (
                            <Button size="sm" variant="primary" onClick={() => openPaymentModal(i)}>Record Payment</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleReceiptDownload(i)}>Receipt PDF</Button>
                        <Button size="sm" variant="ghost" onClick={() => openProof(i)}>Upload Proof</Button>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">View only</span>
                )
            )
        }
    ];

    const handleExport = useCallback(async () => {
        try {
            if (!isAdmin) {
                addToast('Only admins can export invoices', 'warning');
                return;
            }
            const buildFilename = () => {
                const parts = ['invoices'];
                if (statusFilter) parts.push(statusFilter.toLowerCase());
                if (dueFrom) parts.push(`from-${dueFrom}`);
                if (dueTo) parts.push(`to-${dueTo}`);
                return `${parts.join('_')}.csv`;
            };
            const blob = await schoolFinanceService.exportInvoices({
                search: search || undefined,
                sort,
                status: statusFilter || undefined,
                dueFrom: dueFrom || undefined,
                dueTo: dueTo || undefined,
                studentName: studentName || undefined,
                feeName: feeName || undefined,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = buildFilename();
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            addToast('Failed to export invoices', 'error');
        }
    }, [addToast, search, sort, statusFilter, dueFrom, dueTo, isAdmin]);

    const tableQuery: DataQueryResult<InvoiceRecord> = useMemo(() => ({
        items: invoices,
        totalItems,
        totalPages,
        loading,
        error,
        page,
        perPage,
        sort,
        filter: search,
        setPage: (p: number) => setPage(p),
        setPerPage: (pp: number) => { setPerPage(pp); setPage(1); },
        setSort: (s: string) => setSort(s),
        setFilter: (f: string) => setSearch(f),
        refresh: loadData,
        exportData: async (filename?: string) => {
            if (!isAdmin) {
                addToast('Only admins can export invoices', 'warning');
                return;
            }
            const buildFilename = () => {
                const parts = ['invoices'];
                if (statusFilter) parts.push(statusFilter.toLowerCase());
                if (dueFrom) parts.push(`from-${dueFrom}`);
                if (dueTo) parts.push(`to-${dueTo}`);
                return `${parts.join('_')}.csv`;
            };
            const blob = await schoolFinanceService.exportInvoices({
                search: search || undefined,
                sort,
                status: statusFilter || undefined,
                dueFrom: dueFrom || undefined,
                dueTo: dueTo || undefined,
                studentName: studentName || undefined,
                feeName: feeName || undefined,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || buildFilename();
            link.click();
            URL.revokeObjectURL(url);
        },
    }), [error, invoices, loadData, loading, page, perPage, search, sort, statusFilter, dueFrom, dueTo, studentName, feeName, totalItems, totalPages, isAdmin, addToast]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Invoices</h2>
                    {!isAdmin && <p className="text-xs text-gray-500">View-only: finance actions hidden for your role.</p>}
                </div>
                {isAdmin && <Button variant="primary" onClick={() => setIsGenerateModalOpen(true)}>Generate Invoices</Button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due from</label>
                    <Input type="date" value={dueFrom} onChange={e => setDueFrom(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due to</label>
                    <Input type="date" value={dueTo} onChange={e => setDueTo(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student name</label>
                        <Input value={studentName} list="student-options" onChange={e => setStudentName(e.target.value)} placeholder={studentFetchLoading ? 'Searching...' : 'e.g. Jane'} />
                        <datalist id="student-options">
                            {studentOptions.map((name) => <option key={name} value={name} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee name</label>
                        <Input value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="e.g. Tuition" />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => setStatusFilter('Overdue')}>Overdue</Button>
                <Button size="sm" variant="outline" onClick={() => {
                    const today = new Date();
                    const inSeven = new Date();
                    inSeven.setDate(today.getDate() + 7);
                    setDueFrom(today.toISOString().slice(0,10));
                    setDueTo(inSeven.toISOString().slice(0,10));
                }}>Due this week</Button>
                <Button size="sm" variant="ghost" onClick={() => {
                    setStatusFilter('');
                    setDueFrom('');
                    setDueTo('');
                    setStudentName('');
                    setFeeName('');
                }}>Clear filters</Button>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" disabled={selectedIds.length === 0} onClick={openReminderModal}>
                        Send reminders ({selectedIds.length || 0})
                    </Button>
                </div>
                <div className="ml-auto">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Per page</label>
                    <Select value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </Select>
                </div>
            </div>

            <DataToolbar 
                collectionName="school_invoices"
                onSearch={(term) => { setSearch(term); setPage(1); }}
                onExport={handleExport}
                onRefresh={loadData}
                loading={loading}
                totalCount={totalItems}
                lastRefreshed={lastRefreshed}
            />

            <DataTable query={tableQuery} columns={columns} />

            {/* Generate Modal */}
            <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Invoices">
                <div className="space-y-4">
                    <Text>Select a class and a fee type to generate invoices for all students in that class.</Text>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <Select value={generateForm.classId} onChange={e => setGenerateForm({ ...generateForm, classId: e.target.value })}>
                            <option value="">Select Class...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                        <Select value={generateForm.feeId} onChange={e => setGenerateForm({ ...generateForm, feeId: e.target.value })}>
                            <option value="">Select Fee...</option>
                            {fees.map(f => <option key={f.id} value={f.id}>{f.name} (${f.amount})</option>)}
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleGenerate}>Generate</Button>
                    </div>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment for #${selectedInvoice?.id.substring(0, 8)}`}>
                <div className="space-y-4">
                    <Input label="Amount Received ($)" type="number" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                        <Select value={paymentData.method} onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Check">Check</option>
                            <option value="Online">Online</option>
                        </Select>
                    </div>
                    <Input label="Reference / Transaction ID" placeholder="Optional" value={paymentData.reference} onChange={e => setPaymentData({ ...paymentData, reference: e.target.value })} />
                    
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleRecordPayment}>Confirm Payment</Button>
                    </div>
                </div>
            </Modal>

            {/* Reminder Modal */}
            <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title={`Send reminders (${selectedIds.length})`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (optional)</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                            rows={4}
                            maxLength={500}
                            value={reminderForm.message}
                            onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })}
                            placeholder="Friendly reminder: your invoice is due soon."
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channels</label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={reminderForm.email} onChange={e => setReminderForm({ ...reminderForm, email: e.target.checked })} /> Email
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={reminderForm.sms} onChange={e => setReminderForm({ ...reminderForm, sms: e.target.checked })} /> SMS
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="checkbox" checked={reminderForm.inApp} onChange={e => setReminderForm({ ...reminderForm, inApp: e.target.checked })} /> In-app
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Throttle seconds</label>
                        <Input type="number" min={0} value={reminderForm.throttleSeconds} onChange={e => setReminderForm({ ...reminderForm, throttleSeconds: Number(e.target.value) })} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsReminderModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={sendReminders}>Send</Button>
                    </div>
                </div>
            </Modal>

            {/* Proof Upload Modal */}
            <Modal isOpen={proofModal.open} onClose={() => setProofModal({ open: false, invoice: null, proofUrl: '', note: '' })} title={`Upload proof for #${proofModal.invoice?.id.substring(0,8) || ''}`}>
                <div className="space-y-4">
                    <Input label="Proof URL" value={proofModal.proofUrl} onChange={e => setProofModal({ ...proofModal, proofUrl: e.target.value })} placeholder="https://..." />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2"
                            rows={3}
                            value={proofModal.note}
                            onChange={e => setProofModal({ ...proofModal, note: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setProofModal({ open: false, invoice: null, proofUrl: '', note: '' })}>Cancel</Button>
                        <Button variant="primary" onClick={submitProof}>Upload</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
