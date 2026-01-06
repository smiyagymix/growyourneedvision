import React from 'react';
import { SubscriptionPlan } from '../../types/payment';
import { OwnerIcon } from '../shared/OwnerIcons';

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    isCurrent?: boolean;
    onSelect: (plan: SubscriptionPlan) => void;
    loading?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    plan,
    isCurrent = false,
    onSelect,
    loading = false,
}) => {
    return (
        <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${isCurrent
                ? 'bg-[#1d2a78] border-[#1d2a78] text-white shadow-xl scale-105 z-10'
                : 'bg-white border-gray-200 hover:border-[#1d2a78]/30 hover:shadow-lg text-gray-900'
            }`}>
            {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-md">
                    Most Popular
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className={`text-lg font-bold mb-2 ${isCurrent ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-3xl font-black ${isCurrent ? 'text-white' : 'text-gray-900'}`}>
                        ${plan.price}
                    </span>
                    <span className={`text-sm ${isCurrent ? 'text-blue-200' : 'text-gray-500'}`}>
                        /{plan.interval}
                    </span>
                </div>
                <p className={`text-sm mt-2 ${isCurrent ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                </p>
            </div>

            <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                        <OwnerIcon
                            name="CheckCircle"
                            className={`w-5 h-5 flex-shrink-0 ${isCurrent ? 'text-green-400' : 'text-green-600'}`}
                        />
                        <span className={isCurrent ? 'text-blue-50' : 'text-gray-600'}>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(plan)}
                disabled={isCurrent || loading}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isCurrent
                        ? 'bg-white/10 text-white cursor-default'
                        : 'bg-[#1d2a78] text-white hover:bg-[#0f1c4d] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                    }`}
            >
                {isCurrent ? (
                    <span className="flex items-center justify-center gap-2">
                        <OwnerIcon name="Check" className="w-4 h-4" /> Current Plan
                    </span>
                ) : (
                    loading ? 'Processing...' : 'Choose Plan'
                )}
            </button>
        </div>
    );
};
