import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { Input } from '../../../components/shared/ui/Input';
import { Select } from '../../../components/shared/ui/Select';
import pb from '../../../lib/pocketbase';
import { Interaction, Inquiry } from '../types';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { useToast } from '../../../hooks/useToast';

// Communication log validation schema
const communicationLogSchema = z.object({
    type: z.enum(['Call', 'Email', 'Meeting', 'SMS', 'Other']),
    summary: z.string().min(3, 'Summary must be at least 3 characters').max(200),
    details: z.string().min(10, 'Details must be at least 10 characters').max(2000),
    date: z.string().datetime(),
    inquiry: z.string().min(1, 'Inquiry is required')
});

export const CommunicationHistory: React.FC = () => {
    const { showToast } = useToast();
    const query = useDataQuery<Interaction>('crm_interactions', {
        sort: '-date',
        expand: 'inquiry,logged_by'
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
        type: 'Call',
        summary: '',
        details: '',
        date: new Date().toISOString(),
        inquiry: ''
    });

    const openLogModal = async () => {
        try {
            const res = await pb.collection('crm_inquiries').getFullList<Inquiry>({ sort: 'name' });
            setInquiries(res);
            setIsModalOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        try {
            // Sanitize inputs
            const sanitizedData = {
                ...newInteraction,
                summary: sanitizeText(newInteraction.summary || ''),
                details: sanitizeHtml(newInteraction.details || '', 'BASIC')
            };

            // Validate with Zod
            const validationResult = communicationLogSchema.safeParse(sanitizedData);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            await pb.collection('crm_interactions').create({
                ...sanitizedData,
                logged_by: pb.authStore.model?.id
            });
            setIsModalOpen(false);
            setNewInteraction({ type: 'Call', summary: '', details: '', date: new Date().toISOString(), inquiry: '' });
            query.refresh();
        } catch (e) {
            alert('Failed to log interaction');
        }
    };

    const columns: Column<Interaction>[] = [
        { header: 'Date', accessor: (i: Interaction) => new Date(i.date).toLocaleString(), sortable: true },
        { header: 'Type', accessor: 'type', sortable: true },
        { header: 'Inquiry / Student', accessor: (i: Interaction) => i.expand?.inquiry?.name || 'Unknown', sortable: true },
        { header: 'Summary', accessor: 'summary', sortable: true },
        { header: 'Logged By', accessor: (i: Interaction) => i.expand?.logged_by?.name || 'System', sortable: true },
        { 
            header: 'Details', 
            accessor: (i: Interaction) => (
                <span title={i.details} className="truncate max-w-xs block">{i.details}</span>
            ) 
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Communication History</h2>
                <Button variant="primary" onClick={openLogModal}>Log Interaction</Button>
            </div>

            <DataToolbar 
                collectionName="interactions_view"
                onSearch={(term) => query.setFilter(`summary ~ "${term}" || details ~ "${term}"`)}
                onExport={() => query.exportData('interactions.csv')}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable query={query} columns={columns} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Interaction">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Inquiry / Lead</label>
                        <Select value={newInteraction.inquiry} onChange={e => setNewInteraction({...newInteraction, inquiry: e.target.value})}>
                            <option value="">Select Lead...</option>
                            {inquiries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </Select>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <Select value={newInteraction.type} onChange={e => setNewInteraction({...newInteraction, type: e.target.value as any})}>
                                <option value="Call">Call</option>
                                <option value="Email">Email</option>
                                <option value="Meeting">Meeting</option>
                                <option value="Note">Note</option>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Input label="Date" type="datetime-local" value={newInteraction.date?.slice(0, 16)} onChange={e => setNewInteraction({...newInteraction, date: new Date(e.target.value).toISOString()})} />
                        </div>
                    </div>
                    <Input label="Summary" value={newInteraction.summary} onChange={e => setNewInteraction({...newInteraction, summary: e.target.value})} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Details</label>
                        <textarea 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" 
                            rows={4}
                            value={newInteraction.details}
                            onChange={e => setNewInteraction({...newInteraction, details: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save Log</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
