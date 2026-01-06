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
import { Inquiry } from '../types';
import { z } from 'zod';
import { emailSchema, phoneSchema } from '../../../validation/schemas';
import { sanitizeText, sanitizeHtml } from '../../../utils/sanitization';
import { useToast } from '../../../hooks/useToast';

// Inquiry validation schema
const inquirySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    phone: phoneSchema.optional().or(z.literal('')),
    grade_interest: z.string().min(1, 'Grade is required'),
    status: z.enum(['New Inquiry', 'Contacted', 'Interview Scheduled', 'Offer Sent', 'Enrolled', 'Rejected']),
    source: z.string().min(1, 'Source is required'),
    notes: z.string().max(1000).optional(),
    next_follow_up: z.string().optional()
});

export const AdmissionInquiries: React.FC = () => {
    const query = useDataQuery<Inquiry>('crm_inquiries', {
        sort: '-created'
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [formData, setFormData] = useState<Partial<Inquiry>>({
        name: '',
        email: '',
        phone: '',
        grade_interest: '',
        status: 'New Inquiry',
        source: 'Website',
        notes: '',
        next_follow_up: ''
    });

    const { showToast } = useToast();

    const handleSave = async () => {
        try {
            // Sanitize inputs
            const sanitizedData = {
                ...formData,
                name: sanitizeText(formData.name || ''),
                email: sanitizeText(formData.email || ''),
                phone: sanitizeText(formData.phone || ''),
                grade_interest: sanitizeText(formData.grade_interest || ''),
                notes: formData.notes ? sanitizeHtml(formData.notes, 'BASIC') : ''
            };

            // Validate with Zod
            const validationResult = inquirySchema.safeParse(sanitizedData);
            if (!validationResult.success) {
                showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
                return;
            }

            if (selectedInquiry) {
                await pb.collection('crm_inquiries').update(selectedInquiry.id, sanitizedData);
            } else {
                await pb.collection('crm_inquiries').create(sanitizedData);
            }
            setIsModalOpen(false);
            setSelectedInquiry(null);
            setFormData({ name: '', email: '', phone: '', grade_interest: '', status: 'New Inquiry', source: 'Website', notes: '', next_follow_up: '' });
            query.refresh();
            showToast('Inquiry saved successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to save inquiry', 'error');
        }
    };

    const handleEdit = (inquiry: Inquiry) => {
        setSelectedInquiry(inquiry);
        setFormData({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            grade_interest: inquiry.grade_interest,
            status: inquiry.status,
            source: inquiry.source,
            notes: inquiry.notes,
            next_follow_up: inquiry.next_follow_up
        });
        setIsModalOpen(true);
    };

    const columns: Column<Inquiry>[] = [
        { header: 'Name', accessor: 'name', sortable: true },
        { header: 'Email', accessor: 'email', sortable: true },
        { header: 'Phone', accessor: 'phone', sortable: true },
        { header: 'Grade', accessor: 'grade_interest', sortable: true },
        { 
            header: 'Status', 
            accessor: (i: Inquiry) => (
                <Badge variant={
                    i.status === 'Enrolled' ? 'success' : 
                    i.status === 'Rejected' ? 'danger' : 
                    i.status === 'New Inquiry' ? 'primary' : 'warning'
                }>
                    {i.status}
                </Badge>
            ),
            sortable: true 
        },
        { header: 'Next Follow-up', accessor: (i: Inquiry) => i.next_follow_up ? new Date(i.next_follow_up).toLocaleDateString() : '-', sortable: true },
        { header: 'Source', accessor: 'source', sortable: true },
        {
            header: 'Actions',
            accessor: (i: Inquiry) => (
                <Button size="sm" variant="ghost" onClick={() => handleEdit(i)}>Edit</Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Admission Inquiries</h2>
                <Button variant="primary" onClick={() => { setSelectedInquiry(null); setIsModalOpen(true); }}>New Inquiry</Button>
            </div>

            <DataToolbar 
                collectionName="inquiries_view"
                onSearch={(term) => query.setFilter(`name ~ "${term}" || email ~ "${term}"`)}
                onExport={() => query.exportData('inquiries.csv')}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable query={query} columns={columns} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedInquiry ? 'Edit Inquiry' : 'New Inquiry'}>
                <div className="space-y-4">
                    <Input label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="flex-1">
                            <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input label="Grade Interest" value={formData.grade_interest} onChange={e => setFormData({...formData, grade_interest: e.target.value})} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="New Inquiry">New Inquiry</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Interview Scheduled">Interview Scheduled</option>
                                <option value="Offer Sent">Offer Sent</option>
                                <option value="Enrolled">Enrolled</option>
                                <option value="Rejected">Rejected</option>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Source</label>
                        <Select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Other">Other</option>
                        </Select>
                    </div>
                    <div>
                        <Input label="Next Follow-up" type="date" value={formData.next_follow_up?.split('T')[0]} onChange={e => setFormData({...formData, next_follow_up: new Date(e.target.value).toISOString()})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea 
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700" 
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save Inquiry</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
