import Stripe from 'stripe';

// Centralized Stripe client initializer
const paymentsEnabled = (process.env.FEATURE_PAYMENTS || '').toString().toLowerCase() === 'true';
let stripeInstance = null;

if (paymentsEnabled && process.env.STRIPE_SECRET_KEY) {
  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    console.log('Stripe client initialized');
  } catch (err) {
    console.error('Failed to initialize Stripe client:', err.message || err);
    stripeInstance = null;
  }
}

function createMissingProxy() {
  return new Proxy({}, {
    get() {
      throw new Error('Stripe is not configured. Set FEATURE_PAYMENTS=true and STRIPE_SECRET_KEY in your environment (.env) or disable payments.');
    }
  });
}

export function getStripe() {
  return stripeInstance || createMissingProxy();
}

export const isStripeConfigured = () => !!stripeInstance;

export default {
  getStripe,
  isStripeConfigured
};
