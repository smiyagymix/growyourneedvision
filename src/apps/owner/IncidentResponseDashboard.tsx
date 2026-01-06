/**
 * Incident Response Dashboard
 * 
 * Complete incident management system with timeline tracking,
 * escalation workflows, and metrics analysis
 */

import React, { useState } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import { useIncidentResponse } from '../../hooks/useIncidentResponse';
import { 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    TrendingUp, 
    Users, 
    Zap,
    MessageSquare,
    ArrowUp,
    Eye,
    X,
    Plus
} from 'lucide-react';
import { Button } from '../../components/shared/ui/Button';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const incidentSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['performance', 'security', 'availability', 'data', 'integration', 'other']),
    affectedServices: z.array(z.string()).optional(),
    impact: z.enum(['none', 'minor', 'major', 'critical'])
});

const incidentUpdateSchema = z.object({
    message: z.string().min(10, 'Update must be at least 10 characters').max(1000, 'Update too long')
});

interface CreateIncidentForm {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'security' | 'availability' | 'data' | 'integration' | 'other';
    affectedServices: string[];
    impact: 'none' | 'minor' | 'major' | 'critical';
}

export const IncidentResponseDashboard: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'open' | 'resolved' | 'all'>('open');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [updateText, setUpdateText] = useState('');
    
    const {
        incidents,
        openIncidents,
        criticalIncidents,
        stats,
        createIncident,
        acknowledgeIncident,
        addUpdate,
        escalateIncident,
        resolveIncident,
        closeIncident,
        detectIncidents,
        rules,
        createRule
    } = useIncidentResponse();

    const [formData, setFormData] = useState<CreateIncidentForm>({
        title: '',
        description: '',
        severity: 'medium',
        category: 'other',
        affectedServices: [],
        impact: 'minor'
    });

    const handleCreateIncident = async () => {
        // Sanitize inputs
        const sanitized = {
            title: sanitizeText(formData.title),
            description: sanitizeHtml(formData.description, 'BASIC'),
            severity: formData.severity,
            category: formData.category,
            affectedServices: formData.affectedServices,
            impact: formData.impact
        };
        
        // Validate
        const result = incidentSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        await createIncident.mutateAsync(result.data);
        setShowCreateModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            severity: 'medium',
            category: 'other',
            affectedServices: [],
            impact: 'minor'
        });
    };

    const handleAddUpdate = async () => {
        if (!selectedIncident) return;
        
        // Sanitize
        const sanitized = {
            message: sanitizeHtml(updateText, 'BASIC')
        };
        
        // Validate
        const result = incidentUpdateSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            await addUpdate.mutateAsync({
                id: selectedIncident.id,
                message: result.data.message,
                userId: 'system', // Replace with actual user ID from auth context
                data: { timestamp: new Date().toISOString(), type: 'update' }
            });
            setUpdateText('');
        } catch (error) {
            console.error('Failed to add update:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        };
        return colors[severity as keyof typeof colors] || colors.medium;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            investigating: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            identified: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            monitoring: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return colors[status as keyof typeof colors] || colors.open;
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const filteredIncidents = incidents?.filter(incident => {
        if (activeTab === 'open') return ['open', 'investigating', 'identified', 'monitoring'].includes(incident.status);
        if (activeTab === 'resolved') return ['resolved', 'closed'].includes(incident.status);
        return true;
    }) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incident Response</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor and manage system incidents
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        name="detect-issues"
                        onClick={() => detectIncidents()}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" />
                        Detect Issues
                    </Button>
                    <Button
                        name="create-incident"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Incident
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Open Incidents</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {openIncidents?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {criticalIncidents?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg MTTR</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats ? formatDuration(stats.averageResolutionTime) : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved (30d)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats?.total || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['open', 'resolved', 'all'] as const).map((tab) => (
                    <button
                        key={tab}
                        name={`incident-tab-${tab}`}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-4 font-medium transition-colors ${
                            activeTab === tab
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                    <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4"
                    >
                        {/* Incident Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {incident.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                        {incident.severity}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                                        {incident.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {incident.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Category: {incident.category}</span>
                                    <span>•</span>
                                    <span>Impact: {incident.impact}</span>
                                    <span>•</span>
                                    <span>Priority: P{incident.priority}</span>
                                    {incident.affectedUsers && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {incident.affectedUsers} affected
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {incident.status === 'open' && (
                                    <Button
                                        name="acknowledge-incident"
                                        onClick={() => acknowledgeIncident.mutateAsync({ id: incident.id, userId: 'system' })}
                                        disabled={acknowledgeIncident.isPending}
                                        size="sm"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Acknowledge
                                    </Button>
                                )}

                                {['investigating', 'identified', 'monitoring'].includes(incident.status) && (
                                    <>
                                        <Button
                                            name="escalate-incident"
                                            onClick={() => escalateIncident.mutateAsync({ id: incident.id })}
                                            disabled={escalateIncident.isPending}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <ArrowUp className="w-4 h-4 mr-1" />
                                            Escalate
                                        </Button>
                                        <Button
                                            name="resolve-incident"
                                            onClick={() => resolveIncident.mutateAsync({
                                                id: incident.id,
                                                resolution: 'Issue resolved',
                                                rootCause: 'To be documented',
                                                preventionSteps: []
                                            })}
                                            disabled={resolveIncident.isPending}
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Resolve
                                        </Button>
                                    </>
                                )}

                                <Button
                                    name="toggle-timeline"
                                    onClick={() => setSelectedIncident(selectedIncident?.id === incident.id ? null : incident)}
                                    variant="outline"
                                    size="sm"
                                >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Timeline
                                </Button>
                            </div>
                        </div>

                        {/* Timeline (when expanded) */}
                        {selectedIncident?.id === incident.id && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3"
                            >
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {incident.timeline?.map((event: any, index: number) => (
                                        <div key={index} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    event.type === 'resolved' ? 'bg-green-500' :
                                                    event.type === 'escalated' ? 'bg-orange-500' :
                                                    'bg-blue-500'
                                                }`} />
                                                {index < incident.timeline.length - 1 && (
                                                    <div className="w-px h-full bg-gray-200 dark:bg-gray-700 mt-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {event.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Update */}
                                <div className="flex gap-2">
                                    <input
                                        name="incident-update-text"
                                        type="text"
                                        value={updateText}
                                        onChange={(e) => setUpdateText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddUpdate()}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        placeholder="Add update..."
                                    />
                                    <Button
                                        name="add-update"
                                        onClick={handleAddUpdate}
                                        disabled={addUpdate.isPending || !updateText}
                                        size="sm"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Metrics */}
                        {incident.responseTime !== undefined && (
                            <div className="flex gap-6 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Response Time: </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatDuration(incident.responseTime)}
                                    </span>
                                </div>
                                {incident.resolutionTime !== undefined && (
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Resolution Time: </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatDuration(incident.resolutionTime)}
                                        </span>
                                    </div>
                                )}
                                {incident.downtimeMinutes !== undefined && incident.downtimeMinutes > 0 && (
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Downtime: </span>
                                        <span className="font-medium text-red-600 dark:text-red-400">
                                            {formatDuration(incident.downtimeMinutes)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}

                {filteredIncidents.length === 0 && (
                    <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            No {activeTab} incidents found
                        </p>
                    </div>
                )}
            </div>

            {/* Create Incident Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Create Incident
                                </h2>
                                <button
                                    name="close-modal"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Title
                                    </label>
                                    <input
                                        name="incident-title"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Database connection pool exhausted"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="incident-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows={3}
                                        placeholder="Detailed description of the incident..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Severity
                                        </label>
                                        <select
                                            name="incident-severity"
                                            value={formData.severity}
                                            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Category
                                        </label>
                                        <select
                                            name="incident-category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="performance">Performance</option>
                                            <option value="security">Security</option>
                                            <option value="availability">Availability</option>
                                            <option value="data">Data</option>
                                            <option value="integration">Integration</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Impact Level
                                    </label>
                                    <select
                                        name="incident-impact"
                                        value={formData.impact}
                                        onChange={(e) => setFormData({ ...formData, impact: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="none">None</option>
                                        <option value="minor">Minor</option>
                                        <option value="major">Major</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    name="cancel-incident"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    name="submit-incident"
                                    onClick={handleCreateIncident}
                                    disabled={createIncident.isPending || !formData.title || !formData.description}
                                >
                                    Create Incident
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
