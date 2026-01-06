import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Input } from '../../../components/shared/ui/Input';
import { Select } from '../../../components/shared/ui/Select';
import pb from '../../../lib/pocketbase';
import { sanitizeText } from '../../../utils/sanitization';
import { feeSchema } from '../../../validation/schemas';
import { useToast } from '../../../hooks/useToast';

interface Fee {
    id: string;
    name: string;
    amount: number;
    frequency: 'One-time' | 'Monthly' | 'Yearly';
    due_day: number;
}

export const FeeStructure: React.FC = () => {
    const { showToast } = useToast();
    const query = useDataQuery<Fee>('fees', { sort: 'name' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFee, setNewFee] = useState<Partial<Fee>>({ name: '', amount: 0, frequency: 'Monthly', due_day: 1 });

    const handleCreate = async () => {
        try {
            // Sanitize inputs to prevent XSS
            const sanitizedFee = {
                ...newFee,
                name: sanitizeText(newFee.name || '')
            };

            // Validate with Zod
            const validationResult = feeSchema.safeParse(sanitizedFee);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            await pb.collection('fees').create(sanitizedFee);
            setIsModalOpen(false);
            query.refresh();
            setNewFee({ name: '', amount: 0, frequency: 'Monthly', due_day: 1 });
        } catch (e) {
            alert('Failed to create fee');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure?')) {
            await pb.collection('fees').delete(id);
            query.refresh();
        }
    };

    const columns: Column<Fee>[] = [
        { header: 'Fee Name', accessor: 'name', sortable: true },
        { header: 'Amount', accessor: (f: Fee) => `$${f.amount}`, sortable: true },
        { header: 'Frequency', accessor: 'frequency', sortable: true },
        { header: 'Due Day', accessor: 'due_day', sortable: true },
        {
            header: 'Actions',
            accessor: (f: Fee) => (
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(f.id)}>Delete</Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Fee Structures</h2>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>Add Fee</Button>
            </div>

            <DataToolbar 
                collectionName="fees_view"
                onSearch={(term) => query.setFilter(`name ~ "${term}"`)}
                onExport={() => query.exportData('fees.csv')}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable query={query} columns={columns} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Fee">
                <div className="space-y-4">
                    <Input label="Fee Name" placeholder="Tuition Term 1" value={newFee.name} onChange={e => setNewFee({ ...newFee, name: e.target.value })} />
                    <Input label="Amount ($)" type="number" value={newFee.amount} onChange={e => setNewFee({ ...newFee, amount: Number(e.target.value) })} />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                            <Select
                                value={newFee.frequency}
                                onChange={e => setNewFee({ ...newFee, frequency: e.target.value as any })}
                            >
                                <option value="One-time">One-time</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Input label="Due Day" type="number" value={newFee.due_day} onChange={e => setNewFee({ ...newFee, due_day: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreate}>Create Fee</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
