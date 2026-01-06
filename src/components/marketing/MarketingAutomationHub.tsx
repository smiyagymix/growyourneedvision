import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pause, RefreshCw, CheckCircle, TrendingUp, Users, Globe, Download,
  Search, Plus, Play, Edit, Trash2, ChevronRight, Filter, Mail, Zap, Bell, Tag, Workflow, Clock, MessageSquare, GitBranch
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { marketingService, AutomationRule } from '../../services/marketingService';
import { AutomationAnalytics } from './AutomationAnalytics';
import { AutomationRuleEditor } from './AutomationRuleEditor';
import { Card, Button, Modal, Badge, Icon } from '../shared/ui/CommonUI';
import { marketingExportService } from '../../services/marketingExportService';

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
}

const TEMPLATES: AutomationTemplate[] = [
  { id: '1', name: 'Welcome Email', description: 'Trigger sequence when user signs up', category: 'Retention', icon: Mail, color: 'bg-blue-500' },
  { id: '2', name: 'Abandoned Cart', description: 'Recover lost sales after 1 hour', category: 'E-commerce', icon: Zap, color: 'bg-yellow-500' },
  { id: '3', name: 'Lead Nurturing', description: 'Guide leads through your sales funnel', category: 'Sales', icon: Users, color: 'bg-purple-500' },
  { id: '4', name: 'Re-engagement', description: 'Win back inactive subscribers', category: 'Retention', icon: Bell, color: 'bg-pink-500' },
  { id: '5', name: 'Birthday Campaign', description: 'Celebrate with personalized offers', category: 'Engagement', icon: Tag, color: 'bg-green-500' },
  { id: '6', name: 'Post-Purchase', description: 'Follow up after successful orders', category: 'E-commerce', icon: CheckCircle, color: 'bg-teal-500' },
];

