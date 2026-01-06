import React, { useState } from 'react';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useRoutingRules,
    useCreateRoutingRule,
    useUpdateRoutingRule,
    useDeleteRoutingRule
} from '../../hooks/useAIModelRouting';
import { RoutingRule } from '../../services/aiModelRoutingService';

const AIModelRouting: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
    const [newRule, setNewRule] = useState<{
        name: string;
        priority: number;
        enabled: boolean;
        conditions: {
            token_count: { min?: number; max?: number };
            cost_sensitivity?: string;
            response_time?: string;
            features: string[];
            tenants: string[];
        };
        model_selection: string;
        fallback_model: string;
    }>({
        name: '',
        priority: 1,
        enabled: true,
        conditions: {
            token_count: { min: undefined, max: undefined },
            cost_sensitivity: undefined,
            response_time: undefined,
            features: [],
            tenants: []
        },
        model_selection: 'gpt-3.5-turbo',
        fallback_model: ''
    });

    const { data: rules, isLoading } = useRoutingRules();
    const createRule = useCreateRoutingRule();
    const updateRule = useUpdateRoutingRule();
    const deleteRule = useDeleteRoutingRule();

    const handleCreateRule = async () => {
        if (!newRule.name) return;

        await createRule.mutateAsync(newRule as any);
        setShowCreateModal(false);
        resetForm();
    };

    const handleUpdateRule = async (rule: RoutingRule) => {
        await updateRule.mutateAsync({ id: rule.id, data: rule });
        setEditingRule(null);
    };

    const resetForm = () => {
        setNewRule({
            name: '',
            priority: 1,
            enabled: true,
            conditions: {
                token_count: { min: undefined, max: undefined },
                cost_sensitivity: undefined,
                response_time: undefined,
                features: [],
                tenants: []
            },
            model_selection: 'gpt-3.5-turbo',
            fallback_model: ''
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Model Routing</h2>
                    <p className="text-sm text-gray-500 mt-1">Intelligent model selection based on rules</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    New Routing Rule
                </Button>
            </div>

            {/* Info Card */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-3">
                    <Icon name="InformationCircleIcon" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100">How Routing Works</p>
                        <p className="text-blue-700 dark:text-blue-200">
                            Rules are evaluated by priority. When conditions match, the specified model is selected.
                            Use this to optimize costs and performance based on token count, features, or tenants.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Routing Rules */}
            <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Routing Rules</h3>
                <div className="space-y-3">
                    {rules && rules.length > 0 ? (
                        rules.map((rule: RoutingRule) => (
                            <div key={rule.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{rule.name}</h4>
                                        <Badge variant={rule.enabled ? 'success' : 'default'}>
                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                        <Badge variant="info">Priority: {rule.priority}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                updateRule.mutate({
                                                    id: rule.id,
                                                    data: { enabled: !rule.enabled }
                                                });
                                            }}
                                        >
                                            {rule.enabled ? 'Disable' : 'Enable'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => {
                                                if (confirm('Delete this rule?')) {
                                                    deleteRule.mutate(rule.id);
                                                }
                                            }}
                                        >
                                            <Icon name="TrashIcon" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Model Selection</p>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {rule.model_selection}
                                        </p>
                                    </div>
                                    {rule.fallback_model && (
                                        <div>
                                            <p className="text-gray-600">Fallback Model</p>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {rule.fallback_model}
                                            </p>
                                        </div>
                                    )}
                                    {rule.conditions.token_count && (
                                        <div>
                                            <p className="text-gray-600">Token Count</p>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {rule.conditions.token_count.min ? `${rule.conditions.token_count.min}+` : ''}
                                                {rule.conditions.token_count.max ? ` - ${rule.conditions.token_count.max}` : ''}
                                            </p>
                                        </div>
                                    )}
                                    {rule.conditions.cost_sensitivity && (
                                        <div>
                                            <p className="text-gray-600">Cost Sensitivity</p>
                                            <p className="font-bold text-gray-900 dark:text-white capitalize">
                                                {rule.conditions.cost_sensitivity}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Icon name="CogIcon" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No routing rules yet. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Create Routing Rule
                            </h3>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icon name="XMarkIcon" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rule Name *
                                </label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="High Token Count Rule"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Priority *
                                    </label>
                                    <input
                                        type="number"
                                        value={newRule.priority}
                                        onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model Selection *
                                    </label>
                                    <select
                                        value={newRule.model_selection}
                                        onChange={(e) => setNewRule({ ...newRule, model_selection: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        <option value="gpt-4">GPT-4</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                                        <option value="claude-3-opus">Claude 3 Opus</option>
                                        <option value="gemini-pro">Gemini Pro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fallback Model
                                </label>
                                <select
                                    value={newRule.fallback_model}
                                    onChange={(e) => setNewRule({ ...newRule, fallback_model: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                >
                                    <option value="">None</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                    <option value="gpt-4">GPT-4</option>
                                </select>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Conditions</h4>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            Min Token Count
                                        </label>
                                        <input
                                            type="number"
                                            value={newRule.conditions.token_count?.min || ''}
                                            onChange={(e) => setNewRule({
                                                ...newRule,
                                                conditions: {
                                                    ...newRule.conditions,
                                                    token_count: {
                                                        ...newRule.conditions.token_count,
                                                        min: parseInt(e.target.value) || undefined
                                                    }
                                                }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="e.g., 1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                            Max Token Count
                                        </label>
                                        <input
                                            type="number"
                                            value={newRule.conditions.token_count?.max || ''}
                                            onChange={(e) => setNewRule({
                                                ...newRule,
                                                conditions: {
                                                    ...newRule.conditions,
                                                    token_count: {
                                                        ...newRule.conditions.token_count,
                                                        max: parseInt(e.target.value) || undefined
                                                    }
                                                }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="e.g., 5000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                        Cost Sensitivity
                                    </label>
                                    <select
                                        value={newRule.conditions.cost_sensitivity || ''}
                                        onChange={(e) => setNewRule({
                                            ...newRule,
                                            conditions: {
                                                ...newRule.conditions,
                                                cost_sensitivity: e.target.value as any || undefined
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Any</option>
                                        <option value="low">Low (Cost not important)</option>
                                        <option value="medium">Medium (Balanced)</option>
                                        <option value="high">High (Minimize cost)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRule}
                                disabled={!newRule.name || createRule.isPending}
                            >
                                {createRule.isPending ? 'Creating...' : 'Create Rule'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AIModelRouting;
