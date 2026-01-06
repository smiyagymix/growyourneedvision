/**
 * Upgrade Modal
 * Modal for upgrading to premium plans
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/CommonUI';
import { usePremiumFeatures, PREMIUM_FEATURES, PlanTier } from '../../../hooks/usePremiumFeatures';
import { cn } from '../../../lib/utils';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureKey?: string;
    suggestedPlan?: PlanTier;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
    isOpen,
    onClose,
    featureKey,
    suggestedPlan
}) => {
    const { userPlan, hasFeatureAccess } = usePremiumFeatures();
    const [selectedPlan, setSelectedPlan] = useState<PlanTier>(suggestedPlan || 'premium');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const feature = featureKey ? PREMIUM_FEATURES[featureKey] : null;

    type PlanDetails = {
        name: string;
        monthlyPrice: number;
        yearlyPrice: number;
        features: string[];
        color: string;
        popular?: boolean;
    };

    const plans: Partial<Record<PlanTier, PlanDetails>> = {
        basic: {
            name: 'Basic',
            monthlyPrice: 29,
            yearlyPrice: 290,
            features: [
                'Up to 100 students',
                'Basic analytics',
                'Email support',
                'Standard reports',
                'Bulk operations',
                'Broadcast messaging',
                'Study planner'
            ],
            color: 'from-blue-500 to-cyan-500'
        },
        premium: {
            name: 'Premium',
            monthlyPrice: 79,
            yearlyPrice: 790,
            popular: true,
            features: [
                'Everything in Basic',
                'Up to 500 students',
                'Advanced analytics',
                'Priority support 24/7',
                'AI-powered features',
                'Custom reports',
                'HD video export',
                'SMS notifications',
                'Real-time collaboration',
                'Custom rubrics',
                'Multi-child dashboard'
            ],
            color: 'from-purple-500 to-pink-500'
        },
        enterprise: {
            name: 'Enterprise',
            monthlyPrice: 199,
            yearlyPrice: 1990,
            features: [
                'Everything in Premium',
                'Unlimited students',
                'White-label branding',
                'API access',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
                'Advanced security',
                'Custom training',
                'Video conferencing'
            ],
            color: 'from-gray-700 to-gray-900'
        }
    };

    const currentPlanTiers: PlanTier[] = ['free', 'basic', 'premium', 'enterprise'];
    const currentPlanIndex = currentPlanTiers.indexOf(userPlan);

    const getPrice = (tier: PlanTier) => {
        const plan = plans[tier];
        if (!plan) return 0;
        return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    };

    const getSavings = (tier: PlanTier) => {
        const plan = plans[tier];
        if (!plan) return 0;
        const monthlyTotal = plan.monthlyPrice * 12;
        const savings = monthlyTotal - plan.yearlyPrice;
        return Math.round((savings / monthlyTotal) * 100);
    };

    const handleUpgrade = async (tier: PlanTier) => {
        // Validate tier
        if (!tier || !['free', 'basic', 'premium', 'enterprise'].includes(tier)) {
            console.error('Invalid plan tier selected');
            return;
        }
        
        // Validate billing cycle
        if (!['monthly', 'yearly'].includes(billingCycle)) {
            console.error('Invalid billing cycle');
            return;
        }
        
        // Implement upgrade logic here
        console.log(`Upgrading to ${tier} - ${billingCycle}`);
        // In production, integrate with Stripe or payment provider
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="xl"
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                    {feature && (
                        <div className="mb-4">
                            <Badge variant="primary" className="text-sm">
                                {feature.name}
                            </Badge>
                        </div>
                    )}
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                        Unlock Premium Features
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {feature 
                            ? `Upgrade to ${feature.requiredPlan} to access ${feature.name}`
                            : 'Choose the perfect plan for your needs'}
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4">
                    <span className={cn(
                        "text-sm font-medium",
                        billingCycle === 'monthly' ? "text-gray-900 dark:text-white" : "text-gray-500"
                    )}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className={cn(
                            "relative w-14 h-8 rounded-full transition-colors",
                            billingCycle === 'yearly' ? "bg-purple-600" : "bg-gray-300"
                        )}
                    >
                        <span className={cn(
                            "absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform",
                            billingCycle === 'yearly' && "translate-x-6"
                        )} />
                    </button>
                    <span className={cn(
                        "text-sm font-medium",
                        billingCycle === 'yearly' ? "text-gray-900 dark:text-white" : "text-gray-500"
                    )}>
                        Yearly
                        {billingCycle === 'yearly' && (
                            <Badge variant="success" className="ml-2 text-xs">
                                Save up to 20%
                            </Badge>
                        )}
                    </span>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.entries(plans) as [PlanTier, typeof plans.basic][]).map(([tier, plan]) => {
                        if (!plan) return null;
                        
                        const isCurrentPlan = userPlan === tier;
                        const canUpgrade = currentPlanTiers.indexOf(tier) > currentPlanIndex;
                        const isSelected = selectedPlan === tier;

                        return (
                            <motion.div
                                key={tier}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative"
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                        <Badge variant="primary" className="text-xs font-bold shadow-lg">
                                            MOST POPULAR
                                        </Badge>
                                    </div>
                                )}

                                <div
                                    onClick={() => canUpgrade && setSelectedPlan(tier)}
                                    className={cn(
                                        "h-full p-6 rounded-xl border-2 transition-all cursor-pointer",
                                        isSelected && canUpgrade && "border-purple-500 shadow-xl",
                                        !isSelected && "border-gray-200 dark:border-gray-700",
                                        isCurrentPlan && "bg-green-50 dark:bg-green-900/20 border-green-500",
                                        !canUpgrade && "opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <div className="space-y-4">
                                        {/* Plan Header */}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                {plan.name}
                                            </h3>
                                            {isCurrentPlan && (
                                                <Badge variant="success" className="text-xs">
                                                    Current Plan
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-baseline gap-2">
                                                <span className={cn(
                                                    "text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                                                    plan.color
                                                )}>
                                                    ${getPrice(tier)}
                                                </span>
                                                <span className="text-gray-500">
                                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                                </span>
                                            </div>
                                            {billingCycle === 'yearly' && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                    Save {getSavings(tier)}% with yearly billing
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-3">
                                            {plan.features.slice(0, 6).map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <Icon 
                                                        name="CheckCircleIcon" 
                                                        className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" 
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {feat}
                                                    </span>
                                                </li>
                                            ))}
                                            {plan.features.length > 6 && (
                                                <li className="text-sm text-purple-600 dark:text-purple-400 font-medium pl-6">
                                                    +{plan.features.length - 6} more features
                                                </li>
                                            )}
                                        </ul>

                                        {/* Action Button */}
                                        <Button
                                            variant={isSelected && canUpgrade ? 'primary' : isCurrentPlan ? 'secondary' : 'outline'}
                                            className="w-full mt-4"
                                            disabled={isCurrentPlan || !canUpgrade}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                if (canUpgrade) handleUpgrade(tier);
                                            }}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : canUpgrade ? 'Upgrade Now' : 'Contact Sales'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center space-y-4">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Icon name="ShieldCheckIcon" className="w-4 h-4 text-green-500" />
                            <span>30-day money-back guarantee</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon name="CreditCardIcon" className="w-4 h-4 text-blue-500" />
                            <span>Secure payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon name="XMarkIcon" className="w-4 h-4 text-gray-500" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                        Need help choosing? <button className="text-purple-600 hover:underline">Contact our sales team</button>
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default UpgradeModal;
