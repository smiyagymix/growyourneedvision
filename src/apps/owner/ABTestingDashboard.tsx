/**
 * A/B Testing Dashboard
 * 
 * Complete A/B testing management with test creation, variant management,
 * and statistical analysis of results
 */

import React, { useState } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { motion } from 'framer-motion';
import { useABTesting } from '../../hooks/useABTesting';
import { Loader, Plus, Play, Pause, CheckCircle, TrendingUp, Users, Target, BarChart3, Settings } from 'lucide-react';
import { Button } from '../../components/shared/ui/Button';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const abTestSchema = z.object({
    name: z.string().min(3, 'Test name must be at least 3 characters').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    featureFlag: z.string().min(1, 'Feature flag is required'),
    variants: z.array(z.object({
        name: z.string().min(1, 'Variant name required'),
        weight: z.number().min(0).max(100),
        config: z.any()
    })).min(2, 'At least 2 variants required'),
    targeting: z.object({
        percentage: z.number().min(1).max(100).optional()
    })
}).refine(data => {
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    return totalWeight === 100;
}, { message: 'Variant weights must sum to 100%' });

interface CreateTestForm {
    name: string;
    description: string;
    featureFlag: string;
    variants: {
        name: string;
        weight: number;
        config: any;
    }[];
    targeting: {
        tenantIds?: string[];
        plans?: string[];
        userRoles?: string[];
        percentage?: number;
    };
}

