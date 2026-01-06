import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

// In-memory mock store for e2e/mock environments so create/update/delete are reflected
const mockDeals: Deal[] = [
    { id: 'd1', collectionId: 'mock', collectionName: 'deals', created: new Date().toISOString(), updated: new Date().toISOString(), title: 'New Campus Expansion', value: 120000, stage: 'Trial', description: 'Pilot with 3 campuses', contact_name: 'Alex Rivers', assigned_to: 'u1' },
    { id: 'd2', collectionId: 'mock', collectionName: 'deals', created: new Date().toISOString(), updated: new Date().toISOString(), title: 'STEM Program', value: 45000, stage: 'Subscribed', description: 'STEM curriculum rollout', contact_name: 'Jamie Lee', assigned_to: 'u2' },
];

export interface Deal extends RecordModel {
    title: string;
    value: number;
    stage: 'Lead' | 'Contacted' | 'Demo Scheduled' | 'Trial' | 'Subscribed' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
    description: string;
    contact_name: string;
    assigned_to: string; // User ID
    expected_close_date?: string;
    probability?: number;
}

export interface Contact extends RecordModel {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    last_contact: string;
}

export interface ForecastData {
    month: string;
    projected: number;
    actual: number;
    predicted: number;
    closed: number;
    pipeline: number;
}

export const crmService = {
    async getDeals() {
        if (isMockEnv()) return [...mockDeals];

        try {
            return await pb.collection('deals').getFullList<Deal>({
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching deals:', error);
            return [];
        }
    },

    async getContacts() {
        const fallback: Contact[] = [
            { id: 'c1', collectionId: 'mock', collectionName: 'contacts', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Alex Rivers', email: 'alex@example.com', phone: '555-1010', company: 'Mock Academy', role: 'CTO', last_contact: new Date().toISOString() },
            { id: 'c2', collectionId: 'mock', collectionName: 'contacts', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Jamie Lee', email: 'jamie@example.com', phone: '555-2020', company: 'Future Scholars', role: 'Dean', last_contact: new Date().toISOString() },
        ];

        if (isMockEnv()) return fallback;

        try {
            return await pb.collection('contacts').getFullList<Contact>({
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    },

    async getForecast() {
        const fallback: ForecastData[] = [
            { month: 'Jan', projected: 120000, actual: 115000, predicted: 120000, closed: 115000, pipeline: 150000 },
            { month: 'Feb', projected: 125000, actual: 0, predicted: 125000, closed: 0, pipeline: 160000 },
            { month: 'Mar', projected: 130000, actual: 0, predicted: 130000, closed: 0, pipeline: 170000 },
        ];

        if (isMockEnv()) return fallback;

        try {
            // In a real app, this would aggregate deal data or fetch from a dedicated endpoint
            return await pb.collection('forecasts').getFullList<ForecastData>();
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return [];
        }
    },

    async createDeal(data: Partial<Deal>) {
        try {
            if (isMockEnv()) {
                const newDeal: Deal = {
                    id: `mock-deal-${Date.now()}`,
                    collectionId: 'mock',
                    collectionName: 'deals',
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    title: data.title || '',
                    value: data.value || 0,
                    stage: data.stage || 'Lead',
                    description: data.description || '',
                    contact_name: data.contact_name || '',
                    assigned_to: data.assigned_to || '',
                    expected_close_date: data.expected_close_date,
                    probability: data.probability
                };
                mockDeals.unshift(newDeal);
                return newDeal;
            }

            return await pb.collection('deals').create<Deal>(data);
        } catch (error) {
            console.error('Error creating deal:', error);
            throw error;
        }
    },

    async updateDealStage(id: string, stage: Deal['stage']) {
        try {
            if (isMockEnv()) {
                const idx = mockDeals.findIndex(d => d.id === id);
                if (idx >= 0) {
                    mockDeals[idx] = { ...mockDeals[idx], stage, updated: new Date().toISOString() };
                    return mockDeals[idx];
                }
                return null;
            }
            return await pb.collection('deals').update<Deal>(id, { stage });
        } catch (error) {
            console.error('Error updating deal stage:', error);
            return null;
        }
    },

    async updateDeal(id: string, data: Partial<Deal>) {
        try {
            if (isMockEnv()) {
                const idx = mockDeals.findIndex(d => d.id === id);
                if (idx >= 0) {
                    mockDeals[idx] = { ...mockDeals[idx], ...data, updated: new Date().toISOString() } as Deal;
                    return mockDeals[idx];
                }
                return null;
            }
            return await pb.collection('deals').update<Deal>(id, data);
        } catch (error) {
            console.error('Error updating deal:', error);
            return null;
        }
    },

    async deleteDeal(id: string) {
        try {
            if (isMockEnv()) {
                const idx = mockDeals.findIndex(d => d.id === id);
                if (idx >= 0) mockDeals.splice(idx, 1);
                return true;
            }
            return await pb.collection('deals').delete(id);
        } catch (error) {
            console.error('Error deleting deal:', error);
            return false;
        }
    }
};
