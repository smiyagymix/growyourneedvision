import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useScheduledReports, useRunReport, useCreateScheduledReport } from '../../hooks/usePhase2Data';
import { reportSchedulerService, type ScheduledReport, type CreateReportData } from '../../services/reportSchedulerService';
import { z } from 'zod';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const reportScheduleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  type: z.enum(['revenue', 'usage', 'tenants', 'engagement', 'compliance', 'performance']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  recipients: z.array(emailSchema).min(1, 'At least one recipient required'),
  format: z.enum(['pdf', 'csv', 'excel', 'json']),
  description: z.string().max(500, 'Description too long')
});

const REPORT_TYPES = ['revenue', 'usage', 'tenants', 'engagement', 'compliance', 'performance'] as const;
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly'] as const;
const FORMATS = ['pdf', 'csv', 'excel', 'json'] as const;

const ReportScheduler: React.FC = () => {
    const { data: reports, isLoading, error, refetch } = useScheduledReports();
    const runMutation = useRunReport();
    const createMutation = useCreateScheduledReport();
    
    const [showModal, setShowModal] = useState(false);
    const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
    const [formData, setFormData] = useState<CreateReportData>({
        name: '',
        type: 'revenue',
        frequency: 'weekly',
        recipients: [''],
        format: 'pdf',
        description: ''
    });
    const [saving, setSaving] = useState(false);

    const handleRunNow = async (id: string, name: string) => {
        try {
            await runMutation.mutateAsync(id);
            alert(`Report "${name}" started successfully!`);
        } catch (error) {
            alert('Failed to run report');
        }
    };

    const handleCreate = () => {
        setEditingReport(null);
        setFormData({
            name: '',
            type: 'revenue',
            frequency: 'weekly',
            recipients: [''],
            format: 'pdf',
            description: ''
        });
        setShowModal(true);
    };

    const handleEdit = (report: ScheduledReport) => {
        setEditingReport(report);
        const recipients = Array.isArray(report.recipients) ? report.recipients : JSON.parse(report.recipients as any);
        setFormData({
            name: report.name,
            type: report.type,
            frequency: report.frequency,
            recipients: recipients.length ? recipients : [''],
            format: report.format,
            description: report.description || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const { showToast } = useToast();
        const cleanedRecipients = formData.recipients.filter(r => r.trim());

        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(formData.name),
            type: formData.type,
            frequency: formData.frequency,
            recipients: cleanedRecipients.map(r => sanitizeText(r)),
            format: formData.format,
            description: formData.description ? sanitizeText(formData.description) : ''
        };

        // Validate
        const result = reportScheduleSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        setSaving(true);
        try {
            if (editingReport) {
                await reportSchedulerService.update(editingReport.id, result.data);
            } else {
                await createMutation.mutateAsync(result.data);
            }
            setShowModal(false);
            refetch();
        } catch (error) {
            console.error('Failed to save report:', error);
            alert('Failed to save report');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scheduled report?')) return;
        try {
            await reportSchedulerService.delete(id);
            refetch();
        } catch (error) {
            alert('Failed to delete report');
        }
    };

    const handleToggleStatus = async (report: ScheduledReport) => {
        try {
            const newStatus = report.status === 'active' ? 'paused' : 'active';
            await reportSchedulerService.updateStatus(report.id, newStatus);
            refetch();
        } catch (error) {
            alert('Failed to update report status');
        }
    };

    const addRecipient = () => {
        setFormData({ ...formData, recipients: [...formData.recipients, ''] });
    };

    const updateRecipient = (index: number, value: string) => {
        const newRecipients = [...formData.recipients];
        newRecipients[index] = value;
        setFormData({ ...formData, recipients: newRecipients });
    };

    const removeRecipient = (index: number) => {
        const newRecipients = formData.recipients.filter((_, i) => i !== index);
        setFormData({ ...formData, recipients: newRecipients.length ? newRecipients : [''] });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load scheduled reports. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report Scheduling</h2>
                    <p className="text-sm text-gray-500 mt-1">Automate report generation and distribution</p>
                </div>
                <Button name="schedule-report" variant="primary" onClick={handleCreate}>
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Schedule Report
                </Button>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {reports?.map((report) => {
                    const recipients = Array.isArray(report.recipients) ? report.recipients : JSON.parse(report.recipients as any);
                    return (
                        <Card key={report.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{report.name}</h3>
                                        <Badge variant={report.status === 'active' ? 'success' : 'warning'}>
                                            {report.status}
                                        </Badge>
                                        <Badge variant="neutral">{report.frequency}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                        <div>
                                            <span className="text-gray-600">Type:</span>
                                            <span className="ml-2 font-medium">{report.type}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Format:</span>
                                            <span className="ml-2 font-medium uppercase">{report.format}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Next run:</span>
                                            <span className="ml-2 font-medium">{new Date(report.next_run).toLocaleString()}</span>
                                        </div>
                                        {report.last_run && (
                                            <div>
                                                <span className="text-gray-600">Last run:</span>
                                                <span className="ml-2 font-medium">{new Date(report.last_run).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-sm">
                                        <span className="text-gray-600">Recipients:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {recipients.map((email: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                    {email}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        name="run-now"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRunNow(report.id, report.name)}
                                        disabled={runMutation.isPending}
                                    >
                                        <Icon name="PlayIcon" className="w-4 h-4 mr-1" />
                                        {runMutation.isPending ? 'Running...' : 'Run Now'}
                                    </Button>
                                    <Button name="edit-report" variant="outline" size="sm" onClick={() => handleEdit(report)}>
                                        <Icon name="PencilIcon" className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button 
                                        name="toggle-status"
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleToggleStatus(report)}
                                    >
                                        {report.status === 'active' ? 'Pause' : 'Resume'}
                                    </Button>
                                    <Button 
                                        name="delete-report"
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDelete(report.id)}
                                        className="text-red-500"
                                    >
                                        <Icon name="TrashIcon" className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Info */}
            <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                <div className="flex gap-3">
                    <Icon name="CalendarIcon" className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-orange-900 dark:text-orange-100">Automated Delivery</p>
                        <p className="text-orange-700 dark:text-orange-200">Reports are automatically generated and emailed at scheduled times</p>
                    </div>
                </div>
            </Card>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Name *</label>
                                <input
                                    name="report-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="e.g., Weekly Revenue Report"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        name="report-type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        {REPORT_TYPES.map(type => (
                                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                                    <select
                                        name="report-frequency"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        {FREQUENCIES.map(freq => (
                                            <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                                <select
                                    name="report-format"
                                    value={formData.format}
                                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    {FORMATS.map(fmt => (
                                        <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients *</label>
                                <div className="space-y-2">
                                    {formData.recipients.map((email, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                name="recipient-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => updateRecipient(idx, e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                                placeholder="email@example.com"
                                            />
                                            <Button name="remove-recipient" variant="ghost" size="sm" onClick={() => removeRecipient(idx)} className="text-red-500">
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button name="add-recipient" variant="outline" size="sm" onClick={addRecipient} className="mt-2">
                                    <Icon name="PlusIcon" className="w-4 h-4 mr-1" /> Add Recipient
                                </Button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea                                    name="report-description"                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    rows={3}
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button name="modal-cancel" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                                <Button name="modal-save" variant="primary" onClick={handleSave} className="flex-1" disabled={saving}>
                                    {saving ? 'Saving...' : (editingReport ? 'Save Changes' : 'Schedule Report')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ReportScheduler;
