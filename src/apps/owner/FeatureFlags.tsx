import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button, Modal } from '../../components/shared/ui/CommonUI';
import { featureFlagService, FeatureFlag } from '../../services/featureFlagService';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const featureFlagSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  key: z.string().min(2, 'Key must be at least 2 characters').max(50, 'Key too long').regex(/^[a-z0-9_-]+$/, 'Key must be lowercase with dashes/underscores only'),
  description: z.string().max(500, 'Description too long'),
  category: z.enum(['core', 'ai', 'payment', 'communication', 'analytics', 'overlay']),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100),
  planRestriction: z.enum(['free', 'basic', 'premium', 'enterprise']).nullable()
});

const FeatureFlags: React.FC = () => {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | FeatureFlag['category']>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFlag, setNewFlag] = useState({
        name: '',
        key: '',
        description: '',
        category: 'core' as FeatureFlag['category'],
        enabled: false,
        rolloutPercentage: 100,
        planRestriction: null as FeatureFlag['planRestriction']
    });

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        setLoading(true);
        try {
            const data = await featureFlagService.getAllFlags();
            setFlags(data);
        } catch (error) {
            console.error('Failed to load flags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFlag = async (flagId: string) => {
        const flag = flags.find(f => f.id === flagId);
        if (!flag) return;

        try {
            const updated = await featureFlagService.toggleFlag(flagId, !flag.enabled);
            setFlags(flags.map(f => f.id === flagId ? updated : f));
        } catch (error) {
            console.error('Failed to toggle flag:', error);
            alert('Failed to update feature flag');
        }
    };

    const handleUpdateRollout = async (flagId: string, percentage: number) => {
        try {
            const updated = await featureFlagService.updateRollout(flagId, percentage);
            setFlags(flags.map(f => f.id === flagId ? updated : f));
        } catch (error) {
            console.error('Failed to update rollout:', error);
        }
    };

    const handleCreateFlag = async () => {
        const { showToast } = useToast();

        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(newFlag.name),
            key: sanitizeText(newFlag.key.toLowerCase().replace(/\s+/g, '-')),
            description: newFlag.description ? sanitizeHtml(newFlag.description, 'BASIC') : '',
            category: newFlag.category,
            enabled: newFlag.enabled,
            rolloutPercentage: newFlag.rolloutPercentage,
            planRestriction: newFlag.planRestriction
        };

        // Validate
        const result = featureFlagSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            const created = await featureFlagService.createFlag(result.data as Omit<FeatureFlag, 'id' | 'created' | 'updated'>);
            setFlags([created, ...flags]);
            setIsCreateModalOpen(false);
            setNewFlag({
                name: '',
                key: '',
                description: '',
                category: 'core',
                enabled: false,
                rolloutPercentage: 100,
                planRestriction: null
            });
        } catch (error) {
            console.error('Failed to create flag:', error);
            showToast('Failed to create feature flag', 'error');
        }
    };

    const handleDeleteFlag = async (flagId: string) => {
        if (!confirm('Are you sure you want to delete this feature flag?')) return;

        try {
            await featureFlagService.deleteFlag(flagId);
            setFlags(flags.filter(f => f.id !== flagId));
        } catch (error) {
            console.error('Failed to delete flag:', error);
            alert('Failed to delete feature flag');
        }
    };

    const handleEditFlag = async () => {
        if (!editingFlag) return;

        try {
            const updated = await featureFlagService.updateFlag(editingFlag.id, editingFlag);
            setFlags(flags.map(f => f.id === editingFlag.id ? updated : f));
            setEditingFlag(null);
        } catch (error) {
            console.error('Failed to update flag:', error);
            alert('Failed to update feature flag');
        }
    };

    const filteredFlags = flags.filter(flag => {
        const matchesCategory = filter === 'all' || flag.category === filter;
        const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            flag.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryIcon = (category: FeatureFlag['category']) => {
        switch (category) {
            case 'ai': return 'SparklesIcon';
            case 'payment': return 'CreditCardIcon';
            case 'communication': return 'ChatBubbleLeftRightIcon';
            case 'analytics': return 'ChartBarIcon';
            case 'overlay': return 'Squares2X2Icon';
            case 'core': return 'CogIcon';
            default: return 'FlagIcon';
        }
    };

    const getCategoryColor = (category: FeatureFlag['category']) => {
        switch (category) {
            case 'ai': return 'purple';
            case 'payment': return 'green';
            case 'communication': return 'blue';
            case 'analytics': return 'orange';
            case 'overlay': return 'pink';
            case 'core': return 'gray';
            case 'experimental': return 'red';
            default: return 'gray';
        }
    };

    const stats = {
        total: flags.length,
        enabled: flags.filter(f => f.enabled).length,
        disabled: flags.filter(f => !f.enabled).length,
        gradual: flags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feature Flags</h2>
                    <p className="text-sm text-gray-500 mt-1">Control platform features and rollout strategies</p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                    Create Flag
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Flags</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                        </div>
                        <Icon name="FlagIcon" className="w-10 h-10 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Enabled</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.enabled}</p>
                        </div>
                        <Icon name="CheckCircleIcon" className="w-10 h-10 text-green-500" />
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Disabled</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.disabled}</p>
                        </div>
                        <Icon name="XCircleIcon" className="w-10 h-10 text-red-500" />
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Gradual Rollout</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.gradual}</p>
                        </div>
                        <Icon name="ChartBarIcon" className="w-10 h-10 text-orange-500" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Icon name="MagnifyingGlassIcon" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                name="search-flags"
                                type="text"
                                placeholder="Search flags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            name="filter-all"
                            variant={filter === 'all' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            name="filter-core"
                            variant={filter === 'core' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('core')}
                        >
                            Core
                        </Button>
                        <Button
                            name="filter-ai"
                            variant={filter === 'ai' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('ai')}
                        >
                            AI
                        </Button>
                        <Button
                            name="filter-payment"
                            variant={filter === 'payment' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('payment')}
                        >
                            Payment
                        </Button>
                        <Button
                            name="filter-communication"
                            variant={filter === 'communication' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('communication')}
                        >
                            Communication
                        </Button>
                        <Button
                            name="filter-analytics"
                            variant={filter === 'analytics' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('analytics')}
                        >
                            Analytics
                        </Button>
                        <Button
                            name="filter-overlay"
                            variant={filter === 'overlay' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('overlay')}
                        >
                            Overlay
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Feature Flags List */}
            <div className="space-y-4">
                {filteredFlags.map((flag) => (
                    <Card key={flag.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${getCategoryColor(flag.category)}-100 dark:bg-${getCategoryColor(flag.category)}-900/20`}>
                                    <Icon name={getCategoryIcon(flag.category)} className={`w-6 h-6 text-${getCategoryColor(flag.category)}-600`} />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{flag.name}</h3>
                                        <Badge variant="secondary" className="text-xs">{flag.category}</Badge>
                                        {flag.rolloutPercentage < 100 && flag.rolloutPercentage > 0 && (
                                            <Badge variant="warning" className="text-xs">
                                                {flag.rolloutPercentage}% Rollout
                                            </Badge>
                                        )}
                                        {flag.planRestriction && (
                                            <Badge variant="info" className="text-xs">{flag.planRestriction}+</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{flag.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>Key: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{flag.key}</code></span>
                                        <span>Updated: {new Date(flag.updated).toLocaleDateString()}</span>
                                    </div>

                                    {/* Rollout Slider for gradual deployment */}
                                    {flag.enabled && (
                                        <div className="mt-4">
                                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                                Rollout Percentage: {flag.rolloutPercentage}%
                                            </label>
                                            <input
                                                name="rollout-percentage"
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={flag.rolloutPercentage}
                                                onChange={(e) => handleUpdateRollout(flag.id, parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>0%</span>
                                                <span>50%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    name="toggle-flag"
                                    onClick={() => handleToggleFlag(flag.id)}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${flag.enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                                <Button name="edit-flag" variant="ghost" size="sm" onClick={() => setEditingFlag(flag)}>
                                    <Icon name="PencilIcon" className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredFlags.length === 0 && (
                <Card className="p-12 text-center">
                    <Icon name="FlagIcon" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No feature flags found matching your criteria</p>
                </Card>
            )}

            {/* Create Flag Modal */}
            {isCreateModalOpen && (
                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Feature Flag">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input
                                name="flag-name"
                                type="text"
                                value={newFlag.name}
                                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                placeholder="e.g., AI Features"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key</label>
                            <input
                                name="flag-key"
                                type="text"
                                value={newFlag.key}
                                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono"
                                placeholder="e.g., ai_features"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="flag-description"
                                value={newFlag.description}
                                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                rows={3}
                                placeholder="Describe what this flag controls..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                name="flag-category"
                                value={newFlag.category}
                                onChange={(e) => setNewFlag({ ...newFlag, category: e.target.value as FeatureFlag['category'] })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="core">Core</option>
                                <option value="ai">AI</option>
                                <option value="payment">Payment</option>
                                <option value="communication">Communication</option>
                                <option value="analytics">Analytics</option>
                                <option value="overlay">Overlay</option>
                                <option value="experimental">Experimental</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Restriction</label>
                            <select
                                name="flag-plan-restriction"
                                value={newFlag.planRestriction || ''}
                                onChange={(e) => setNewFlag({ ...newFlag, planRestriction: e.target.value as FeatureFlag['planRestriction'] || null })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="">No Restriction</option>
                                <option value="free">Free+</option>
                                <option value="basic">Basic+</option>
                                <option value="premium">Premium+</option>
                                <option value="enterprise">Enterprise Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rollout Percentage: {newFlag.rolloutPercentage}%
                            </label>
                            <input
                                name="new-flag-rollout-percentage"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={newFlag.rolloutPercentage}
                                onChange={(e) => setNewFlag({ ...newFlag, rolloutPercentage: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                name="flag-enabled"
                                type="checkbox"
                                id="enabledCheck"
                                checked={newFlag.enabled}
                                onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                            />
                            <label htmlFor="enabledCheck" className="text-sm text-gray-700 dark:text-gray-300">
                                Enable immediately after creation
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button name="modal-cancel" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button name="modal-create-flag" variant="primary" onClick={handleCreateFlag}>Create Flag</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Flag Modal */}
            {editingFlag && (
                <Modal isOpen={!!editingFlag} onClose={() => setEditingFlag(null)} title="Edit Feature Flag">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input
                                name="edit-flag-name"
                                type="text"
                                value={editingFlag.name}
                                onChange={(e) => setEditingFlag({ ...editingFlag, name: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="edit-flag-description"
                                value={editingFlag.description}
                                onChange={(e) => setEditingFlag({ ...editingFlag, description: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rollout Percentage: {editingFlag.rolloutPercentage}%
                            </label>
                            <input
                                name="edit-rollout-percentage"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={editingFlag.rolloutPercentage}
                                onChange={(e) => setEditingFlag({ ...editingFlag, rolloutPercentage: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex justify-between pt-4">
                            <Button name="modal-delete-flag" variant="danger" onClick={() => handleDeleteFlag(editingFlag.id)}>Delete</Button>
                            <div className="flex gap-2">
                                <Button name="modal-cancel-edit" variant="secondary" onClick={() => setEditingFlag(null)}>Cancel</Button>
                                <Button name="modal-save-flag" variant="primary" onClick={handleEditFlag}>Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FeatureFlags;
