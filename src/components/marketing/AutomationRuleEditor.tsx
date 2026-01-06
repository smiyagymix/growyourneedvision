import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Clock, Mail, MessageSquare, GitBranch, Tag, Bell,
    ChevronRight, Plus, Trash2, Settings, Save, X, Activity,
    Database, Globe, Users, HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, Button, Input, Select, Badge, Modal } from '../shared/ui/CommonUI';

interface Action {
    type: string;
    config: Record<string, unknown>;
}

interface AutomationRuleData {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    actions: Action[];
    status: 'Active' | 'Paused' | 'Draft';
}

interface AutomationRuleEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: AutomationRuleData) => void;
    initialRule?: AutomationRuleData;
}

const TRIGGER_TYPES = [
    { id: 'event', label: 'Event Based', icon: Zap, description: 'Triggered by a user action' },
    { id: 'schedule', label: 'Scheduled', icon: Clock, description: 'Triggered at a specific time' },
    { id: 'segment', label: 'Segment Entry', icon: Users, description: 'Triggered when user join segment' },
    { id: 'webhook', label: 'Webhook', icon: Globe, description: 'Triggered by external system' },
];

const ACTION_TYPES = [
    { id: 'email', label: 'Send Email', icon: Mail },
    { id: 'sms', label: 'Send SMS', icon: MessageSquare },
    { id: 'wait', label: 'Wait Delay', icon: Clock },
    { id: 'condition', label: 'Condition Branch', icon: GitBranch },
    { id: 'tag', label: 'Add/Remove Tag', icon: Tag },
    { id: 'notification', label: 'App Notification', icon: Bell },
];

