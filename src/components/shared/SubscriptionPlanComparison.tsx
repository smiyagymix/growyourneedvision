import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/ui/CommonUI';
import { Check, X, Sparkles, Building, Rocket, Crown, TrendingUp } from 'lucide-react';
import prorationService from '../../services/prorationService';
import { useAuth } from '../../contexts/AuthContext';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        icon: Building,
        price: 29,
        priceId: 'price_basic_monthly',
        interval: 'month',
        description: 'Perfect for small schools and startups',
        features: [
            { name: 'Up to 100 students', included: true },
            { name: 'Core learning management', included: true },
            { name: 'Email support', included: true },
            { name: 'Basic analytics', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Advanced analytics', included: false },
            { name: 'AI features', included: false },
            { name: 'White labeling', included: false },
            { name: 'API access', included: false },
            { name: 'Priority support', included: false }
        ],
        popular: false,
        color: 'blue'
    },
    {
        id: 'pro',
        name: 'Professional',
        icon: Rocket,
        price: 79,
        priceId: 'price_pro_monthly',
        interval: 'month',
        description: 'For growing schools with advanced needs',
        features: [
            { name: 'Up to 500 students', included: true },
            { name: 'Core learning management', included: true },
            { name: 'Email support', included: true },
            { name: 'Basic analytics', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Advanced analytics', included: true },
            { name: 'AI features', included: true },
            { name: 'White labeling', included: false },
            { name: 'API access', included: true },
            { name: 'Priority support', included: true }
        ],
        popular: true,
        color: 'purple'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        icon: Crown,
        price: 199,
        priceId: 'price_enterprise_monthly',
        interval: 'month',
        description: 'Unlimited scale with premium features',
        features: [
            { name: 'Unlimited students', included: true },
            { name: 'Core learning management', included: true },
            { name: 'Email support', included: true },
            { name: 'Basic analytics', included: true },
            { name: 'Mobile app access', included: true },
            { name: 'Advanced analytics', included: true },
            { name: 'AI features', included: true },
            { name: 'White labeling', included: true },
            { name: 'API access', included: true },
            { name: 'Priority support', included: true },
            { name: 'Dedicated account manager', included: true },
            { name: 'Custom integrations', included: true }
        ],
        popular: false,
        color: 'yellow'
    }
];

interface SubscriptionPlanComparisonProps {
    currentPlan?: string;
    subscriptionId?: string;
    onPlanChange?: (plan: any) => void;
}

