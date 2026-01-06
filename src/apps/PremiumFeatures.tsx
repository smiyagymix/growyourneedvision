/**
 * Premium Features Showcase
 * Central page displaying all premium features and upgrade options
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePremiumFeatures, PREMIUM_FEATURES, PlanTier } from '../hooks/usePremiumFeatures';
import { Card } from '../components/shared/ui/Card';
import { Button } from '../components/shared/ui/Button';
import { Badge } from '../components/shared/ui/Badge';
import { Icon } from '../components/shared/ui/CommonUI';
import { cn } from '../lib/utils';

interface PremiumFeaturesPageProps {
    activeTab?: string;
}

const PremiumFeaturesPage: React.FC<PremiumFeaturesPageProps> = ({ activeTab = 'All' }) => {
    const { userPlan, hasFeatureAccess, isPremium, isEnterprise } = usePremiumFeatures();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);

    const categories = [
        { id: 'all', name: 'All Features', icon: 'SparklesIcon' },
        { id: 'teacher', name: 'Teacher', icon: 'AcademicCapIcon' },
        { id: 'student', name: 'Student', icon: 'BookOpenIcon' },
        { id: 'admin', name: 'Admin', icon: 'CogIcon' },
        { id: 'communication', name: 'Communication', icon: 'ChatBubbleBottomCenterTextIcon' },
        { id: 'creator', name: 'Creator', icon: 'VideoCameraIcon' },
        { id: 'parent', name: 'Parent', icon: 'UserGroupIcon' },
        { id: 'marketplace', name: 'Marketplace', icon: 'ShoppingCartIcon' }
    ];

    const plans = [
        {
            tier: 'basic' as PlanTier,
            name: 'Basic',
            price: 29,
            period: 'month',
            description: 'Essential features for small teams',
            color: 'from-blue-500 to-cyan-500',
            features: [
                'Up to 100 students',
                'Basic analytics',
                'Email support',
                'Standard reports',
                'Bulk operations'
            ]
        },
        {
            tier: 'premium' as PlanTier,
            name: 'Premium',
            price: 79,
            period: 'month',
            description: 'Advanced features for growing schools',
            color: 'from-purple-500 to-pink-500',
            popular: true,
            features: [
                'Up to 500 students',
                'Advanced analytics',
                'Priority support',
                'AI-powered features',
                'Custom reports',
                'HD video export',
                'SMS notifications',
                'Real-time collaboration'
            ]
        },
        {
            tier: 'enterprise' as PlanTier,
            name: 'Enterprise',
            price: 199,
            period: 'month',
            description: 'Complete solution for large institutions',
            color: 'from-gray-700 to-gray-900',
            features: [
                'Unlimited students',
                'White-label branding',
                'API access',
                'Dedicated support',
                'Custom integrations',
                'SLA guarantee',
                'Advanced security',
                'Custom training'
            ]
        }
    ];

    const filteredFeatures = Object.entries(PREMIUM_FEATURES).filter(([_, feature]) => 
        selectedCategory === 'all' || feature.category === selectedCategory
    );

    const getPlanColor = (tier: PlanTier) => {
        switch (tier) {
            case 'basic': return 'from-blue-500 to-cyan-500';
            case 'premium': return 'from-purple-500 to-pink-500';
            case 'enterprise': return 'from-gray-700 to-gray-900';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Icon name="SparklesIcon" className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
                        Premium Features
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        Unlock powerful tools to enhance your experience
                    </p>
                    <Badge variant={isPremium ? 'success' : 'neutral'} className="text-sm">
                        Current Plan: {userPlan.toUpperCase()}
                    </Badge>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => {
                        const isCurrentPlan = userPlan === plan.tier;
                        const hasAccess = userPlan === plan.tier || 
                            (userPlan === 'premium' && plan.tier === 'basic') ||
                            (userPlan === 'enterprise' && (plan.tier === 'basic' || plan.tier === 'premium'));

                        return (
                            <motion.div
                                key={plan.tier}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={cn(
                                    "relative overflow-hidden",
                                    plan.popular && "ring-2 ring-purple-500 shadow-xl"
                                )}>
                                    {plan.popular && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}
                                    
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                {plan.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {plan.description}
                                            </p>
                                        </div>

                                        <div className="flex items-baseline gap-2">
                                            <span className={cn(
                                                "text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                                                plan.color
                                            )}>
                                                ${plan.price}
                                            </span>
                                            <span className="text-gray-500">/{plan.period}</span>
                                        </div>

                                        <ul className="space-y-3">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <Icon 
                                                        name="CheckCircleIcon" 
                                                        className={cn(
                                                            "w-5 h-5 flex-shrink-0 mt-0.5",
                                                            hasAccess ? "text-green-500" : "text-gray-400"
                                                        )} 
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            variant={isCurrentPlan ? 'secondary' : plan.popular ? 'primary' : 'primary'}
                                            className="w-full"
                                            disabled={isCurrentPlan || hasAccess}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : hasAccess ? 'Included' : 'Upgrade Now'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat.id)}
                            className="whitespace-nowrap"
                        >
                            <Icon name={cat.icon as any} className="w-4 h-4 mr-2" />
                            {cat.name}
                        </Button>
                    ))}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFeatures.map(([key, feature], index) => {
                        const hasAccess = hasFeatureAccess(key);
                        
                        return (
                            <motion.div
                                key={key}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={cn(
                                    "p-6 h-full transition-all hover:shadow-lg",
                                    hasAccess && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                )}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                                            getPlanColor(feature.requiredPlan)
                                        )}>
                                            {hasAccess ? (
                                                <Icon name="CheckCircleIcon" className="w-6 h-6 text-white" />
                                            ) : (
                                                <Icon name="LockClosedIcon" className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <Badge 
                                            variant={hasAccess ? 'success' : 'primary'}
                                            className="text-xs"
                                        >
                                            {feature.requiredPlan.toUpperCase()}
                                        </Badge>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        {feature.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {feature.description}
                                    </p>

                                    {!hasAccess && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setSelectedPlan(feature.requiredPlan)}
                                        >
                                            <Icon name="ArrowUpIcon" className="w-4 h-4 mr-2" />
                                            Upgrade to Unlock
                                        </Button>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-12 text-center">
                    <h2 className="text-3xl font-black mb-4">
                        Ready to unlock all features?
                    </h2>
                    <p className="text-lg mb-6 text-purple-100">
                        Upgrade your plan and get access to powerful premium tools
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="secondary" size="lg">
                            Compare Plans
                        </Button>
                        <Button variant="glow" size="lg">
                            Contact Sales
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PremiumFeaturesPage;