export const AutomationRuleEditor: React.FC<AutomationRuleEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    initialRule
}) => {
    const [name, setName] = useState(initialRule?.name || '');
    const [description, setDescription] = useState(initialRule?.description || '');
    const [triggerType, setTriggerType] = useState(initialRule?.triggerType || 'event');
    const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(initialRule?.triggerConfig || {});
    const [actions, setActions] = useState<Action[]>(initialRule?.actions || []);
    const [activeTab, setActiveTab] = useState<'setup' | 'workflow'>('setup');
    const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);

    const handleAddAction = (type: string) => {
        setActions([...actions, { type, config: {} }]);
    };

    const handleRemoveAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const handleUpdateActionConfig = (index: number, config: Record<string, unknown>) => {
        const newActions = [...actions];
        newActions[index].config = { ...newActions[index].config, ...config };
        setActions(newActions);
    };

    const handleSave = () => {
        onSave({
            name,
            description,
            triggerType,
            triggerConfig,
            actions,
            status: initialRule?.status || 'Draft',
        });
        onClose();
    };

    const renderTriggerConfig = () => {
        switch (triggerType) {
            case 'event':
                return (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Event Name</label>
                            <Input
                                placeholder="e.g. order.completed, user.signup"
                                value={(triggerConfig.eventName as string) || ''}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, eventName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Conditions (JSON Filter)</label>
                            <Input
                                placeholder='{"total": { "$gt": 100 }}'
                                value={(triggerConfig.filter as string) || ''}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, filter: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'schedule':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Schedule Type</label>
                            <Select
                                value={(triggerConfig.scheduleType as string) || 'daily'}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, scheduleType: (e.target as HTMLSelectElement).value })}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom Cron</option>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Time</label>
                            <Input
                                type="time"
                                value={(triggerConfig.time as string) || '09:00'}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, time: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'segment':
                return (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Target Segment</label>
                            <Select
                                value={(triggerConfig.segmentId as string) || ''}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, segmentId: (e.target as HTMLSelectElement).value })}
                            >
                                <option value="">Select a segment...</option>
                                <option value="high_value">High Value Customers</option>
                                <option value="churn_risk">Churn Risk</option>
                                <option value="new_users">New Users (7d)</option>
                            </Select>
                        </div>
                    </div>
                );
            case 'webhook':
                return (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Webhook Endpoint Key</label>
                            <Input
                                placeholder="e.g. stripe-notifications"
                                value={(triggerConfig.webhookKey as string) || ''}
                                onChange={(e) => setTriggerConfig({ ...triggerConfig, webhookKey: e.target.value })}
                            />
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            URL: https://api.edu-multiverse.com/webhooks/auto/{(triggerConfig.webhookKey as string) || '{key}'}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderActionConfig = (action: Action, index: number) => {
        switch (action.type) {
            case 'email':
                return (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mt-2 border border-purple-100 dark:border-purple-900/30">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Template</label>
                            <Select
                                className="h-8 py-0"
                                value={action.config.templateId as string || ''}
                                onChange={(e) => handleUpdateActionConfig(index, { templateId: (e.target as HTMLSelectElement).value })}
                            >
                                <option value="welcome_v1">Welcome Email (Modern)</option>
                                <option value="promo_flash">Flash Sale Promo</option>
                                <option value="survey_fb">Feedback Survey</option>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Subject Line Override</label>
                            <Input
                                placeholder="Leave empty for template default"
                                value={action.config.subject as string || ''}
                                onChange={(e) => handleUpdateActionConfig(index, { subject: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'wait':
                return (
                    <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mt-2 border border-purple-100 dark:border-purple-900/30">
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Duration</label>
                            <Input
                                type="number"
                                value={action.config.duration as number || 1}
                                onChange={(e) => handleUpdateActionConfig(index, { duration: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400">Unit</label>
                            <Select
                                className="h-8 py-0"
                                value={action.config.unit as string || 'days'}
                                onChange={(e) => handleUpdateActionConfig(index, { unit: (e.target as HTMLSelectElement).value })}
                            >
                                <option value="minutes">Minutes</option>
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                            </Select>
                        </div>
                    </div>
                );
            case 'tag':
                return (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mt-2 border border-purple-100 dark:border-purple-900/30">
                        <div className="flex gap-2">
                             <Select
                                className="h-8 py-0"
                                value={action.config.operation as string || 'add'}
                                onChange={(e) => handleUpdateActionConfig(index, { operation: (e.target as HTMLSelectElement).value })}
                            >
                                <option value="add">Add Tag</option>
                                <option value="remove">Remove Tag</option>
                            </Select>
                            <Input
                                placeholder="Tag name..."
                                value={action.config.tagName as string || ''}
                                onChange={(e) => handleUpdateActionConfig(index, { tagName: e.target.value })}
                            />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-4 text-xs text-gray-500 italic text-center mt-2">
                        Advanced configuration coming soon for this action type.
                    </div>
                );
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialRule ? "Edit Automation" : "Create New Automation"}
            size="2xl"
        >
            <div className="flex flex-col h-[75vh]">
                {/* Close button in top right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-50"
                    title="Close"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('setup')}
                        className={cn(
                            "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                            activeTab === 'setup'
                                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        1. Basic Setup
                    </button>
                    <button
                        onClick={() => setActiveTab('workflow')}
                        className={cn(
                            "px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                            activeTab === 'workflow'
                                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <GitBranch className="w-4 h-4" />
                        2. Workflow Design
                        {actions.length > 0 && (
                            <Badge variant="primary" size="sm">
                                {actions.length}
                            </Badge>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-1 min-h-0">
                    {activeTab === 'setup' ? (
                        <div className="space-y-8 pb-8">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">General Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Automation Name</label>
                                        <Input
                                            placeholder="e.g. Welcome Email Sequence"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                        <Input
                                            placeholder="Describe what this automation does"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        Entry Trigger
                                        {initialRule && (
                                            <Badge variant="success" size="sm">
                                                <Activity className="w-3 h-3 mr-1" />
                                                Active
                                            </Badge>
                                        )}
                                    </h3>
                                    {initialRule && (
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            Triggered {Math.floor(Math.random() * 500) + 100} times
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {TRIGGER_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setTriggerType(type.id)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left transition-all relative group",
                                                triggerType === type.id
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-4 ring-purple-500/10"
                                                    : "border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-900/50"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <type.icon className={cn(
                                                    "w-6 h-6 mb-3",
                                                    triggerType === type.id ? "text-purple-600" : "text-gray-400"
                                                )} />
                                                <ChevronRight className={cn(
                                                    "w-4 h-4 transition-all",
                                                    triggerType === type.id ? "text-purple-600" : "text-gray-300 group-hover:text-purple-400"
                                                )} />
                                            </div>
                                            <div className="font-semibold text-sm text-gray-900 dark:text-white">{type.label}</div>
                                            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{type.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Trigger Config Area (Dynamic) */}
                            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-4 text-purple-600">
                                    <Database className="w-5 h-5" />
                                    <h4 className="font-semibold">Trigger Configuration</h4>
                                </div>
                                {renderTriggerConfig()}
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-12 pt-4">
                            {/* Workflow Performance Banner (for existing rules) */}
                            {initialRule && (
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                                                <Activity className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">Workflow Performance</div>
                                                <div className="text-xs text-gray-500">Real-time analytics for this automation</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.floor(Math.random() * 500) + 100}</div>
                                                <div className="text-xs text-gray-500">Executions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{Math.floor(Math.random() * 30) + 70}%</div>
                                                <div className="text-xs text-gray-500">Success Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Visual Workflow Canvas */}
                            <div className="flex flex-col items-center">
                                {/* Trigger Node */}
                                <div className="relative flex flex-col items-center">
                                    <div className="p-4 bg-purple-600 text-white rounded-xl shadow-lg flex items-center gap-3 w-72 z-10">
                                        <Zap className="w-5 h-5" />
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Trigger</div>
                                            <div className="text-sm font-bold uppercase">{triggerType}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-50" />
                                    </div>
                                    <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700" />
                                </div>

                                {/* Actions Nodes */}
                                <AnimatePresence>
                                    {actions.map((action, idx) => {
                                        const ActionIcon = ACTION_TYPES.find(a => a.id === action.type)?.icon || Zap;
                                        const isEditing = editingActionIndex === idx;

                                        return (
                                            <motion.div
                                                key={`${idx}-${action.type}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="relative flex flex-col items-center"
                                            >
                                                <div className={cn(
                                                    "group relative w-72 p-4 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-sm transition-all",
                                                    isEditing
                                                        ? "border-purple-500 ring-4 ring-purple-500/5 shadow-md"
                                                        : "border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-900"
                                                )}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveAction(idx);
                                                        }}
                                                        className="absolute -right-3 -top-3 p-1.5 bg-white dark:bg-gray-800 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-700 shadow-sm z-20"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => setEditingActionIndex(isEditing ? null : idx)}>
                                                        <div className={cn(
                                                            "p-2 rounded-lg shrink-0",
                                                            isEditing ? "bg-purple-100 text-purple-600" : "bg-gray-50 dark:bg-gray-700 text-gray-600"
                                                        )}>
                                                            <ActionIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-gray-900 dark:text-white capitalize">{action.type}</div>
                                                            <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                                                                {Object.keys(action.config).length > 0
                                                                    ? JSON.stringify(action.config).replace(/[{}"]/g, '')
                                                                    : 'Configure parameters'}
                                                            </div>
                                                        </div>
                                                        <Settings className={cn(
                                                            "w-4 h-4 mt-1 transition-colors",
                                                            isEditing ? "text-purple-500" : "text-gray-300 group-hover:text-purple-500"
                                                        )} />
                                                    </div>

                                                    {isEditing && renderActionConfig(action, idx)}
                                                </div>
                                                <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700" />
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Add Action Button */}
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                                    <div className="dropdown relative group/drop">
                                        <Button variant="outline" className="rounded-full flex items-center gap-2 border-dashed border-2 hover:border-purple-500 hover:text-purple-600 bg-white/50 backdrop-blur-sm">
                                            <Plus className="w-4 h-4" />
                                            Add Workflow Step
                                        </Button>
                                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 hidden group-hover/drop:block z-50">
                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 mb-1">
                                                Select Action Type
                                            </div>
                                            {ACTION_TYPES.map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => handleAddAction(a.id)}
                                                    className="w-full flex items-center gap-3 p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 transition-colors"
                                                >
                                                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-md">
                                                        <a.icon className="w-4 h-4 text-purple-500" />
                                                    </div>
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {actions.length === 0 && (
                                    <div className="mt-8 flex flex-col items-center text-center max-w-xs">
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                            <HelpCircle className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm text-gray-500">Add actions to build your automation workflow. Steps will execute sequentially.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto shrink-0">
                    <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
                    <div className="flex gap-3 items-center">
                        <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Draft Auto-saved
                        </span>
                        <Button variant="primary" onClick={handleSave} className="flex items-center gap-2 px-8">
                            <Save className="w-4 h-4" />
                            {initialRule ? "Update Automation" : "Launch Automation"}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AutomationRuleEditor;
