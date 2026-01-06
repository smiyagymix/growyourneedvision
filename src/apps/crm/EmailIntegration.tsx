import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Icon, Button, Badge } from '../../components/shared/ui/CommonUI';
import {
    useEmailHistory,
    useEmailTemplates,
    useSendEmail,
    useCreateTemplate
} from '../../hooks/useCRMEmails';
import { useContacts } from '../../hooks/useCRMContacts';
import { CRMContact } from '../../services/crmContactsService';
import { Email, EmailTemplate, crmEmailService } from '../../services/crmEmailService';
import { crmAnalyticsService } from '../../services/crmAnalyticsService';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const emailDraftSchema = z.object({
    contactId: z.string().min(1, 'Contact required'),
    subject: z.string().min(1, 'Subject required').max(200),
    body: z.string().min(10, 'Email body must be at least 10 characters').max(10000)
});

const emailTemplateSchema = z.object({
    name: z.string().min(3, 'Template name must be at least 3 characters').max(100),
    category: z.enum(['general', 'followup', 'welcome', 'newsletter', 'promotion']),
    subject_template: z.string().min(1, 'Subject required').max(200),
    body_template: z.string().min(10, 'Template body must be at least 10 characters').max(10000)
});

interface EmailAnalytics {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    totalSent: number;
    byMonth: { month: string; sent: number; opened: number; clicked: number }[];
}

