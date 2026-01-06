import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { PaymentMethod } from '../../types/payment';
import { OwnerIcon } from '../shared/OwnerIcons';
import { useAuth } from '../../context/AuthContext';

export const PaymentMethodManager: React.FC = () => {
    const { user } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMethods = async () => {
            if (user) {
                const data = await paymentService.getPaymentMethods(user.id);
                setMethods(data);
                setLoading(false);
            }
        };
        loadMethods();
    }, [user]);

    if (loading) {
        return <div className="animate-pulse h-20 bg-gray-100 rounded-xl"></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
                <button className="text-sm font-bold text-[#1d2a78] hover:underline flex items-center gap-1">
                    <OwnerIcon name="Plus" className="w-4 h-4" /> Add New
                </button>
            </div>

            {methods.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                    <p className="text-gray-500 text-sm">No payment methods saved.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {methods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                                    {method.card_brand}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">•••• {method.card_last4}</p>
                                    <p className="text-xs text-gray-500">Expires {method.card_exp_month}/{method.card_exp_year}</p>
                                </div>
                            </div>
                            {method.is_default && (
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full uppercase tracking-wide">
                                    Default
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
