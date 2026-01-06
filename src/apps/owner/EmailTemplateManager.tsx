import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { emailTemplateService, EmailTemplate } from '../../services/emailTemplateService';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

// Email template validation schema
const emailTemplateSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    category: z.string().min(1, 'Category is required'),
    variables: z.array(z.string()),
    is_active: z.boolean()
});

const EmailTemplateManager: React.FC = () => {
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await emailTemplateService.getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
        setLoading(false);
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            Marketing: 'purple',
            Transactional: 'blue',
            Notification: 'green',
            Newsletter: 'orange',
            welcome: 'blue',
            notification: 'green',
            billing: 'orange',
            marketing: 'purple',
            system: 'red'
        };
        return colors[category] || 'gray';
    };

    const handleCreate = () => {
        setEditingTemplate({
            name: '',
            subject: '',
            content: '<h1>Hello {{name}}</h1>\n<p>Your content here...</p>',
            category: 'Transactional',
            variables: ['{{name}}'],
            is_active: true
        });
        setShowModal(true);
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template });
        setShowModal(true);
    };

    const handleClone = (template: EmailTemplate) => {
        setEditingTemplate({
            ...template,
            id: undefined,
            name: `${template.name} (Copy)`,
        });
        setShowModal(true);
    };

    const handlePreview = (template: EmailTemplate) => {
        setPreviewTemplate(template);
        setShowPreviewModal(true);
    };

    const handleSave = async () => {
        if (!editingTemplate?.name || !editingTemplate?.subject) {
            alert('Please fill in name and subject');
            return;
        }

        // Sanitize inputs
        const sanitizedTemplate = {
            ...editingTemplate,
            name: sanitizeText(editingTemplate.name),
            subject: sanitizeText(editingTemplate.subject),
            content: sanitizeHtml(editingTemplate.content || '', 'RICH')
        };

        // Validate with Zod
        const validationResult = emailTemplateSchema.safeParse(sanitizedTemplate);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }
        
        setSaving(true);
        try {
            if (sanitizedTemplate.id) {
                await emailTemplateService.updateTemplate(sanitizedTemplate.id, sanitizedTemplate);
            } else {
                await emailTemplateService.createTemplate(sanitizedTemplate);
            }
            await loadTemplates();
            setShowModal(false);
            setEditingTemplate(null);
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await emailTemplateService.deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete template:', error);
            alert('Failed to delete template');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage automated email templates with variables</p>
                </div>
                <Button name="create-template" variant="primary" onClick={handleCreate}>
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Templates List */}
            <div className="space-y-4">
                {templates.map((template) => (
                    <Card key={template.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{template.name}</h3>
                                    <Badge variant={getCategoryColor(template.category) as any}>
                                        {template.category}
                                    </Badge>
                                    <Badge variant={template.is_active ? 'success' : 'warning'}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    <strong>Subject:</strong> {template.subject}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <span>Variables: {template.variables?.join(', ') || 'None'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button name="preview-template" variant="outline" size="sm" onClick={() => handlePreview(template)}>
                                    <Icon name="EyeIcon" className="w-4 h-4 mr-1" />
                                    Preview
                                </Button>
                                <Button name="edit-template" variant="outline" size="sm" onClick={() => handleEdit(template)}>
                                    <Icon name="PencilIcon" className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button name="clone-template" variant="outline" size="sm" onClick={() => handleClone(template)}>
                                    <Icon name="DocumentDuplicateIcon" className="w-4 h-4 mr-1" />
                                    Clone
                                </Button>
                                <Button name="delete-template" variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="text-red-500">
                                    <Icon name="TrashIcon" className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Variables Info */}
            <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                <div className="flex gap-3">
                    <Icon name="CodeBracketIcon" className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Available Variables</p>
                        <p className="text-purple-700 dark:text-purple-200">{`{{ tenant_name }}, {{ user_name }}, {{ platform_name }}, {{ invoice_number }}, {{ amount }}, {{ date }}`}</p>
                    </div>
                </div>
            </Card>

            {/* Edit/Create Modal */}
            {showModal && editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingTemplate.id ? 'Edit Template' : 'Create Template'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <input
                                    name="template-name"
                                    type="text"
                                    value={editingTemplate.name || ''}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="Template name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                                <input
                                    name="template-subject"
                                    type="text"
                                    value={editingTemplate.subject || ''}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="Email subject line"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select
                                    name="template-category"
                                    value={editingTemplate.category || 'Transactional'}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <option value="Transactional">Transactional</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Notification">Notification</option>
                                    <option value="Newsletter">Newsletter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML Content</label>
                                <textarea
                                    name="template-content"
                                    value={editingTemplate.content || ''}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                                    rows={10}
                                    placeholder="<h1>Hello {{name}}</h1>"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    name="template-active"
                                    type="checkbox"
                                    id="is_active"
                                    checked={editingTemplate.is_active ?? true}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button name="modal-cancel" variant="secondary" onClick={() => { setShowModal(false); setEditingTemplate(null); }} className="flex-1">Cancel</Button>
                                <Button name="modal-save" variant="primary" onClick={handleSave} className="flex-1" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Template'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Preview: {previewTemplate.name}</h3>
                            <Button name="modal-close-header" variant="ghost" onClick={() => setShowPreviewModal(false)}>
                                <Icon name="XMarkIcon" className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-500 mb-2"><strong>Subject:</strong> {previewTemplate.subject}</p>
                            <div 
                                className="prose dark:prose-invert max-w-none bg-white p-4 rounded"
                                dangerouslySetInnerHTML={{ __html: previewTemplate.content || '' }}
                            />
                        </div>
                        <Button name="modal-close" variant="secondary" onClick={() => setShowPreviewModal(false)} className="w-full">Close</Button>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default EmailTemplateManager;
