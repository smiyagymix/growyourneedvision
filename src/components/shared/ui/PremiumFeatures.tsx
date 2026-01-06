/**
 * Premium Feature Components
 * Production-ready UI components for premium feature gates with accessibility and analytics
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Icon } from './CommonUI';
import { Button } from './Button';
import { Badge } from './Badge';
import { usePremiumFeatures, PREMIUM_FEATURES, PlanTier } from '../../../hooks/usePremiumFeatures';
import { analytics } from '../../../utils/analytics';
import { cn } from '../../../lib/utils';

interface PremiumBannerProps {
    featureKey?: string;
    feature?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    ctaText?: string;
    requiredPlan?: string;
    className?: string;
    compact?: boolean;
    onUpgradeClick?: () => void;
    showLearnMore?: boolean;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({ 
    featureKey,
    feature: featureProp,
    title,
    description,
    buttonText,
    ctaText,
    requiredPlan,
    className = '', 
    compact = false,
    onUpgradeClick,
    showLearnMore = true
}) => {
    const { hasFeatureAccess, getUpgradeMessage, upgradeToPlan, userPlan } = usePremiumFeatures();
    const effectiveFeatureKey = featureKey || featureProp || '';
    const feature = effectiveFeatureKey ? PREMIUM_FEATURES[effectiveFeatureKey] : null;
    const [isAnimating, setIsAnimating] = useState(false);

    const displayTitle = title || feature?.name || 'Premium Feature';
    const displayDescription = description || feature?.description || 'Upgrade to access this feature';
    const displayPlan = requiredPlan || feature?.requiredPlan || 'Premium';
    const displayButtonText = buttonText || ctaText || `Upgrade to ${displayPlan}`;

    useEffect(() => {
        if (effectiveFeatureKey && (!feature || !hasFeatureAccess(effectiveFeatureKey))) {
            analytics.track('premium_banner_viewed', 'engagement', {
                feature_key: effectiveFeatureKey,
                feature_name: displayTitle,
                required_plan: displayPlan,
                current_plan: userPlan
            });
        }
    }, [effectiveFeatureKey, feature, hasFeatureAccess, userPlan, displayTitle, displayPlan]);

    const handleUpgradeClick = useCallback(() => {
        analytics.track('premium_upgrade_clicked', 'conversion', {
            feature_key: effectiveFeatureKey,
            feature_name: displayTitle,
            required_plan: displayPlan,
            current_plan: userPlan,
            source: 'banner'
        });
        
        if (onUpgradeClick) {
            onUpgradeClick();
        } else if (feature) {
            upgradeToPlan(feature.requiredPlan);
        }
        
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
    }, [effectiveFeatureKey, feature, userPlan, onUpgradeClick, upgradeToPlan, displayTitle, displayPlan]);

    if (!feature || hasFeatureAccess(effectiveFeatureKey)) {
        return null;
    }

    if (compact) {
        return (
            <div 
                className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5',
                    'bg-gradient-to-r from-purple-500/10 to-blue-500/10',
                    'border border-purple-500/20 rounded-lg',
                    'transition-all duration-300 hover:border-purple-500/40',
                    className
                )}
                role="status"
                aria-label={`${feature.name} requires ${feature.requiredPlan} plan`}
            >
                <Icon name="LockClosedIcon" className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <span className="text-xs font-medium text-purple-300">{feature.requiredPlan.toUpperCase()} Feature</span>
            </div>
        );
    }

    return (
        <div 
            className={cn(
                'p-6 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5',
                'border-2 border-purple-500/20 rounded-xl',
                'transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg',
                isAnimating && 'scale-[0.98]',
                className
            )}
            role="alert"
            aria-live="polite"
            aria-label={`Premium feature: ${feature.name}`}
        >
            <div className="flex items-start gap-4">
                <div 
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                >
                    <Icon name="SparklesIcon" className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {displayTitle}
                        </h3>
                        <Badge variant="primary" className="text-xs font-bold">
                            {displayPlan.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {displayDescription}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleUpgradeClick}
                            aria-label={`Upgrade to ${displayPlan} plan to access ${displayTitle}`}
                        >
                            <Icon name="ArrowUpIcon" className="w-4 h-4 mr-2" aria-hidden="true" />
                            {displayButtonText}
                        </Button>
                        {showLearnMore && (
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    analytics.track('premium_learn_more_clicked', 'engagement', {
                                        feature_key: effectiveFeatureKey,
                                        source: 'banner'
                                    });
                                }}
                            >
                                Learn More
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface PremiumBadgeProps {
    featureKey?: string;
    tier?: string;
    variant?: string;
    size?: string;
    className?: string;
    children?: React.ReactNode;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
    featureKey, 
    tier, 
    variant, 
    size, 
    className = '',
    children 
}) => {
    const { hasFeatureAccess } = usePremiumFeatures();
    const feature = featureKey ? PREMIUM_FEATURES[featureKey] : null;

    // If featureKey provided and user has access, don't show badge
    if (featureKey && feature && hasFeatureAccess(featureKey)) {
        return null;
    }

    const displayText = children || tier || feature?.requiredPlan || 'Premium';
    const badgeSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

    return (
        <Badge variant={variant as any || "premium"} className={`${badgeSize} font-bold ${className}`}>
            {!children && <Icon name="LockClosedIcon" className="w-3 h-3 mr-1" />}
            {typeof displayText === 'string' ? displayText.toUpperCase() : displayText}
        </Badge>
    );
};

interface PremiumGateProps {
    featureKey: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showBanner?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
    featureKey, 
    children, 
    fallback,
    showBanner = true 
}) => {
    const { hasFeatureAccess } = usePremiumFeatures();

    if (hasFeatureAccess(featureKey)) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showBanner) {
        return <PremiumBanner featureKey={featureKey} />;
    }

    return null;
};

interface PremiumButtonProps {
    featureKey?: string;
    feature?: string;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    title?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({ 
    featureKey,
    feature,
    onClick,
    children,
    className = '',
    disabled = false,
    title,
    variant = 'primary',
    size = 'md'
}) => {
    const { hasFeatureAccess, getUpgradeMessage } = usePremiumFeatures();
    const effectiveFeatureKey = featureKey || feature || '';
    const hasAccess = effectiveFeatureKey ? hasFeatureAccess(effectiveFeatureKey) : true;

    const handleClick = () => {
        if (!hasAccess && effectiveFeatureKey) {
            // Show upgrade modal or toast
            alert(getUpgradeMessage(effectiveFeatureKey));
            return;
        }
        onClick?.();
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={disabled}
            title={title}
            className={`relative ${className}`}
        >
            {!hasAccess && (
                <Icon name="LockClosedIcon" className="w-4 h-4 mr-2" />
            )}
            {children}
        </Button>
    );
};

interface PremiumFeatureListProps {
    category: string;
    className?: string;
}

export const PremiumFeatureList: React.FC<PremiumFeatureListProps> = ({ category, className = '' }) => {
    const { getFeaturesByCategory, userPlan } = usePremiumFeatures();
    const features = getFeaturesByCategory(category);

    if (features.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Available Features
            </h4>
            <div className="space-y-2">
                {features.map(({ key, name, description, requiredPlan, hasAccess }) => (
                    <div 
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                            hasAccess 
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                        }`}
                    >
                        <div className="mt-0.5">
                            {hasAccess ? (
                                <Icon name="CheckCircleIcon" className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <Icon name="LockClosedIcon" className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className={`text-sm font-medium ${
                                    hasAccess ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                    {name}
                                </h5>
                                {!hasAccess && (
                                    <Badge variant="primary" className="text-xs">
                                        {requiredPlan}
                                    </Badge>
                                )}
                            </div>
                            <p className={`text-xs ${
                                hasAccess ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                            }`}>
                                {description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            {features.some(f => !f.hasAccess) && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Icon name="InformationCircleIcon" className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">
                                Unlock premium features with an upgraded plan
                            </p>
                            <Button variant="primary" size="sm">
                                View Plans
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface PremiumTooltipProps {
    featureKey: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    disabled?: boolean;
}

export const PremiumTooltip: React.FC<PremiumTooltipProps> = ({ 
    featureKey, 
    children,
    position = 'top',
    disabled = false
}) => {
    const { hasFeatureAccess, getUpgradeMessage } = usePremiumFeatures();
    const feature = PREMIUM_FEATURES[featureKey];
    const [isVisible, setIsVisible] = useState(false);

    if (!feature || disabled) {
        return <>{children}</>;
    }

    const hasAccess = hasFeatureAccess(featureKey);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900',
        left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900',
        right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-900'
    };

    return (
        <div 
            className="relative group inline-block"
            onMouseEnter={() => !hasAccess && setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => !hasAccess && setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            <div className={cn(
                'transition-opacity duration-200',
                !hasAccess && 'opacity-60 cursor-not-allowed hover:opacity-75'
            )}>
                {children}
            </div>
            {!hasAccess && isVisible && (
                <div 
                    className={cn(
                        'absolute z-50 animate-in fade-in zoom-in-95 duration-200',
                        positionClasses[position]
                    )}
                    role="tooltip"
                    aria-label={getUpgradeMessage(featureKey)}
                >
                    <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl border border-gray-700">
                        <div className="flex items-center gap-2">
                            <Icon name="LockClosedIcon" className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            <span>{getUpgradeMessage(featureKey)}</span>
                        </div>
                        <div className={cn('absolute', arrowClasses[position])}></div>
                    </div>
                </div>
            )}
        </div>
    );
};
