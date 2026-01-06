import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { useWebhooks, useTestWebhook, useCreateWebhook } from '../../hooks/usePhase2Data';
import { webhookService, type Webhook, type CreateWebhookData } from '../../services/webhookService';
import { webhookSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const AVAILABLE_EVENTS = [
    'tenant.created', 'tenant.updated', 'tenant.deleted', 'tenant.suspended',
    'user.created', 'user.updated', 'user.deleted', 'user.login',
    'subscription.created', 'subscription.updated', 'subscription.cancelled',
    'payment.completed', 'payment.failed', 'payment.refunded',
    'invoice.created', 'invoice.paid', 'invoice.overdue'
];

const WebhookManager: React.FC = () => {
    const { showToast } = useToast();
    const { data: webhooks, isLoading, error, refetch } = useWebhooks();
    const testMutation = useTestWebhook();
    const createMutation = useCreateWebhook();
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
    const [webhookForm, setWebhookForm] = useState<CreateWebhookData>({
        name: '',
        url: '',
        events: [],
        secret: ''
    });

    const handleTest = async (id: string) => {
        try {
            await testMutation.mutateAsync(id);
            alert('Webhook test successful!');
        } catch (error) {
            alert('Webhook test failed');
        }
    };

    const handleCreate = async () => {
        // Sanitize inputs
        const sanitizedForm = {
            ...webhookForm,
            name: sanitizeText(webhookForm.name),
            url: sanitizeText(webhookForm.url),
            secret: webhookForm.secret ? sanitizeText(webhookForm.secret) : ''
        };

        // Validate with Zod
        const validationResult = webhookSchema.safeParse(sanitizedForm);

        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await createMutation.mutateAsync(sanitizedForm);
            setShowAddModal(false);
            setWebhookForm({ name: '', url: '', events: [], secret: '' });
        } catch (error) {
            alert('Failed to create webhook');
        }
    };

    const handleEdit = (webhook: Webhook) => {
        setEditingWebhook(webhook);
        setWebhookForm({
            name: webhook.name,
            url: webhook.url,
            events: Array.isArray(webhook.events) ? webhook.events : JSON.parse(webhook.events as any),
            secret: webhook.secret || ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editingWebhook) return;

        // Sanitize inputs
        const sanitizedForm = {
            ...webhookForm,
            name: sanitizeText(webhookForm.name),
            url: sanitizeText(webhookForm.url),
            secret: webhookForm.secret ? sanitizeText(webhookForm.secret) : ''
        };

        // Validate
        const validationResult = webhookSchema.safeParse(sanitizedForm);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await webhookService.update(editingWebhook.id, validationResult.data);
            showToast('Webhook updated successfully', 'success');
            setShowEditModal(false);
            setEditingWebhook(null);
            setWebhookForm({ name: '', url: '', events: [], secret: '' });
            refetch();
        } catch (error) {
            showToast('Failed to update webhook', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;
        try {
            await webhookService.delete(id);
            refetch();
        } catch (error) {
            alert('Failed to delete webhook');
        }
    };

    const handleToggleStatus = async (webhook: Webhook) => {
        try {
            const newStatus = webhook.status === 'active' ? 'paused' : 'active';
            await webhookService.update(webhook.id, { status: newStatus });
            refetch();
        } catch (error) {
            alert('Failed to update webhook status');
        }
    };

    const toggleEvent = (event: string) => {
        setWebhookForm(prev => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event]
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Failed to load webhooks. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Webhook Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Configure webhooks for real-time event notifications</p>
                </div>
                <Button variant="primary" onClick={() => setShowAddModal(true)} name="add-webhook">
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Add Webhook
                </Button>
            </div>

            {/* Webhooks List */}
            <div className="space-y-4">
                {webhooks?.map((webhook) => (
                    <Card key={webhook.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{webhook.name}</h3>
                                    <Badge variant={webhook.status === 'active' ? 'success' : webhook.status === 'paused' ? 'warning' : 'danger'}>
                                        {webhook.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-3">{webhook.url}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Icon name="BoltIcon" className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">{Array.isArray(webhook.events) ? webhook.events.length : JSON.parse(webhook.events as any).length} events</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon name="ClockIcon" className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Last: {webhook.last_triggered ? new Date(webhook.last_triggered).toLocaleString() : 'Never'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icon name="ChartBarIcon" className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">{webhook.success_rate?.toFixed(1) || 0}% success</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTest(webhook.id)}
                                    disabled={testMutation.isPending}
                                    name="test-webhook"
                                >
                                    <Icon name="PlayIcon" className="w-4 h-4 mr-1" />
                                    {testMutation.isPending ? 'Testing...' : 'Test'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEdit(webhook)} name="edit-webhook">
                                    <Icon name="PencilIcon" className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleToggleStatus(webhook)}
                                    name="toggle-webhook-status"
                                >
                                    {webhook.status === 'active' ? 'Pause' : 'Activate'}
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(webhook.id)}
                                    className="text-red-500"
                                    name="delete-webhook"
                                >
                                    <Icon name="TrashIcon" className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(webhook.events) ? webhook.events : JSON.parse(webhook.events as any)).map((event: string, idx: number) => (
                                <Badge key={idx} variant="neutral">{event}</Badge>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Info */}
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
                <div className="flex gap-3">
                    <Icon name="ShieldCheckIcon" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-green-900 dark:text-green-100">Secure Webhooks</p>
                        <p className="text-green-700 dark:text-green-200">All webhooks include HMAC signatures for verification</p>
                    </div>
                </div>
            </Card>

            {/* Add/Edit Webhook Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {showEditModal ? 'Edit Webhook' : 'Add Webhook'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    name="webhook-name"
                                    value={webhookForm.name}
                                    onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="My Webhook"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
                                <input
                                    type="url"
                                    name="webhook-url"
                                    value={webhookForm.url}
                                    onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="https://your-server.com/webhook"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret (optional)</label>
                                <input
                                    type="text"
                                    name="webhook-secret"
                                    value={webhookForm.secret}
                                    onChange={(e) => setWebhookForm({ ...webhookForm, secret: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="Your webhook secret for HMAC verification"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events *</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    {AVAILABLE_EVENTS.map((event) => (
                                        <label key={event} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="webhook-event"
                                                checked={webhookForm.events.includes(event)}
                                                onChange={() => toggleEvent(event)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button 
                                    variant="secondary" 
                                    onClick={() => { 
                                        setShowAddModal(false); 
                                        setShowEditModal(false); 
                                        setEditingWebhook(null);
                                        setWebhookForm({ name: '', url: '', events: [], secret: '' });
                                    }} 
                                    className="flex-1"
                                    name="modal-cancel"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={showEditModal ? handleUpdate : handleCreate} 
                                    className="flex-1"
                                    disabled={createMutation.isPending}
                                    name="modal-save"
                                >
                                    {createMutation.isPending ? 'Saving...' : (showEditModal ? 'Save Changes' : 'Create Webhook')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default WebhookManager;
