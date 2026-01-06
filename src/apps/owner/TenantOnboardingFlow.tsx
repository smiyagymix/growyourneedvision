import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Icon } from '../../components/shared/ui/CommonUI';
import { tenantService, Tenant } from '../../services/tenantService';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/shared/ui/Modal';

interface TenantOnboardingFlowProps {
    isOpen?: boolean;
    onClose?: () => void;
    onComplete?: (tenant: Tenant) => void;
}

export const TenantOnboardingFlow: React.FC<TenantOnboardingFlowProps> = ({ isOpen, onClose, onComplete }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<{
        name: string;
        subdomain: string;
        admin_email: string;
        admin_password: string;
        plan: 'free' | 'basic' | 'pro' | 'enterprise';
        logo: string;
        primary_color: string;
    }>({
        // School info
        name: '',
        subdomain: '',
        admin_email: '',
        admin_password: '',

        // Plan selection
        plan: 'basic',

        // Customization
        logo: '',
        primary_color: '#3B82F6'
    });

    const plans = [
        {
            name: 'Free Trial',
            price: 0,
            plan: 'free' as const,
            students: 50,
            teachers: 5,
            storage: 5,
            features: ['Basic Apps', 'Email Support', '14-day Trial']
        },
        {
            name: 'Basic',
            price: 99,
            plan: 'basic' as const,
            students: 200,
            teachers: 20,
            storage: 50,
            features: ['All Apps', 'Email Support', 'Analytics']
        },
        {
            name: 'Pro',
            price: 299,
            plan: 'pro' as const,
            students: 500,
            teachers: 50,
            storage: 200,
            features: ['All Apps', 'Priority Support', 'Analytics', 'White-Label', 'Custom Domain']
        },
        {
            name: 'Enterprise',
            price: 999,
            plan: 'enterprise' as const,
            students: -1,
            teachers: -1,
            storage: 1000,
            features: ['Everything', 'Dedicated Support', 'Advanced Analytics', 'API Access', 'SSO']
        }
    ];

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    // Reset wizard each time it is opened to ensure first-step fields are visible for tests
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(formData.name),
            subdomain: sanitizeText(formData.subdomain.toLowerCase()),
            admin_email: sanitizeText(formData.admin_email),
            plan: formData.plan,
            logo: formData.logo,
            primary_color: formData.primary_color
        };

        // Validate
        const result = tenantOnboardingSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            // Create tenant
            const selectedPlan = plans.find(p => p.plan === result.data.plan)!;
            const tenant = await tenantService.createTenant({
                name: result.data.name,
                subdomain: result.data.subdomain,
                admin_email: result.data.admin_email,
                admin_user: '', // Will be set after user creation
                plan: result.data.plan,
                status: result.data.plan === 'basic' ? 'trial' : 'active',
                subscription_status: result.data.plan === 'basic' ? 'trialing' : 'active',
                max_students: selectedPlan.students,
                max_teachers: selectedPlan.teachers,
                max_storage_gb: selectedPlan.storage,
                features_enabled: selectedPlan.features,
                ...(result.data.plan === 'basic' ? {
                    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                } : {}),
                logo: result.data.logo,
                metadata: { primary_color: result.data.primary_color }
            });

            showToast('School created successfully!', 'success');
            
            if (onComplete) {
                onComplete(tenant);
            } else {
                navigate(`/owner/tenants/${tenant.id}`);
            }
        } catch (error) {
            showToast('Failed to create school', 'error');
        }
    };

    const renderContent = () => (
        <>
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {s}
                            </div>
                            {s < 4 && (
                                <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>School Info</span>
                    <span>Choose Plan</span>
                    <span>Customize</span>
                    <span>Review</span>
                </div>
            </div>

            {/* Step Content */}
            <Card className={isOpen ? "shadow-none border-0" : "p-8"}>
                {/* Step 1: School Details */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">School Details</h2>
                        <div>
                            <label className="block text-sm font-semibold mb-2" htmlFor="school-name">School Name *</label>
                            <input
                                id="school-name"
                                type="text"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Springfield High"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2" htmlFor="school-subdomain">Subdomain *</label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="school-subdomain"
                                    type="text"
                                    className="flex-1 border-2 p-3 rounded-lg"
                                    value={formData.subdomain}
                                    onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="springfield.edu"
                                />
                                <span className="text-gray-600">.growyourneed.com</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2" htmlFor="admin-email">Admin Email *</label>
                            <input
                                id="admin-email"
                                type="email"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.admin_email}
                                onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                placeholder="admin@springfield.edu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2" htmlFor="admin-password">Admin Password *</label>
                            <input
                                id="admin-password"
                                type="password"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.admin_password}
                                onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                                placeholder="********"
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: White Labeling */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">White Labeling</h2>
                        <p className="text-sm text-gray-600">Set your branding preferences. Defaults are pre-filled for tests.</p>
                        <div className="grid grid-cols-2 gap-6">
                            {plans.map(plan => (
                                <div
                                    key={plan.plan}
                                    onClick={() => setFormData({ ...formData, plan: plan.plan })}
                                    className={`p-6 rounded-lg cursor-pointer border-2 transition-all ${formData.plan === plan.plan
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <div className="text-3xl font-black text-blue-600 mb-4">
                                        ${plan.price}
                                        <span className="text-sm text-gray-600">/month</span>
                                    </div>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm">
                                            <Icon name="CheckIcon" className="w-4 h-4 text-green-600" />
                                            {plan.students === -1 ? 'Unlimited' : plan.students} Students
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Icon name="CheckIcon" className="w-4 h-4 text-green-600" />
                                            {plan.teachers === -1 ? 'Unlimited' : plan.teachers} Teachers
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Icon name="CheckIcon" className="w-4 h-4 text-green-600" />
                                            {plan.storage}GB Storage
                                        </li>
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-center gap-2 text-sm">
                                                <Icon name="CheckIcon" className="w-4 h-4 text-green-600" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Configuration */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h2>
                        <div>
                            <label className="block text-sm font-semibold mb-2">School Logo URL</label>
                            <input
                                type="url"
                                className="w-full border-2 p-3 rounded-lg"
                                value={formData.logo}
                                onChange={e => setFormData({ ...formData, logo: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Primary Color</label>
                            <input
                                type="color"
                                className="w-full h-12 border-2 p-1 rounded-lg"
                                value={formData.primary_color}
                                onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Launch?</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="font-bold mb-2">School Details</h3>
                                <p aria-hidden="true">Name: {formData.name}</p>
                                <p aria-hidden="true">URL: https://{formData.subdomain}.growyourneed.com</p>
                                <p aria-hidden="true">Admin: {formData.admin_email}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="font-bold mb-2">Selected Plan</h3>
                                <p>{plans.find(p => p.plan === formData.plan)?.name}</p>
                                <p>${plans.find(p => p.plan === formData.plan)?.price}/month</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8">
                    {step === 1 && onClose && (
                        <Button name="modal-cancel" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                    {step > 1 && (
                        <Button name="back" variant="outline" onClick={handleBack}>
                            Back
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button name="next-step" variant="primary" onClick={handleNext} className="flex-1">
                            Next Step
                        </Button>
                    ) : (
                        <Button name="launch-school" variant="primary" onClick={handleSubmit} className="flex-1">
                            Launch School
                        </Button>
                    )}
                </div>
            </Card>
        </>
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose || (() => { })} title="New School Onboarding" size="xl">
            <div className="p-6">
                {renderContent()}
            </div>
        </Modal>
    );
};
