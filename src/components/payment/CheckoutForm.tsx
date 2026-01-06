import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../services/paymentService';
import { OwnerIcon } from '../shared/OwnerIcons';

interface CheckoutFormProps {
    amount?: number;
    currency?: string;
    onSuccess?: (paymentIntent: any) => void;
    onError?: (error: string) => void;
    mode?: 'payment' | 'subscription';
    clientSecret?: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
    amount,
    currency = 'usd',
    onSuccess,
    onError,
    mode = 'payment',
    clientSecret,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // Return URL where the customer should be redirected after the PaymentIntent is confirmed.
                    return_url: `${window.location.origin}/payment/success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'An unexpected error occurred.');
                onError?.(error.message || 'An unexpected error occurred.');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess?.(paymentIntent);
            }
        } catch (err: any) {
            setErrorMessage(err.message);
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-900">
                    {mode === 'subscription' ? 'Confirm Subscription' : 'Complete Payment'}
                </h3>
                {amount && (
                    <p className="text-gray-500 mt-1">
                        Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)}
                    </p>
                )}
            </div>

            <div className="mb-6">
                <PaymentElement />
            </div>

            {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <OwnerIcon name="ExclamationCircle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full py-3 bg-[#1d2a78] text-white rounded-xl font-bold hover:bg-[#0f1c4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <OwnerIcon name="LockClosed" className="w-4 h-4" />
                        Pay Now
                    </>
                )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <OwnerIcon name="ShieldCheck" className="w-3 h-3" />
                <span>Secure payment powered by Stripe</span>
            </div>
        </form>
    );
};