export const MarketingAutomationHub: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'automations' | 'templates' | 'analytics'>('automations');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused' | 'Draft'>('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketingService.getAutomationRules();
      setAutomations(data);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAutomations = useMemo(() => {
    return automations.filter(rule => {
      const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || rule.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [automations, searchQuery, statusFilter]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    try {
      await marketingService.toggleAutomationRule(id);
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    try {
      await marketingService.deleteAutomationRule(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const handleCreateFromTemplate = async (template: AutomationTemplate) => {
    try {
      const newAutomation = await marketingService.createAutomationRule({
        name: template.name,
        description: template.description,
        triggerType: 'event',
        actions: [{ type: 'email', config: { template: template.name.toLowerCase().replace(' ', '_') } }]
      });
      setAutomations(prev => [newAutomation as AutomationRule, ...prev]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating automation:', error);
    }
  };

  const handleSaveRule = async (ruleData: Partial<AutomationRule>) => {
    try {
      if (editingRule) {
        await marketingService.updateAutomationRule(editingRule.id, ruleData);
        setAutomations(prev => prev.map(a => a.id === editingRule.id ? { ...a, ...ruleData } as AutomationRule : a));
      } else {
        const created = await marketingService.createAutomationRule(ruleData);
        setAutomations(prev => [created as AutomationRule, ...prev]);
      }
      setEditingRule(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleExportAll = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      marketingExportService.exportAutomationRulesToCSV(automations);
    } else {
      marketingExportService.exportAutomationRulesToPDF(automations);
    }
    setShowExportModal(false);
  };

  const overallStats = {
    totalAutomations: automations.length,
    activeAutomations: automations.filter((a: AutomationRule) => a.status === 'Active').length,
    totalTriggered: automations.reduce((sum: number, a: AutomationRule) => sum + a.stats.triggered, 0),
    successRate: Math.round(
      (automations.reduce((sum: number, a: AutomationRule) => sum + a.stats.completed, 0) /
        (automations.reduce((sum: number, a: AutomationRule) => sum + a.stats.triggered, 0) || 1)) * 100
    ),
    avgCompletionTime: '4.2h',
    emailsSent: automations.reduce((sum: number, a: AutomationRule) => sum + (a.actions.filter((act: { type: string }) => act.type === 'email').length * a.stats.triggered), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Paused': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'event': return Zap;
      case 'schedule': return Clock;
      case 'segment': return Users;
      case 'webhook': return Globe;
      default: return Zap;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'wait': return Clock;
      case 'condition': return GitBranch;
      case 'tag': return Tag;
      case 'webhook': return Zap;
      case 'notification': return Bell;
      default: return Zap;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-gray-500">Loading automations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Marketing Automation Hub
              <Icon name="Info" className="w-4 h-4 text-gray-400 cursor-help" />
            </h1>
            <p className="text-gray-500 mt-1">Build and manage multi-channel automated marketing workflows</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Automation
          </Button>
          <Button
            variant="outline"
            onClick={fetchData}
            title="Refresh Data"
            className="px-2"
          >
            <RefreshCw className={cn("w-4 h-4 text-gray-500", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Rules', value: overallStats.totalAutomations, icon: Workflow, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active', value: overallStats.activeAutomations, icon: Play, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Runs', value: overallStats.totalTriggered.toLocaleString(), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Success', value: `${overallStats.successRate}%`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Avg Time', value: overallStats.avgCompletionTime, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Emails', value: `${(overallStats.emailsSent / 1000000).toFixed(1)}M`, icon: Mail, color: 'text-pink-500', bg: 'bg-pink-50' },
        ].map((stat, idx) => (
          <Card
            key={stat.label}
            padding="sm"
            className="relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</span>
              <span className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</span>
            </div>
            <div className={cn("absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity", stat.color)}>
              <stat.icon size={56} />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['automations', 'templates', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 mr-1" />
              {(['All', 'Active', 'Paused', 'Draft'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    statusFilter === status
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredAutomations.length > 0 ? (
              filteredAutomations.map((automation, idx) => {
                const TriggerIcon = getTriggerIcon(automation.triggerType);
                return (
                  <motion.div
                    key={automation.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:border-purple-200 dark:hover:border-purple-800/50 transition-colors p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            automation.status === 'Active' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
                          )}>
                            <Workflow className={cn(
                              "w-6 h-6",
                              automation.status === 'Active' ? 'text-purple-600' : 'text-gray-500'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{automation.name}</h3>
                              <Badge variant={automation.status === 'Active' ? 'success' : automation.status === 'Paused' ? 'warning' : 'neutral'}>
                                {automation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{automation.description}</p>

                            {/* Trigger Info & Actions */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/30 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-800">
                                <TriggerIcon className="w-3.5 h-3.5" />
                                <span className="capitalize">{automation.triggerType}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {automation.actions.slice(0, 5).map((action: { type: string }, i: number) => {
                                  const ActionIcon = getActionIcon(action.type);
                                  return (
                                    <React.Fragment key={`${automation.id}-action-${i}`}>
                                      <div className="w-6 h-6 rounded-md bg-gray-50 dark:bg-gray-900/40 flex items-center justify-center border border-gray-100 dark:border-gray-800" title={action.type}>
                                        <ActionIcon className="w-3.5 h-3.5 text-gray-500" />
                                      </div>
                                      {i < Math.min(automation.actions.length - 1, 4) && (
                                        <ChevronRight className="w-3 h-3 text-gray-300" />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                                {automation.actions.length > 5 && (
                                  <span className="text-[10px] text-gray-400 ml-1">+{automation.actions.length - 5}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center gap-6 self-end lg:self-center">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right">
                            <div className="text-xs text-gray-400 capitalize whitespace-nowrap">Runs</div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white capitalize whitespace-nowrap">{automation.stats.triggered.toLocaleString()}</div>
                            <div className="text-xs text-gray-400 capitalize whitespace-nowrap">Success</div>
                            <div className="text-xs font-bold text-green-600 capitalize whitespace-nowrap">
                              {automation.stats.triggered > 0 ? `${((automation.stats.completed / automation.stats.triggered) * 100).toFixed(0)}%` : '0%'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-9 h-9 p-0"
                              onClick={() => handleToggleStatus(automation.id, automation.status)}
                              title={automation.status === 'Active' ? 'Pause' : 'Start'}
                            >
                              {automation.status === 'Active' ? (
                                <Pause className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <Play className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-9 h-9 p-0"
                              onClick={() => setEditingRule(automation)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-9 h-9 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
                              onClick={() => handleDelete(automation.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No automations found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Templates Grid */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-all group border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                <div className="flex flex-col h-full">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm", template.color)}>
                    <template.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{template.category}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500 mb-8 flex-grow leading-relaxed">{template.description}</p>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateFromTemplate(template)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    className="w-full group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all"
                  >
                    Use Template
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && <AutomationAnalytics />}

      {/* Editor Modal */}
      {(showCreateModal || editingRule) && (
        <AutomationRuleEditor
          isOpen={showCreateModal || !!editingRule}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
          initialRule={editingRule ? {
            name: editingRule.name,
            description: editingRule.description,
            triggerType: editingRule.trigger,
            triggerConfig: editingRule.conditions,
            actions: editingRule.actions,
            status: editingRule.status
          } : undefined}
        />
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Automation Data"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleExportAll('csv')}>Export CSV</Button>
            <Button variant="primary" onClick={() => handleExportAll('pdf')}>Export PDF</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select your preferred format to export all automation rules and their performance metrics.
          </p>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Data Includes</div>
            <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-disc ml-4">
              <li>Full workflow sequence and action logic</li>
              <li>Trigger configurations (Events, Schedules, Webhooks)</li>
              <li>Historical execution stats (Triggered, Completed, Success Rate)</li>
              <li>Operational status and last run timestamps</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketingAutomationHub;
