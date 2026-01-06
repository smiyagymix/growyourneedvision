import React, { useEffect, useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { ownerService, SubscriptionPlan } from '../../services/ownerService';
import { Button, Card, Icon } from '../../components/shared/ui/CommonUI';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { subscriptionPlanSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

interface PlanFormData {
    name: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    is_active: boolean;
    max_users?: number;
    max_storage_gb?: number;
}

export const SubscriptionPlans: React.FC = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [formData, setFormData] = useState<PlanFormData>({
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        features: [''],
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await ownerService.getSubscriptionPlans();
            setPlans(data);
        } catch (error) {
            console.error("Failed to load plans", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price_monthly: 0,
            price_yearly: 0,
            features: [''],
            is_active: true
        });
        setEditingPlan(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
            features: plan.features || [''],
            is_active: plan.is_active,
            max_users: plan.max_users,
            max_storage_gb: plan.max_storage_gb
        });
        setShowModal(true);
    };

    const handleDelete = async (plan: SubscriptionPlan) => {
        if (!confirm(`Are you sure you want to delete the "${plan.name}" plan? This action cannot be undone.`)) return;
        try {
            await ownerService.deleteSubscriptionPlan(plan.id);
            setPlans(plans.filter(p => p.id !== plan.id));
        } catch (error) {
            console.error('Failed to delete plan:', error);
            alert('Failed to delete plan');
        }
    };

    const handleSave = async () => {
        const { showToast } = useToast();
        // Sanitize inputs
        const sanitizedData = {
            ...formData,
            name: sanitizeText(formData.name),
            features: formData.features.filter(f => f.trim() !== '').map(f => sanitizeText(f))
        };

        // Validate with Zod
        const validationResult = subscriptionPlanSchema.safeParse(sanitizedData);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }
        
        setSaving(true);
        try {
            
            if (editingPlan) {
                const updated = await ownerService.updateSubscriptionPlan(editingPlan.id, sanitizedData);
                setPlans(plans.map(p => p.id === editingPlan.id ? updated : p));
            } else {
                const created = await ownerService.createSubscriptionPlan(sanitizedData);
                setPlans([...plans, created]);
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save plan:', error);
            alert('Failed to save plan');
        }
        setSaving(false);
    };

    const addFeature = () => {
        setFormData({ ...formData, features: [...formData.features, ''] });
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const removeFeature = (index: number) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData({ ...formData, features: newFeatures.length ? newFeatures : [''] });
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Subscription Plans</h2>
                <Button variant="primary" onClick={handleCreate} leftIcon={<Icon name="Plus" className="w-4 h-4" />} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md" name="create-plan">
                    Create Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className="p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gyn-blue-dark dark:text-white">{plan.name}</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">${plan.price_monthly}</span>
                                    <span className="text-gray-500 text-sm ml-1">/mo</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">${plan.price_yearly}/yr (Save 20%)</div>
                            </div>
                            {plan.is_active ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Draft</span>
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <Icon name="Check" className="w-4 h-4 text-green-500 mr-2" />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(plan)} name="edit-plan">Edit</Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(plan)} name="delete-plan">Delete</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Plan Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name *</label>
                                <input
                                    type="text"
                                    name="plan-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="e.g., Professional"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
                                    <input
                                        type="number"
                                        name="price-monthly"
                                        value={formData.price_monthly}
                                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Price ($)</label>
                                    <input
                                        type="number"
                                        name="price-yearly"
                                        value={formData.price_yearly}
                                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Users</label>
                                    <input
                                        type="number"
                                        name="max-users"
                                        value={formData.max_users || ''}
                                        onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        placeholder="Unlimited"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage (GB)</label>
                                    <input
                                        type="number"
                                        name="max-storage"
                                        value={formData.max_storage_gb || ''}
                                        onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) || undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        placeholder="Unlimited"
                                        min="0"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Features</label>
                                <div className="space-y-2">
                                    {formData.features.map((feature, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                name="plan-feature"
                                                value={feature}
                                                onChange={(e) => updateFeature(idx, e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                                placeholder="e.g., Unlimited projects"
                                            />
                                            <Button variant="ghost" size="sm" onClick={() => removeFeature(idx)} className="text-red-500" name="remove-feature">
                                                <Icon name="XMarkIcon" className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" onClick={addFeature} className="mt-2" name="add-feature">
                                    <Icon name="PlusIcon" className="w-4 h-4 mr-1" /> Add Feature
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is-active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active (visible to customers)</label>
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1" name="modal-cancel">Cancel</Button>
                                <Button variant="primary" onClick={handleSave} className="flex-1" disabled={saving} name="modal-save">
                                    {saving ? 'Saving...' : (editingPlan ? 'Save Changes' : 'Create Plan')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