export const ABTestingDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'completed'>('active');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState<string | null>(null);
    
    const { 
        tests, 
        runningTests, 
        allTestResults,
        testResults,
        createTest, 
        startTest, 
        pauseTest, 
        completeTest,
        isCreating,
        isStarting,
        isPausing,
        isCompleting
    } = useABTesting();

    const [formData, setFormData] = useState<CreateTestForm>({
        name: '',
        description: '',
        featureFlag: '',
        variants: [
            { name: 'Control', weight: 50, config: {} },
            { name: 'Variant A', weight: 50, config: {} }
        ],
        targeting: {
            percentage: 100
        }
    });

    const handleCreateTest = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(formData.name),
            description: formData.description ? sanitizeHtml(formData.description, 'BASIC') : '',
            featureFlag: sanitizeText(formData.featureFlag),
            variants: formData.variants.map(v => ({
                name: sanitizeText(v.name),
                weight: v.weight,
                config: v.config
            })),
            targeting: formData.targeting
        };
        
        // Validate
        const result = abTestSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        await createTest.mutateAsync(result.data);
        setShowCreateModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            featureFlag: '',
            variants: [
                { name: 'Control', weight: 50, config: {} },
                { name: 'Variant A', weight: 50, config: {} }
            ],
            targeting: {
                percentage: 100
            }
        });
    };

    const addVariant = () => {
        const currentVariants = formData.variants;
        const newWeight = Math.floor(100 / (currentVariants.length + 1));
        const adjustedVariants = currentVariants.map(v => ({ ...v, weight: newWeight }));
        
        setFormData({
            ...formData,
            variants: [
                ...adjustedVariants,
                { name: `Variant ${String.fromCharCode(65 + currentVariants.length - 1)}`, weight: newWeight, config: {} }
            ]
        });
    };

    const updateVariantWeight = (index: number, weight: number) => {
        const newVariants = [...formData.variants];
        newVariants[index].weight = weight;
        setFormData({ ...formData, variants: newVariants });
    };

    const filteredTests = tests?.filter(test => {
        if (activeTab === 'active') return test.status === 'running';
        if (activeTab === 'draft') return test.status === 'draft';
        return test.status === 'completed';
    }) || [];

    const getTestResults = (testId: string) => {
        return testResults(testId);
    };

    const getWinnerBadge = (results: any) => {
        if (!results?.winner) return null;
        
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span>Winner: {results.winner}</span>
                <span className="text-xs">({results.confidence}% confidence)</span>
            </div>
        );
    };

    const getSignificanceBadge = (isSignificant: boolean) => {
        if (isSignificant) {
            return (
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Significant
                </span>
            );
        }
        return (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                Not Significant
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">A/B Testing</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage experiments and analyze results
                    </p>
                </div>
                <Button
                    name="create-test"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Test
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Tests</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {runningTests?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {tests?.filter(t => t.status === 'completed').length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {tests?.length ? Math.round((allTestResults.filter(r => r.winner).length / tests.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Sample Size</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {tests?.length ? Math.round(tests.reduce((sum, t) => {
                                    const results = getTestResults(t.id);
                                    return sum + (results?.variantPerformance.reduce((s: number, v: any) => s + v.sampleSize, 0) || 0);
                                }, 0) / tests.length) : 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['active', 'draft', 'completed'] as const).map((tab) => (
                    <button
                        key={tab}
                        name={`tab-${tab}`}
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

            {/* Tests List */}
            <div className="space-y-4">
                {filteredTests.map((test) => {
                    const results = getTestResults(test.id);
                    
                    return (
                        <motion.div
                            key={test.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4"
                        >
                            {/* Test Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {test.name}
                                        </h3>
                                        {results && getWinnerBadge(results)}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {test.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                        <span>Feature: {test.feature}</span>
                                        <span>•</span>
                                        <span>{test.variants.length} variants</span>
                                        {test.targeting.percentage && (
                                            <>
                                                <span>•</span>
                                                <span>{test.targeting.percentage}% rollout</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {test.status === 'running' && (
                                        <Button
                                            name="pause-test"
                                            onClick={() => pauseTest.mutateAsync(test.id)}
                                            disabled={isPausing}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Pause className="w-4 h-4 mr-1" />
                                            Pause
                                        </Button>
                                    )}
                                    
                                    {test.status === 'draft' && (
                                        <Button
                                            name="start-test"
                                            onClick={() => startTest.mutateAsync(test.id)}
                                            disabled={isStarting}
                                            size="sm"
                                        >
                                            <Play className="w-4 h-4 mr-1" />
                                            Start
                                        </Button>
                                    )}

                                    {test.status === 'running' && (
                                        <Button
                                            name="complete-test"
                                            onClick={() => completeTest.mutateAsync({ testId: test.id })}
                                            disabled={isCompleting}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Variants Performance */}
                            {results && (
                                <div className="space-y-3">
                                    {results.variantPerformance.map((variant: any, index: number) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="w-32">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {variant.variant}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {variant.sampleSize} users
                                                </p>
                                            </div>
                                            
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Conversion: {variant.conversionRate.toFixed(2)}%
                                                    </span>
                                                    {variant.improvement !== 0 && (
                                                        <span className={`flex items-center gap-1 ${variant.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            <TrendingUp className={`w-3 h-3 ${variant.improvement < 0 ? 'rotate-180' : ''}`} />
                                                            {Math.abs(variant.improvement).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${variant.conversionRate}%` }}
                                                        className={`h-full ${
                                                            variant.variant === results.winner
                                                                ? 'bg-green-500'
                                                                : 'bg-blue-500'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            {variant.isSignificant !== undefined && getSignificanceBadge(variant.isSignificant)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}

                {filteredTests.length === 0 && (
                    <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            No {activeTab} tests found
                        </p>
                    </div>
                )}
            </div>

            {/* Create Test Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Create A/B Test
                            </h2>

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Test Name
                                    </label>
                                    <input
                                        name="test-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="New Dashboard Layout"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="test-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows={3}
                                        placeholder="Test impact of new dashboard design on user engagement"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Feature Flag
                                    </label>
                                    <input
                                        name="feature-flag"
                                        type="text"
                                        value={formData.featureFlag}
                                        onChange={(e) => setFormData({ ...formData, featureFlag: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="dashboard_v2"
                                    />
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Variants (weights must sum to 100%)
                                    </label>
                                    <Button name="add-variant" onClick={addVariant} size="sm" variant="outline">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Variant
                                    </Button>
                                </div>

                                {formData.variants.map((variant, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => {
                                                const newVariants = [...formData.variants];
                                                newVariants[index].name = e.target.value;
                                                setFormData({ ...formData, variants: newVariants });
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="Variant name"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={variant.weight}
                                                onChange={(e) => updateVariantWeight(index, parseInt(e.target.value) || 0)}
                                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-gray-600 dark:text-gray-400">%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Targeting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rollout Percentage
                                </label>
                                <input
                                    name="rollout-percentage"
                                    type="number"
                                    value={formData.targeting.percentage || 100}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        targeting: { ...formData.targeting, percentage: parseInt(e.target.value) || 0 }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    name="modal-cancel"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    name="modal-create-test"
                                    onClick={handleCreateTest}
                                    disabled={isCreating || !formData.name || !formData.featureFlag}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Test'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
