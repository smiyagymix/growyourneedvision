import React, { useState } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { Modal } from '../../components/shared/ui/Modal';
import { Input } from '../../components/shared/ui/Input';
import { Select } from '../../components/shared/ui/Select';
import { Button } from '../../components/shared/ui/Button';
import { tenantService, Tenant } from '../../services/tenantService';
import { z } from 'zod';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText, sanitizeHtml } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const onboardingSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters').max(100),
  subdomain: z.string().min(2, 'Subdomain too short').max(50).regex(/^[a-z0-9-]+$/, 'Subdomain must be lowercase with dashes'),
  admin_email: emailSchema,
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  plan: z.enum(['basic', 'pro', 'premium'])
});

interface SchoolOnboardingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (tenant: Tenant) => void;
}

const STEPS = ['Basic Info', 'Branding', 'Configuration', 'Review'];

export const SchoolOnboardingWizard: React.FC<SchoolOnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Tenant> & { adminPassword?: string }>({
        status: 'trial',
        plan: 'basic',
        branding: {
            primaryColor: '#1d2a78',
            secondaryColor: '#ffffff',
            fontFamily: 'Inter'
        },
        settings: {
            allowRegistration: false,
            requireEmailVerification: true,
            defaultUserRole: 'Student',
            features: ['LMS', 'Attendance']
        }
    });

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        const { showToast } = useToast();
        setLoading(true);

        // Sanitize
        const sanitized = {
            name: sanitizeText(formData.name || ''),
            subdomain: sanitizeText((formData.subdomain || '').toLowerCase()),
            admin_email: sanitizeText(formData.admin_email || ''),
            adminPassword: formData.adminPassword || '',
            plan: formData.plan || 'basic'
        };

        // Validate
        const result = onboardingSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            setLoading(false);
            return;
        }

        try {
            // 1. Create Tenant
            const newTenant = await tenantService.createTenant({ ...formData, ...result.data });
            
            // 2. Create Admin User for the Tenant
            if (result.data.admin_email && result.data.adminPassword) {
                await tenantService.addTenantUser(newTenant.id, {
                    email: result.data.admin_email,
                    password: result.data.adminPassword,
                    passwordConfirm: result.data.adminPassword,
                    name: 'School Admin',
                    role: 'Admin',
                    status: 'Active',
                    username: result.data.admin_email.split('@')[0] + '_' + Math.floor(Math.random() * 1000)
                });
            }

            onComplete(newTenant);
            onClose();
        } catch (error) {
            console.error("Failed to create school:", error);
            showToast("Failed to create school. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateField = <K extends keyof Tenant>(field: K, value: Tenant[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const updatePassword = (value: string) => {
        setFormData(prev => ({ ...prev, adminPassword: value }));
    };

    const updateBranding = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            branding: { ...prev.branding, [field]: value }
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New School Onboarding" size="lg">
            <div className="flex flex-col h-full">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {STEPS.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                idx <= currentStep ? 'bg-gyn-blue-dark text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                                {idx + 1}
                            </div>
                            <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${
                                idx <= currentStep ? 'text-gyn-blue-dark' : 'text-gray-300'
                            }`}>{step}</span>
                        </div>
                    ))}
                    {/* Progress Bar Line */}
                    <div className="absolute top-16 left-10 right-10 h-0.5 bg-gray-100 -z-0">
                        <div 
                            className="h-full bg-gyn-blue-dark transition-all duration-300" 
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                    {currentStep === 0 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="font-bold text-lg text-gray-800">School Details</h3>
                            <Input 
                                label="School Name" 
                                placeholder="e.g. Springfield High" 
                                value={formData.name || ''}
                                onChange={e => updateField('name', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Domain" 
                                    placeholder="springfield.edu" 
                                    value={formData.custom_domain || ''}
                                    onChange={e => updateField('custom_domain', e.target.value)}
                                />
                                <Input 
                                    label="Contact Email" 
                                    placeholder="admin@springfield.edu" 
                                    value={formData.admin_email || ''}
                                    onChange={e => updateField('admin_email', e.target.value)}
                                />
                            </div>
                            <Input 
                                label="Admin Password" 
                                type="password"
                                placeholder="********" 
                                value={formData.adminPassword || ''}
                                onChange={e => updatePassword(e.target.value)}
                            />
                            <Select 
                                label="Subscription Plan"
                                value={formData.plan}
                                onChange={e => updateField('plan', e.target.value as Tenant['plan'])}
                            >
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </Select>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="font-bold text-lg text-gray-800">White Labeling</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Primary Color" 
                                    type="color"
                                    value={formData.branding?.primaryColor || '#1d2a78'}
                                    onChange={e => updateBranding('primaryColor', e.target.value)}
                                    className="h-12 p-1"
                                />
                                <Input 
                                    label="Secondary Color" 
                                    type="color"
                                    value={formData.branding?.secondaryColor || '#ffffff'}
                                    onChange={e => updateBranding('secondaryColor', e.target.value)}
                                    className="h-12 p-1"
                                />
                            </div>
                            <Select 
                                label="Font Family"
                                value={formData.branding?.fontFamily}
                                onChange={e => updateBranding('fontFamily', e.target.value)}
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                            </Select>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-600 mb-2">Preview</h4>
                                <div className="flex gap-2">
                                    <button 
                                        className="px-4 py-2 rounded-lg text-white font-bold text-sm"
                                        style={{ backgroundColor: formData.branding?.primaryColor, fontFamily: formData.branding?.fontFamily }}
                                    >
                                        Primary Button
                                    </button>
                                    <button 
                                        className="px-4 py-2 rounded-lg border font-bold text-sm"
                                        style={{ 
                                            borderColor: formData.branding?.primaryColor, 
                                            color: formData.branding?.primaryColor,
                                            fontFamily: formData.branding?.fontFamily 
                                        }}
                                    >
                                        Secondary Button
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="font-bold text-lg text-gray-800">Configuration</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.settings?.allowRegistration}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            settings: { ...prev.settings!, allowRegistration: e.target.checked }
                                        }))}
                                        className="w-5 h-5 text-gyn-blue-dark rounded"
                                    />
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">Allow Public Registration</div>
                                        <div className="text-xs text-gray-500">Students can sign up without an invite</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.settings?.requireEmailVerification}
                                        onChange={e => setFormData(prev => ({
                                            ...prev,
                                            settings: { ...prev.settings!, requireEmailVerification: e.target.checked }
                                        }))}
                                        className="w-5 h-5 text-gyn-blue-dark rounded"
                                    />
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">Require Email Verification</div>
                                        <div className="text-xs text-gray-500">Users must verify email before login</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4">
                                <OwnerIcon name="CheckCircle" className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-2xl text-gray-900">Ready to Launch?</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                You are about to create <strong>{formData.name}</strong> with the <strong>{formData.plan}</strong> plan.
                                An admin invite will be sent to <strong>{formData.admin_email}</strong>.
                            </p>
                            
                            <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2 max-w-sm mx-auto border border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Domain:</span>
                                    <span className="font-bold">{formData.custom_domain}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Theme:</span>
                                    <div className="flex gap-1">
                                        <div className="w-4 h-4 rounded-full" style={{background: formData.branding?.primaryColor}}></div>
                                        <div className="w-4 h-4 rounded-full border border-gray-300" style={{background: formData.branding?.secondaryColor}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack} 
                        disabled={currentStep === 0}
                    >
                        Back
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleNext}
                        disabled={loading}
                    >
                        {currentStep === STEPS.length - 1 ? (loading ? 'Creating...' : 'Launch School') : 'Next Step'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
