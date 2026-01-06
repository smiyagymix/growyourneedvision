/**
 * Proration Service (Frontend)
 * Client-side service for plan changes and proration calculations
 */

import env from '../config/environment';
import { isMockEnv } from '../utils/mockData';

const API_URL = env.get('serverUrl') || 'http://localhost:3001';
const API_KEY = env.get('apiKey') || 'your-api-key-here';

// Mock proration data for testing
const MOCK_PRORATION = {
    success: true,
    subscriptionId: 'sub_mock123',
    currentPlan: {
        priceId: 'price_basic_monthly',
        amount: 2900,
        currency: 'usd',
        interval: 'month'
    },
    newPlan: {
        priceId: 'price_pro_monthly',
        amount: 7900,
        currency: 'usd',
        interval: 'month'
    },
    timing: {
        currentPeriodStart: '2024-12-01T00:00:00Z',
        currentPeriodEnd: '2025-01-01T00:00:00Z',
        prorationDate: '2024-12-15T00:00:00Z',
        daysRemaining: 17,
        totalDays: 31
    },
    proration: {
        proratedAmount: 2742,
        unusedAmount: 1580,
        newPlanAmount: 4322,
        difference: 2742,
        isUpgrade: true,
        isDowngrade: false,
        immediateCharge: 2742,
        creditApplied: 0
    }
};

/**
 * Calculate proration for plan change
 */
export async function calculateProration(subscriptionId: string, newPriceId: string, options = {}) {
    if (isMockEnv()) {
        console.log('[MOCK] Calculating proration');
        return MOCK_PRORATION;
    }

    try {
        const response = await fetch(`${API_URL}/api/billing/proration/calculate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscriptionId,
                newPriceId,
                ...options
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to calculate proration');
        }

        return await response.json();
    } catch (error) {
        console.error('Error calculating proration:', error);
        throw error;
    }
}

/**
 * Apply plan change with proration
 */
export async function applyPlanChange(subscriptionId: string, newPriceId: string, options = {}) {
    if (isMockEnv()) {
        console.log('[MOCK] Applying plan change');
        return {
            success: true,
            message: 'Plan changed successfully (mock)',
            subscription: { id: subscriptionId },
            proration: MOCK_PRORATION.proration
        };
    }

    try {
        const response = await fetch(`${API_URL}/api/billing/proration/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscriptionId,
                newPriceId,
                ...options
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to apply plan change');
        }

        return await response.json();
    } catch (error) {
        console.error('Error applying plan change:', error);
        throw error;
    }
}

/**
 * Schedule plan change at period end (no proration)
 */
export async function schedulePlanChangeAtPeriodEnd(subscriptionId: string, newPriceId: string) {
    if (isMockEnv()) {
        console.log('[MOCK] Scheduling plan change');
        return {
            success: true,
            message: 'Plan change scheduled for next billing period (mock)',
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    try {
        const response = await fetch(`${API_URL}/api/billing/proration/schedule`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscriptionId,
                newPriceId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to schedule plan change');
        }

        return await response.json();
    } catch (error) {
        console.error('Error scheduling plan change:', error);
        throw error;
    }
}

export const prorationService = {
    calculateProration,
    applyPlanChange,
    schedulePlanChangeAtPeriodEnd
};

export default prorationService;
