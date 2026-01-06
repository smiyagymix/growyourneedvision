import { useState, useEffect } from 'react';
import { marketingService, PersonalizationRule } from '../../services/marketingService';
import { useMarketingRealtime } from '../../hooks/useMarketingRealtime';
import { Card, Button, Icon, Badge, Modal, Input, Select, Skeleton } from '../shared/ui/CommonUI';

type RuleFormData = {
    name: string;
    description: string;
    target_audience: string;
    trigger_type: PersonalizationRule['trigger_type'];
    status: PersonalizationRule['status'];
};

const initialFormData: RuleFormData = {
    name: '',
    description: '',
    target_audience: '',
    trigger_type: 'User Attribute',
    status: 'Inactive',
};

export const PersonalizationEngine: React.FC = () => {
    const [rules, setRules] = useState<PersonalizationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PersonalizationRule | null>(null);
    const [formData, setFormData] = useState<RuleFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [autoOptimize, setAutoOptimize] = useState(true);

    // Real-time subscription
    const { subscribe, unsubscribe, isSubscribed } = useMarketingRealtime<PersonalizationRule>('personalization_rules', {
        autoFetch: false,
        onCreate: (record) => setRules(prev => [record, ...prev]),
        onUpdate: (record) => {
            setRules(prev => prev.map(r => r.id === record.id ? record : r));
            if (editingRule?.id === record.id) setEditingRule(record);
        },
        onDelete: (record) => setRules(prev => prev.filter(r => r.id !== record.id)),
    });

    useEffect(() => {
        loadRules();
        subscribe();
        return () => unsubscribe();
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await marketingService.getPersonalizationRules();
            setRules(data);
        } catch (err) {
            setError('Failed to load personalization rules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (rule?: PersonalizationRule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                name: rule.name,
                description: rule.description,
                target_audience: rule.target_audience,
                trigger_type: rule.trigger_type,
                status: rule.status,
            });
        } else {
            setEditingRule(null);
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRule(null);
        setFormData(initialFormData);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        
        try {
            setSaving(true);
            if (editingRule) {
                await marketingService.updatePersonalizationRule(editingRule.id, formData);
            } else {
                await marketingService.createPersonalizationRule({
                    ...formData,
                    trigger_conditions: {},
                    content_variations: [],
                    performance: { impressions: 0, conversions: 0, uplift: 0 },
                });
            }
            await loadRules();
            handleCloseModal();
        } catch (err) {
            console.error('Failed to save rule:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await marketingService.deletePersonalizationRule(id);
            await loadRules();
        } catch (err) {
            console.error('Failed to delete rule:', err);
        }
    };

    const handleToggleStatus = async (rule: PersonalizationRule) => {
        const newStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await marketingService.updatePersonalizationRule(rule.id, { status: newStatus });
            await loadRules();
        } catch (err) {
            console.error('Failed to toggle rule status:', err);
        }
    };

    const getStatusVariant = (status: PersonalizationRule['status']): 'success' | 'warning' | 'neutral' => {
        switch (status) {
            case 'Active': return 'success';
            case 'Testing': return 'warning';
            default: return 'neutral';
        }
    };

    const getTriggerIcon = (type: PersonalizationRule['trigger_type']) => {
        switch (type) {
            case 'Page Visit': return 'EyeIcon';
            case 'User Attribute': return 'UserCircleIcon';
            case 'Behavior': return 'CursorArrowRaysIcon';
            case 'Time-based': return 'ClockIcon';
            default: return 'AdjustmentsHorizontalIcon';
        }
    };

    const getTriggerColor = (type: PersonalizationRule['trigger_type']) => {
        switch (type) {
            case 'Page Visit': return 'bg-green-100 dark:bg-green-900/30 text-green-600';
            case 'User Attribute': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
            case 'Behavior': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
            case 'Time-based': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
            default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600';
        }
    };

    // Calculate aggregate stats
    const totalImpressions = rules.reduce((sum, r) => sum + r.performance.impressions, 0);
    const totalConversions = rules.reduce((sum, r) => sum + r.performance.conversions, 0);
    const avgUplift = rules.length > 0 
        ? rules.reduce((sum, r) => sum + r.performance.uplift, 0) / rules.length 
        : 0;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="p-6">
                                <div className="flex gap-4">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-36 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Personalization Engine</h2>
                <Button variant="primary" icon="PlusIcon" onClick={() => handleOpenModal()}>
                    Create Rule
                </Button>
            </div>

            {error && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <Icon name="ExclamationCircleIcon" className="w-5 h-5" />
                        <span>{error}</span>
                        <Button variant="ghost" size="sm" onClick={loadRules}>Retry</Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div className="lg:col-span-2 space-y-2">
                    {rules.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Icon name="SparklesIcon" className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Rules Created</h3>
                            <p className="text-[9px] text-gray-500 mb-2">Create your first personalization rule to start delivering targeted experiences.</p>
                            <Button variant="primary" onClick={() => handleOpenModal()}>Create First Rule</Button>
                        </Card>
                    ) : (
                        rules.map(rule => (
                            <Card key={rule.id} className="p-3 hover:shadow-lg transition-shadow">
                                <div className="flex gap-2 items-start">
                                    <div className={`p-2 rounded-xl ${getTriggerColor(rule.trigger_type)}`}>
                                        <Icon name={getTriggerIcon(rule.trigger_type)} className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{rule.name}</h3>
                                                <p className="text-sm text-gray-500">{rule.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusVariant(rule.status)}>{rule.status}</Badge>
                                                <button
                                                    onClick={() => handleToggleStatus(rule)}
                                                    className={`w-12 h-6 rounded-full relative transition-colors ${
                                                        rule.status === 'Active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                                                        rule.status === 'Active' ? 'right-1' : 'left-1'
                                                    }`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Icon name="UsersIcon" className="w-4 h-4" />
                                                {rule.target_audience}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Icon name="BoltIcon" className="w-4 h-4" />
                                                {rule.trigger_type}
                                            </span>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                                                        {rule.performance.impressions.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Impressions</div>
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                                                        {rule.performance.conversions.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Conversions</div>
                                                </div>
                                                <div>
                                                    <div className={`text-xl font-bold ${rule.performance.uplift > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {rule.performance.uplift > 0 ? '+' : ''}{rule.performance.uplift}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">Uplift</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(rule)}>
                                                <Icon name="PencilIcon" className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                                                <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Performance Uplift</h3>
                        <div className="text-center py-6">
                            <div className={`text-4xl font-black ${avgUplift > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                {avgUplift > 0 ? '+' : ''}{avgUplift.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Avg Conversion Uplift</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-500">{totalImpressions.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Total Impressions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-500">{totalConversions.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Total Conversions</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-gyn-blue-dark to-purple-900 text-white">
                        <h3 className="font-bold mb-2">AI Optimization</h3>
                        <p className="text-sm text-blue-100 mb-4">
                            Enable "Auto-Optimize" to let AI automatically adjust rules for maximum conversion.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Auto-Optimize</span>
                            <button
                                onClick={() => setAutoOptimize(!autoOptimize)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                    autoOptimize ? 'bg-green-500' : 'bg-white/30'
                                }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                                    autoOptimize ? 'right-1' : 'left-1'
                                }`} />
                            </button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Active Rules</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                                <Badge variant="success">{rules.filter(r => r.status === 'Active').length}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Testing</span>
                                <Badge variant="warning">{rules.filter(r => r.status === 'Testing').length}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
                                <Badge variant="neutral">{rules.filter(r => r.status === 'Inactive').length}</Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Create Personalization Rule'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave} disabled={saving || !formData.name.trim()}>
                            {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Rule Name"
                        placeholder="e.g., Homepage Hero - Enterprise"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Description"
                        placeholder="Describe what this rule does..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Input
                        label="Target Audience"
                        placeholder="e.g., Enterprise, Startups, New Users"
                        value={formData.target_audience}
                        onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                    />
                    <Select
                        label="Trigger Type"
                        value={formData.trigger_type}
                        onChange={e => setFormData({ ...formData, trigger_type: e.target.value as PersonalizationRule['trigger_type'] })}
                    >
                        <option value="Page Visit">Page Visit</option>
                        <option value="User Attribute">User Attribute</option>
                        <option value="Behavior">Behavior</option>
                        <option value="Time-based">Time-based</option>
                    </Select>
                    <Select
                        label="Initial Status"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as PersonalizationRule['status'] })}
                    >
                        <option value="Inactive">Inactive</option>
                        <option value="Testing">Testing</option>
                        <option value="Active">Active</option>
                    </Select>
                </div>
            </Modal>
        </div>
    );
};