const EmailIntegration: React.FC = () => {
    const [selectedContact, setSelectedContact] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates' | 'analytics'>('compose');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [draftId, setDraftId] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', category: 'general', subject: '', body: '' });

    // Hooks
    const { data: contacts, isLoading: contactsLoading } = useContacts();
    const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useEmailHistory(selectedContact);
    const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useEmailTemplates();
    const { mutateAsync: sendEmail, isPending: sending } = useSendEmail();
    const { mutateAsync: createTemplate } = useCreateTemplate();

    const contact = contacts?.find((c: CRMContact) => c.id === selectedContact);

    // Load analytics when analytics tab is active
    useEffect(() => {
        if (activeTab === 'analytics') {
            loadAnalytics();
        }
    }, [activeTab]);

    const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const data = await crmAnalyticsService.getEmailAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        const { showToast } = useToast();
        if (!contact) {
            showToast('Please select a contact', 'warning');
            return;
        }
        
        // Sanitize
        const sanitized = {
            contactId: contact.id,
            subject: sanitizeText(subject),
            body: sanitizeHtml(body, 'BASIC')
        };
        
        // Validate
        const validationResult = emailDraftSchema.safeParse(sanitized);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            const draft = await crmEmailService.saveDraft(
                validationResult.data.contactId, 
                validationResult.data.subject, 
                validationResult.data.body
            );
            setDraftId(draft.id);
            showToast('Draft saved successfully', 'success');
        } catch (err) {
            console.error('Failed to save draft:', err);
            showToast('Failed to save draft', 'error');
        }
    };

    const handleSend = async () => {
        const { showToast } = useToast();
        if (!contact) {
            showToast('Please select a contact', 'warning');
            return;
        }
        
        // Sanitize
        const sanitized = {
            contactId: contact.id,
            subject: sanitizeText(subject),
            body: sanitizeHtml(body, 'BASIC')
        };
        
        // Validate
        const validationResult = emailDraftSchema.safeParse(sanitized);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await sendEmail({
                to: contact.email,
                subject: validationResult.data.subject,
                body: validationResult.data.body,
                options: { contactId: contact.id }
            });

            // Clear draft if it exists
            if (draftId) {
                await crmEmailService.deleteDraft(draftId);
                setDraftId(null);
            }

            setSubject('');
            setBody('');
            refetchHistory();
            setActiveTab('history');
            showToast('Email sent successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to send email', 'error');
        }
    };

    const handleCreateTemplate = async () => {
        const { showToast } = useToast();
        
        // Sanitize
        const sanitized = {
            name: sanitizeText(newTemplate.name),
            category: newTemplate.category,
            subject_template: sanitizeText(newTemplate.subject),
            body_template: sanitizeHtml(newTemplate.body, 'BASIC')
        };
        
        // Validate
        const validationResult = emailTemplateSchema.safeParse(sanitized);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await createTemplate(validationResult.data);
            setNewTemplate({ name: '', category: 'general', subject: '', body: '' });
            setShowNewTemplateModal(false);
            refetchTemplates();
            showToast('Template created successfully!', 'success');
        } catch (err) {
            console.error('Failed to create template:', err);
            showToast('Failed to create template', 'error');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await crmEmailService.deleteTemplate(templateId);
            refetchTemplates();
        } catch (err) {
            console.error('Failed to delete template:', err);
            alert('Failed to delete template');
        }
    };

    const applyTemplate = (templateId: string) => {
        const template = templates?.find((t: EmailTemplate) => t.id === templateId);
        if (template && contact) {
            let newSubject = template.subject_template;
            let newBody = template.body_template;

            const replacements: Record<string, string> = {
                '{{first_name}}': contact.first_name,
                '{{last_name}}': contact.last_name,
                '{{email}}': contact.email,
                '{{company}}': contact.company || 'your company',
                '{{phone}}': contact.phone || ''
            };

            Object.entries(replacements).forEach(([key, value]) => {
                newSubject = newSubject.replaceAll(key, value);
                newBody = newBody.replaceAll(key, value);
            });

            setSubject(newSubject);
            setBody(newBody);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Sidebar */}
            <Card className="col-span-1 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Contact</label>
                    <select
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                        value={selectedContact}
                        onChange={(e) => setSelectedContact(e.target.value)}
                    >
                        <option value="">-- Choose a contact --</option>
                        {contacts?.map((c: CRMContact) => (
                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                        ))}
                    </select>
                </div>

                <div className="p-2 space-y-1 flex-1 overflow-y-auto">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'compose' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Icon name="PencilSquareIcon" className="w-5 h-5" />
                        Compose Email
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'history' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        disabled={!selectedContact}
                    >
                        <Icon name="ClockIcon" className="w-5 h-5" />
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'templates' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Icon name="DocumentDuplicateIcon" className="w-5 h-5" />
                        Templates
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full text-left p-3 rounded flex items-center gap-3 ${activeTab === 'analytics' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <Icon name="ChartBarIcon" className="w-5 h-5" />
                        Analytics
                    </button>
                </div>
            </Card>

            {/* Main Content */}
            <Card className="col-span-2 h-full flex flex-col p-6">
                {activeTab === 'compose' && (
                    <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">New Message</h3>
                            <select
                                className="text-sm p-1 rounded border dark:bg-gray-800"
                                onChange={(e) => applyTemplate(e.target.value)}
                                disabled={!selectedContact}
                            >
                                <option value="">Load Template...</option>
                                {templates?.map((t: EmailTemplate) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {!selectedContact ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Select a contact to start composing
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Subject"
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                                <textarea
                                    className="flex-1 w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent resize-none"
                                    placeholder="Write your email content..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="secondary" onClick={handleSaveDraft} disabled={!subject}>
                                        {draftId ? 'Update Draft' : 'Save Draft'}
                                    </Button>
                                    <Button variant="primary" icon="PaperAirplaneIcon" onClick={handleSend} disabled={sending || !subject || !body}>
                                        {sending ? 'Sending...' : 'Send Email'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg mb-4">Conversation History</h3>
                        {!selectedContact ? (
                            <div className="text-center text-gray-500 py-10">Select a contact to view history</div>
                        ) : historyLoading ? (
                            <div>Loading history...</div>
                        ) : history?.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">No emails found</div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto max-h-[600px]">
                                {history?.map((email: Email) => (
                                    <div key={email.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold">{email.subject}</span>
                                            <span className="text-xs text-gray-500">{new Date(email.sent_at || email.created).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{email.body}</p>
                                        <div className="mt-2 flex gap-2">
                                            <Badge variant={email.status === 'opened' ? 'success' : 'neutral'} size="sm">
                                                {email.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Email Templates</h3>
                            <Button variant="primary" icon="PlusIcon" onClick={() => setShowNewTemplateModal(true)}>
                                New Template
                            </Button>
                        </div>
                        
                        {showNewTemplateModal && (
                            <div className="mb-6 p-4 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                <h4 className="font-bold mb-4">Create New Template</h4>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Template Name"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                    <select
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        value={newTemplate.category}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                                    >
                                        <option value="general">General</option>
                                        <option value="sales">Sales</option>
                                        <option value="follow-up">Follow Up</option>
                                        <option value="onboarding">Onboarding</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Subject (use {{first_name}}, {{company}} for variables)"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        value={newTemplate.subject}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                                    />
                                    <textarea
                                        placeholder="Body content..."
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 h-32"
                                        value={newTemplate.body}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="secondary" onClick={() => setShowNewTemplateModal(false)}>Cancel</Button>
                                        <Button variant="primary" onClick={handleCreateTemplate}>Create Template</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templatesLoading ? (
                                <div className="col-span-2 text-center py-10 text-gray-500">Loading templates...</div>
                            ) : templates?.length === 0 ? (
                                <div className="col-span-2 text-center py-10 text-gray-500">No templates yet. Create your first one!</div>
                            ) : templates?.map((t: EmailTemplate) => (
                                <div key={t.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold mb-1">{t.name}</h4>
                                            <Badge variant="neutral" size="sm">{t.category}</Badge>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTemplate(t.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                        >
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">{t.subject_template}</div>
                                    {selectedContact && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => {
                                                applyTemplate(t.id);
                                                setActiveTab('compose');
                                            }}
                                        >
                                            Use Template
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Email Performance</h3>
                            <Button variant="secondary" size="sm" onClick={loadAnalytics} disabled={analyticsLoading}>
                                <Icon name="ArrowPathIcon" className={`w-4 h-4 mr-1 ${analyticsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        
                        {analyticsLoading ? (
                            <div className="text-center py-10">Loading analytics...</div>
                        ) : analytics ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">{analytics.openRate.toFixed(1)}%</div>
                                        <div className="text-sm text-gray-500">Open Rate</div>
                                        <div className="text-xs text-gray-400 mt-1">{analytics.totalSent} emails sent</div>
                                    </div>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">{analytics.clickRate.toFixed(1)}%</div>
                                        <div className="text-sm text-gray-500">Click Rate</div>
                                        <div className="text-xs text-gray-400 mt-1">Email engagement</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-600">{analytics.totalSent}</div>
                                        <div className="text-sm text-gray-500">Total Sent</div>
                                        <div className="text-xs text-gray-400 mt-1">Last 12 months</div>
                                    </div>
                                </div>
                                
                                {/* Engagement Over Time Chart */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold mb-4">Engagement Over Time</h4>
                                    <div className="h-48 flex items-end justify-between gap-2">
                                        {analytics.byMonth.map((month: { month: string; sent: number; opened: number; clicked: number }, i: number) => {
                                            const maxSent = Math.max(...analytics.byMonth.map((m: { sent: number }) => m.sent), 1);
                                            const sentHeight = (month.sent / maxSent) * 100;
                                            const openedHeight = (month.opened / maxSent) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center">
                                                    <div className="w-full flex flex-col gap-1 h-40 justify-end">
                                                        <div 
                                                            className="w-full bg-blue-400 rounded-t transition-all"
                                                            style={{ height: `${sentHeight}%` }}
                                                            title={`${month.sent} sent`}
                                                        />
                                                        <div 
                                                            className="w-full bg-green-400 rounded-t transition-all"
                                                            style={{ height: `${openedHeight}%` }}
                                                            title={`${month.opened} opened`}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {month.month}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-4 justify-center mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-400 rounded" />
                                            <span className="text-sm text-gray-500">Sent</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-400 rounded" />
                                            <span className="text-sm text-gray-500">Opened</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">No analytics data available</div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default EmailIntegration;
