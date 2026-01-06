import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import env from '../config/environment';

interface StripeContextType {
    stripe: Stripe | null;
    loading: boolean;
    error: string | null;
}

const StripeContext = createContext<StripeContextType>({
    stripe: null,
    loading: true,
    error: null,
});

export const useStripeContext = () => useContext(StripeContext);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initStripe = async () => {
            if (!env.isFeatureEnabled('payments')) {
                setLoading(false);
                return;
            }

            const key = env.get('stripePublishableKey');
            if (!key) {
                console.warn('Stripe publishable key not found');
                setLoading(false);
                return;
            }

            try {
                const stripeInstance = await loadStripe(key);
                setStripe(stripeInstance);
            } catch (err: any) {
                console.error('Failed to load Stripe:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initStripe();
    }, []);

    if (!env.isFeatureEnabled('payments')) {
        return <>{children}</>;
    }

    return (
        <StripeContext.Provider value={{ stripe, loading, error }}>
            {stripe ? (
                <Elements stripe={stripe}>
                    {children}
                </Elements>
            ) : (
                children
            )}
        </StripeContext.Provider>
    );
};
