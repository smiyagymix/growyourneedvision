/**
 * Tenant Cloning Dashboard
 * 
 * Manage tenant cloning, templates, and migration
 */

import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import { useTenantCloning } from '../../hooks/useTenantCloning';
import { Copy, FileText, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { z } from 'zod';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

export const TenantCloningDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'templates' | 'jobs' | 'clone'>('templates');
    const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
    const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    
    const { 
        templates, 
        templatesLoading, 
        cloneJobs, 
        jobsLoading,
        cloneTenant,
        createTemplate,
        applyTemplate 
    } = useTenantCloning();

    const [cloneFormData, setCloneFormData] = useState({
        sourceTenantId: '',
        newName: '',
        newSubdomain: '',
        plan: 'basic',
        includeUsers: false,
        includeData: true,
        includeSettings: true
    });

    const [templateFormData, setTemplateFormData] = useState({
        name: '',
        description: '',
        category: 'Standard',
        sourceTenantId: '',
        includeUsers: false,
        includeData: true,
        includeSettings: true,
        includeFeatureFlags: false
    });

    const [applyTemplateFormData, setApplyTemplateFormData] = useState({
        targetTenantId: '',
        overrideExisting: false
    });

    const handleClone = async () => {
        await cloneTenant.mutateAsync({
            sourceTenantId: cloneFormData.sourceTenantId,
            newTenantData: {
                name: cloneFormData.newName,
                subdomain: cloneFormData.newSubdomain,
                plan: cloneFormData.plan
            },
            options: {
                includeUsers: cloneFormData.includeUsers,
                includeData: cloneFormData.includeData,
                includeSettings: cloneFormData.includeSettings
            }
        });
    };

    const handleCreateTemplate = async () => {
        const { showToast } = useToast();

        // Sanitize
        const sanitized = {
            name: sanitizeText(templateFormData.name),
            description: sanitizeHtml(templateFormData.description, 'BASIC'),
            category: sanitizeText(templateFormData.category),
            sourceTenantId: templateFormData.sourceTenantId,
            includeUsers: templateFormData.includeUsers,
            includeData: templateFormData.includeData,
            includeSettings: templateFormData.includeSettings,
            includeFeatureFlags: templateFormData.includeFeatureFlags
        };

        // Validate
        const templateSchema = z.object({
            name: z.string().min(3, 'Name must be at least 3 characters').max(100),
            description: z.string().min(10, 'Description must be at least 10 characters').max(500),
            category: z.string().min(1),
            sourceTenantId: z.string().min(1, 'Source tenant is required'),
            includeUsers: z.boolean(),
            includeData: z.boolean(),
            includeSettings: z.boolean(),
            includeFeatureFlags: z.boolean()
        });

        const result = templateSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await createTemplate.mutateAsync({
                name: result.data.name,
                description: result.data.description,
                category: result.data.category,
                sourceTenantId: result.data.sourceTenantId,
                includes: {
                    users: result.data.includeUsers,
                    data: result.data.includeData,
                    settings: result.data.includeSettings,
                    featureFlags: result.data.includeFeatureFlags
                }
            });
            setIsCreateTemplateModalOpen(false);
            setTemplateFormData({
                name: '',
                description: '',
                category: 'Standard',
                sourceTenantId: '',
                includeUsers: false,
                includeData: true,
                includeSettings: true,
                includeFeatureFlags: false
            });
            showToast('Template created successfully', 'success');
        } catch (error) {
            console.error('Failed to create template:', error);
            showToast('Failed to create template', 'error');
        }
    };

    const handleApplyTemplate = async () => {
        try {
            if (!selectedTemplate) return;
            await applyTemplate.mutateAsync({
                templateId: selectedTemplate.id,
                tenantId: applyTemplateFormData.targetTenantId
            });
            setIsApplyTemplateModalOpen(false);
            setSelectedTemplate(null);
            setApplyTemplateFormData({
                targetTenantId: '',
                overrideExisting: false
            });
        } catch (error) {
            console.error('Failed to apply template:', error);
        }
    };

    const openApplyTemplateModal = (template: any) => {
        setSelectedTemplate(template);
        setIsApplyTemplateModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'processing': return 'text-blue-600 bg-blue-50';
            case 'failed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'processing': return <Loader className="w-4 h-4 animate-spin" />;
            case 'failed': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tenant Cloning
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Clone tenants, manage templates, and track migrations
                    </p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'templates' && (
                        <motion.button
                            name="open-create-template-modal"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCreateTemplateModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Create Template
                        </motion.button>
                    )}
                    <motion.button
                        name="open-clone-tenant-form"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('clone')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        Clone Tenant
                    </motion.button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    {['templates', 'jobs', 'clone'].map((tab) => (
                        <button
                            key={tab}
                            name={`tab-${tab}`}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 border-b-2 transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templatesLoading ? (
                        <div className="col-span-3 text-center py-12">
                            <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="col-span-3 text-center py-12">
                            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No templates yet</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                        {template.category}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {template.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {template.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Object.entries(template.includes).map(([key, value]) => 
                                        value ? (
                                            <span 
                                                key={key}
                                                className="px-2 py-1 text-xs rounded bg-green-100 text-green-700"
                                            >
                                                {key}
                                            </span>
                                        ) : null
                                    )}
                                </div>
                                <button
                                    name={`use-template-${template.id}`}
                                    onClick={() => openApplyTemplateModal(template)}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    Use Template
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Clone Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="space-y-4">
                    {jobsLoading ? (
                        <div className="text-center py-12">
                            <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                        </div>
                    ) : cloneJobs.length === 0 ? (
                        <div className="text-center py-12">
                            <Copy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">No cloning jobs yet</p>
                        </div>
                    ) : (
                        cloneJobs.map((job) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Copy className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                Clone Job #{job.id.slice(0, 8)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Source: {job.sourceTenantId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                                        {getStatusIcon(job.status)}
                                        <span className="text-sm font-medium capitalize">{job.status}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-medium">{job.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${job.progress}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="bg-blue-600 h-2 rounded-full"
                                        />
                                    </div>
                                </div>

                                {/* Includes */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(job.includeData).map(([key, value]) => 
                                        value ? (
                                            <span 
                                                key={key}
                                                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                                            >
                                                {key}
                                            </span>
                                        ) : null
                                    )}
                                </div>

                                {job.error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        {job.error}
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Clone Form Tab */}
            {activeTab === 'clone' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                    <h2 className="text-xl font-semibold mb-6">Clone Tenant</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Source Tenant ID</label>
                            <input
                                name="clone-source-tenant-id"
                                type="text"
                                value={cloneFormData.sourceTenantId}
                                onChange={(e) => setCloneFormData({ ...cloneFormData, sourceTenantId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter tenant ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">New Tenant Name</label>
                            <input
                                name="clone-new-tenant-name"
                                type="text"
                                value={cloneFormData.newName}
                                onChange={(e) => setCloneFormData({ ...cloneFormData, newName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter new name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Subdomain</label>
                            <input
                                name="clone-new-subdomain"
                                type="text"
                                value={cloneFormData.newSubdomain}
                                onChange={(e) => setCloneFormData({ ...cloneFormData, newSubdomain: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                                placeholder="Enter subdomain"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Plan</label>
                            <select
                                name="clone-plan-select"
                                value={cloneFormData.plan}
                                onChange={(e) => setCloneFormData({ ...cloneFormData, plan: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                            >
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="professional">Professional</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    name="clone-include-users"
                                    type="checkbox"
                                    checked={cloneFormData.includeUsers}
                                    onChange={(e) => setCloneFormData({ ...cloneFormData, includeUsers: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">Include Users</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    name="clone-include-data"
                                    type="checkbox"
                                    checked={cloneFormData.includeData}
                                    onChange={(e) => setCloneFormData({ ...cloneFormData, includeData: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">Include Data (classes, courses, etc.)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    name="clone-include-settings"
                                    type="checkbox"
                                    checked={cloneFormData.includeSettings}
                                    onChange={(e) => setCloneFormData({ ...cloneFormData, includeSettings: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">Include Settings</span>
                            </label>
                        </div>

                        <motion.button
                            name="start-cloning"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleClone}
                            disabled={cloneTenant.isPending}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {cloneTenant.isPending ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Cloning...
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    Start Cloning
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Create Template Modal */}
            {isCreateTemplateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Template</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Template Name</label>
                                <input
                                    name="template-name"
                                    type="text"
                                    value={templateFormData.name}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                                    placeholder="e.g., Standard School Setup"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    name="template-description"
                                    value={templateFormData.description}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                                    rows={3}
                                    placeholder="Describe what this template includes..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    name="template-category"
                                    value={templateFormData.category}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Education">Education</option>
                                    <option value="Enterprise">Enterprise</option>
                                    <option value="Custom">Custom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Source Tenant ID</label>
                                <input
                                    name="template-source-tenant"
                                    type="text"
                                    value={templateFormData.sourceTenantId}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, sourceTenantId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600"
                                    placeholder="Tenant to create template from"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium mb-2">Include in Template:</p>
                                <label className="flex items-center gap-2">
                                    <input
                                        name="template-include-users"
                                        type="checkbox"
                                        checked={templateFormData.includeUsers}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, includeUsers: e.target.checked })}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm">User Roles & Permissions</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        name="template-include-data"
                                        type="checkbox"
                                        checked={templateFormData.includeData}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, includeData: e.target.checked })}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm">Data Structure (Classes, Courses, etc.)</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        name="template-include-settings"
                                        type="checkbox"
                                        checked={templateFormData.includeSettings}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, includeSettings: e.target.checked })}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm">System Settings</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        name="template-include-feature-flags"
                                        type="checkbox"
                                        checked={templateFormData.includeFeatureFlags}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, includeFeatureFlags: e.target.checked })}
                                        className="w-4 h-4 text-green-600"
                                    />
                                    <span className="text-sm">Feature Flags</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    name="cancel-create-template"
                                    onClick={() => setIsCreateTemplateModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    name="submit-create-template"
                                    onClick={handleCreateTemplate}
                                    disabled={createTemplate.isPending || !templateFormData.name || !templateFormData.sourceTenantId}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {createTemplate.isPending ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Template'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Apply Template Modal */}
            {isApplyTemplateModalOpen && selectedTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6"
                    >
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Apply Template</h2>
                        
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{selectedTemplate.name}</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{selectedTemplate.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Tenant ID</label>
                                <input
                                    name="apply-template-target-tenant"
                                    type="text"
                                    value={applyTemplateFormData.targetTenantId}
                                    onChange={(e) => setApplyTemplateFormData({ ...applyTemplateFormData, targetTenantId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                                    placeholder="Enter tenant ID to apply template"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    name="apply-template-override"
                                    type="checkbox"
                                    checked={applyTemplateFormData.overrideExisting}
                                    onChange={(e) => setApplyTemplateFormData({ ...applyTemplateFormData, overrideExisting: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm">Override existing configuration</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    name="cancel-apply-template"
                                    onClick={() => {
                                        setIsApplyTemplateModalOpen(false);
                                        setSelectedTemplate(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    name="submit-apply-template"
                                    onClick={handleApplyTemplate}
                                    disabled={applyTemplate.isPending || !applyTemplateFormData.targetTenantId}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {applyTemplate.isPending ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        'Apply Template'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
