import React, { useState, useEffect } from 'react';
import { Card, Button, Icon, Input, Select, Modal } from '../shared/ui/CommonUI';
import { emailTemplateService, EmailTemplate } from '../../services/emailTemplateService';

export const EmailTemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({
        name: '',
        subject: '',
        category: 'Marketing',
        content: '',
        variables: []
    });

    const fetchTemplates = async () => {
        setLoading(true);
        const data = await emailTemplateService.getTemplates();
        setTemplates(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async () => {
        try {
            if (editingTemplate.id) {
                await emailTemplateService.updateTemplate(editingTemplate.id, editingTemplate);
            } else {
                await emailTemplateService.createTemplate(editingTemplate);
            }
            setIsEditorOpen(false);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to save template', error);
            alert('Failed to save template');
        }
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate({
            name: '',
            subject: '',
            category: 'Marketing',
            content: '<h1>Hello {{name}},</h1><p>Write your content here...</p>',
            variables: ['{{name}}']
        });
        setIsEditorOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this template?')) return;
        await emailTemplateService.deleteTemplate(id);
        setTemplates(templates.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white">Email Templates</h2>
                <Button variant="primary" icon="PlusIcon" onClick={handleCreate}>New Template</Button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {templates.map(template => (
                        <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                            <div className="h-20 bg-gray-100 dark:bg-gray-800 p-2 flex items-center justify-center relative">
                                <div className="text-center">
                                    <div className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">{template.category}</div>
                                    <div className="font-serif text-gray-600 dark:text-gray-300 text-[10px] line-clamp-2">{template.subject}</div>
                                </div>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(template)}>Edit</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(template.id)}>Delete</Button>
                                </div>
                            </div>
                            <div className="p-2">
                                <h3 className="font-bold text-[10px] text-gray-800 dark:text-white">{template.name}</h3>
                                <div className="flex flex-wrap gap-0.5 mt-1">
                                    {template.variables.map(v => (
                                        <span key={v} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded-full font-mono">{v}</span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Simple Template Editor Modal */}
            <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingTemplate.id ? 'Edit Template' : 'New Template'}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                            <Input 
                                value={editingTemplate.name} 
                                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                placeholder="e.g. Welcome Email"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <Select 
                                value={editingTemplate.category} 
                                onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value as any})}
                            >
                                <option value="Marketing">Marketing</option>
                                <option value="Transactional">Transactional</option>
                                <option value="Newsletter">Newsletter</option>
                                <option value="Notification">Notification</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Line</label>
                        <Input 
                            value={editingTemplate.subject} 
                            onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                            placeholder="e.g. Welcome to the platform!"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML Content</label>
                        <textarea 
                            className="w-full h-64 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editingTemplate.content}
                            onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">Supported variables: {'{{name}}'}, {'{{company}}'}, {'{{date}}'}</p>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>Save Template</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
