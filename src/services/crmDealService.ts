/**
 * CRM Deal Enhancements Service
 * Enhanced deal management with value, probability, and close dates
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';
import { isMockEnv } from '../utils/mockData';

export interface Deal {
    id: string;
    title: string;
    contact_id: string;
    stage: string;
    value: number;
    currency: string;
    probability: number;
    weighted_value: number;
    expected_close_date: string;
    actual_close_date?: string;
    status: 'open' | 'won' | 'lost' | 'cancelled';
    created: string;
    updated: string;
}

// Mock data for development/testing
const MOCK_DEALS: Deal[] = [
    {
        id: 'deal-1',
        title: 'Enterprise Platform License',
        contact_id: 'contact-1',
        stage: 'Trial',
        value: 120000,
        currency: 'USD',
        probability: 75,
        weighted_value: 90000,
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'deal-2',
        title: 'STEM Curriculum Package',
        contact_id: 'contact-2',
        stage: 'Demo Scheduled',
        value: 45000,
        currency: 'USD',
        probability: 50,
        weighted_value: 22500,
        expected_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'deal-3',
        title: 'K-12 School District Rollout',
        contact_id: 'contact-3',
        stage: 'Lead',
        value: 250000,
        currency: 'USD',
        probability: 25,
        weighted_value: 62500,
        expected_close_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'deal-4',
        title: 'Corporate Training Platform',
        contact_id: 'contact-1',
        stage: 'Subscribed',
        value: 85000,
        currency: 'USD',
        probability: 100,
        weighted_value: 85000,
        expected_close_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        actual_close_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'won',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'deal-5',
        title: 'University Partnership',
        contact_id: 'contact-2',
        stage: 'Contacted',
        value: 180000,
        currency: 'USD',
        probability: 35,
        weighted_value: 63000,
        expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class CRMDealService {
    private collection = 'deals';
    private mockDeals = [...MOCK_DEALS];

    async getAllDeals(): Promise<Deal[]> {
        if (isMockEnv()) {
            return [...this.mockDeals];
        }

        try {
            return await pb.collection(this.collection).getFullList<Deal>({
                sort: '-created',
                expand: 'contact_id'
            });
        } catch (error) {
            console.error('Error fetching deals:', error);
            // Return mock data as fallback
            return [...this.mockDeals];
        }
    }

    async getDealById(id: string): Promise<Deal> {
        if (isMockEnv()) {
            const deal = this.mockDeals.find(d => d.id === id);
            if (deal) return deal;
            throw new Error('Deal not found');
        }

        try {
            return await pb.collection(this.collection).getOne<Deal>(id, {
                expand: 'contact_id'
            });
        } catch (error) {
            console.error('Error fetching deal:', error);
            throw error;
        }
    }

    async createDeal(data: Partial<Deal>): Promise<Deal> {
        const weighted_value = this.calculateWeightedValue(data.value || 0, data.probability || 0);
        
        if (isMockEnv()) {
            const newDeal: Deal = {
                id: `deal-${Date.now()}`,
                title: data.title || '',
                contact_id: data.contact_id || '',
                stage: data.stage || 'Lead',
                value: data.value || 0,
                currency: data.currency || 'USD',
                probability: data.probability || 0,
                weighted_value,
                expected_close_date: data.expected_close_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'open',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            this.mockDeals.unshift(newDeal);
            return newDeal;
        }

        try {
            const deal = await pb.collection(this.collection).create<Deal>({
                ...data,
                weighted_value,
                currency: data.currency || 'USD',
                status: 'open'
            });
            await auditLogger.log({
                action: 'dealCreate',
                resource_type: 'crm_deal',
                resource_id: deal.id,
                severity: 'info',
                metadata: { title: deal.title }
            });
            return deal;
        } catch (error) {
            console.error('Error creating deal:', error);
            throw error;
        }
    }

    async updateDealValue(id: string, value: number, currency: string = 'USD'): Promise<Deal> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                const weighted_value = this.calculateWeightedValue(value, this.mockDeals[idx].probability);
                this.mockDeals[idx] = { 
                    ...this.mockDeals[idx], 
                    value, 
                    currency, 
                    weighted_value,
                    updated: new Date().toISOString() 
                };
                return this.mockDeals[idx];
            }
            throw new Error('Deal not found');
        }

        try {
            const deal = await this.getDealById(id);
            const weighted_value = this.calculateWeightedValue(value, deal.probability);
            const updated = await pb.collection(this.collection).update<Deal>(id, {
                value,
                currency,
                weighted_value
            });
            await auditLogger.log({
                action: 'dealValueUpdate',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'info',
                metadata: { value, currency }
            });
            return updated;
        } catch (error) {
            console.error('Error updating deal value:', error);
            throw error;
        }
    }

    async updateProbability(id: string, probability: number): Promise<Deal> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                const weighted_value = this.calculateWeightedValue(this.mockDeals[idx].value, probability);
                this.mockDeals[idx] = { 
                    ...this.mockDeals[idx], 
                    probability, 
                    weighted_value,
                    updated: new Date().toISOString() 
                };
                return this.mockDeals[idx];
            }
            throw new Error('Deal not found');
        }

        try {
            const deal = await this.getDealById(id);
            const weighted_value = this.calculateWeightedValue(deal.value, probability);
            const updated = await pb.collection(this.collection).update<Deal>(id, {
                probability,
                weighted_value
            });
            await auditLogger.log({
                action: 'dealProbabilityUpdate',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'info',
                metadata: { probability }
            });
            return updated;
        } catch (error) {
            console.error('Error updating probability:', error);
            throw error;
        }
    }

    async updateCloseDate(id: string, expected_close_date: string): Promise<Deal> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                this.mockDeals[idx] = { 
                    ...this.mockDeals[idx], 
                    expected_close_date,
                    updated: new Date().toISOString() 
                };
                return this.mockDeals[idx];
            }
            throw new Error('Deal not found');
        }

        try {
            const updated = await pb.collection(this.collection).update<Deal>(id, {
                expected_close_date
            });
            await auditLogger.log({
                action: 'dealCloseDateUpdate',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'info',
                metadata: { date: expected_close_date }
            });
            return updated;
        } catch (error) {
            console.error('Error updating close date:', error);
            throw error;
        }
    }

    async markDealWon(id: string): Promise<Deal> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                this.mockDeals[idx] = { 
                    ...this.mockDeals[idx], 
                    status: 'won',
                    actual_close_date: new Date().toISOString(),
                    probability: 100,
                    weighted_value: this.mockDeals[idx].value,
                    updated: new Date().toISOString() 
                };
                return this.mockDeals[idx];
            }
            throw new Error('Deal not found');
        }

        try {
            const updated = await pb.collection(this.collection).update<Deal>(id, {
                status: 'won',
                actual_close_date: new Date().toISOString(),
                probability: 100
            });
            await auditLogger.log({
                action: 'dealWon',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'info'
            });
            return updated;
        } catch (error) {
            console.error('Error marking deal won:', error);
            throw error;
        }
    }

    async markDealLost(id: string): Promise<Deal> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                this.mockDeals[idx] = { 
                    ...this.mockDeals[idx], 
                    status: 'lost',
                    actual_close_date: new Date().toISOString(),
                    probability: 0,
                    weighted_value: 0,
                    updated: new Date().toISOString() 
                };
                return this.mockDeals[idx];
            }
            throw new Error('Deal not found');
        }

        try {
            const updated = await pb.collection(this.collection).update<Deal>(id, {
                status: 'lost',
                actual_close_date: new Date().toISOString(),
                probability: 0
            });
            await auditLogger.log({
                action: 'dealLost',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'info'
            });
            return updated;
        } catch (error) {
            console.error('Error marking deal lost:', error);
            throw error;
        }
    }

    calculateWeightedValue(value: number, probability: number): number {
        return value * (probability / 100);
    }

    async getDealsByCloseDate(startDate: Date, endDate: Date): Promise<Deal[]> {
        try {
            const deals = await this.getAllDeals();
            return deals.filter(deal => {
                const closeDate = new Date(deal.expected_close_date);
                return closeDate >= startDate && closeDate <= endDate;
            });
        } catch (error) {
            console.error('Error fetching deals by close date:', error);
            throw error;
        }
    }

    async getForecastedRevenue(month: number, year: number): Promise<number> {
        try {
            const deals = await this.getAllDeals();
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const monthDeals = deals.filter(deal => {
                const closeDate = new Date(deal.expected_close_date);
                return closeDate >= startDate && closeDate <= endDate && deal.status === 'open';
            });

            return monthDeals.reduce((sum, deal) => sum + deal.weighted_value, 0);
        } catch (error) {
            console.error('Error calculating forecasted revenue:', error);
            throw error;
        }
    }

    async deleteDeal(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = this.mockDeals.findIndex(d => d.id === id);
            if (idx >= 0) {
                this.mockDeals.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(id);
            await auditLogger.log({
                action: 'dealDelete',
                resource_type: 'crm_deal',
                resource_id: id,
                severity: 'warning'
            });
            return true;
        } catch (error) {
            console.error('Error deleting deal:', error);
            throw error;
        }
    }
}

export const crmDealService = new CRMDealService();