export default function SubscriptionPlanComparison({
    currentPlan,
    subscriptionId,
    onPlanChange
}: SubscriptionPlanComparisonProps) {
    const { user } = useAuth();
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [prorationPreview, setProrationPreview] = useState(null);
    const [showProrationModal, setShowProrationModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePlanSelect = async (plan: any) => {
        if (!subscriptionId || plan.id === currentPlan) {
            // New subscription or same plan
            setSelectedPlan(plan);
            if (onPlanChange) {
                onPlanChange(plan);
            }
            return;
        }

        // Show proration preview for plan change
        setLoading(true);
        try {
            const preview = await prorationService.calculateProration(
                subscriptionId,
                plan.priceId
            );
            setProrationPreview(preview);
            setSelectedPlan(plan);
            setShowProrationModal(true);
        } catch (error) {
            console.error('Error calculating proration:', error);
            alert('Failed to calculate proration');
        } finally {
            setLoading(false);
        }
    };

    const confirmPlanChange = async (immediate = true) => {
        if (!prorationPreview || !selectedPlan) return;

        setLoading(true);
        try {
            let result;
            if (immediate) {
                result = await prorationService.applyPlanChange(
                    subscriptionId,
                    selectedPlan.priceId
                );
            } else {
                result = await prorationService.schedulePlanChangeAtPeriodEnd(
                    subscriptionId,
                    selectedPlan.priceId
                );
            }

            setShowProrationModal(false);
            if (onPlanChange) {
                onPlanChange(selectedPlan);
            }
            alert(result.message);
        } catch (error) {
            console.error('Error changing plan:', error);
            alert('Failed to change plan');
        } finally {
            setLoading(false);
        }
    };

    const getAnnualPrice = (monthlyPrice: number) => {
        return Math.floor(monthlyPrice * 12 * 0.8); // 20% discount
    };

    const getColorClasses = (color: string, popular: boolean) => {
        if (popular) {
            return {
                border: 'border-purple-500 border-2',
                badge: 'bg-gradient-to-r from-purple-500 to-pink-500',
                button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
                icon: 'text-purple-600'
            };
        }
        return {
            border: 'border-gray-200 dark:border-gray-700',
            badge: 'bg-gray-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            icon: 'text-blue-600'
        };
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Choose Your Plan
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                    Scale your institution with the right features
                </p>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1">
                    <button
                        onClick={() => setBillingInterval('month')}
                        className={`px-6 py-2 rounded-md transition-colors ${
                            billingInterval === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingInterval('year')}
                        className={`px-6 py-2 rounded-md transition-colors ${
                            billingInterval === 'year'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        Annual
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                            Save 20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const colors = getColorClasses(plan.color, plan.popular);
                    const displayPrice = billingInterval === 'year' 
                        ? getAnnualPrice(plan.price) 
                        : plan.price;
                    const isCurrentPlan = currentPlan === plan.id;

                    return (
                        <Card
                            key={plan.id}
                            className={`relative ${colors.border} ${
                                plan.popular ? 'transform scale-105 shadow-2xl' : ''
                            }`}
                        >
                            {plan.popular && (
                                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${colors.badge} text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
                                    <Sparkles className="w-4 h-4" />
                                    Most Popular
                                </div>
                            )}

                            <CardHeader className="text-center pt-8">
                                <div className="flex justify-center mb-4">
                                    <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-800`}>
                                        <Icon className={`w-8 h-8 ${colors.icon}`} />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    {plan.description}
                                </p>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Price */}
                                <div className="text-center">
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold">
                                            ${displayPrice}
                                        </span>
                                        <span className="text-gray-500 ml-2">
                                            /{billingInterval}
                                        </span>
                                    </div>
                                    {billingInterval === 'year' && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            ${plan.price}/month billed annually
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span className={feature.included ? '' : 'text-gray-400 dark:text-gray-600'}>
                                                {feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={isCurrentPlan || loading}
                                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                        isCurrentPlan
                                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                            : `${colors.button} text-white`
                                    }`}
                                >
                                    {isCurrentPlan ? 'Current Plan' : loading ? 'Loading...' : 'Select Plan'}
                                </button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Feature Comparison Table */}
            <Card className="max-w-7xl mx-auto mt-12">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" />
                        Detailed Feature Comparison
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 dark:border-gray-700">
                                    <th className="text-left p-4 font-semibold">Feature</th>
                                    {PLANS.map(plan => (
                                        <th key={plan.id} className="text-center p-4 font-semibold">
                                            {plan.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {PLANS[2].features.map((_, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="p-4 font-medium">
                                            {PLANS[0].features[idx]?.name}
                                        </td>
                                        {PLANS.map(plan => (
                                            <td key={plan.id} className="text-center p-4">
                                                {plan.features[idx]?.included ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Proration Modal */}
            {showProrationModal && prorationPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full">
                        <CardHeader>
                            <CardTitle>Confirm Plan Change</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    You're {prorationPreview.proration.isUpgrade ? 'upgrading' : 'downgrading'} from{' '}
                                    <strong>{prorationPreview.currentPlan.priceId}</strong> to{' '}
                                    <strong>{prorationPreview.newPlan.priceId}</strong>
                                </p>
                            </div>

                            {/* Proration Details */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span>Days remaining in period:</span>
                                    <strong>{prorationPreview.timing.daysRemaining} days</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unused amount:</span>
                                    <strong>${(prorationPreview.proration.unusedAmount / 100).toFixed(2)}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span>New plan amount (prorated):</span>
                                    <strong>${(prorationPreview.proration.newPlanAmount / 100).toFixed(2)}</strong>
                                </div>
                                <div className="border-t dark:border-gray-700 pt-2 mt-2 flex justify-between text-lg font-bold">
                                    <span>
                                        {prorationPreview.proration.isUpgrade ? 'Charge today:' : 'Credit applied:'}
                                    </span>
                                    <span className={prorationPreview.proration.isUpgrade ? 'text-red-600' : 'text-green-600'}>
                                        {prorationPreview.proration.isUpgrade ? '+' : '-'}
                                        ${Math.abs(prorationPreview.proration.difference / 100).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => confirmPlanChange(true)}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Change Now'}
                                </button>
                                <button
                                    onClick={() => confirmPlanChange(false)}
                                    disabled={loading}
                                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    Change at Period End
                                </button>
                                <button
                                    onClick={() => setShowProrationModal(false)}
                                    className="px-6 bg-gray-300 dark:bg-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
