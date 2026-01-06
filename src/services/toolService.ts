import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface Tool extends RecordModel {
    name: string;
    description: string;
    category: string;
    status: 'active' | 'beta' | 'maintenance';
    icon: string;
}

export interface MarketingTool extends Tool {
    campaign_count?: number;
    conversion_rate?: number;
}

export interface FinanceTool extends Tool {
    report_type?: string;
    currency?: string;
}

export interface BusinessTool extends Tool {
    rule_engine?: string;
}

export interface MarketplaceApp extends RecordModel {
    name: string;
    developer: string;
    price: number;
    rating: number;
    downloads: number;
    icon: string;
}

export interface SystemLog extends RecordModel {
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    timestamp: string;
}

export const toolService = {
    // Marketing Tools
    getMarketingTools: async (): Promise<MarketingTool[]> => {
        const fallback: MarketingTool[] = [
            { id: 'm1', collectionId: 'mock', collectionName: 'tools_marketing', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Campaign Studio', description: 'Orchestrate cross-channel campaigns', category: 'Marketing', status: 'active', icon: 'MegaphoneIcon', campaign_count: 12, conversion_rate: 4.2 },
            { id: 'm2', collectionId: 'mock', collectionName: 'tools_marketing', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Audience AI', description: 'Predictive audience builder', category: 'Marketing', status: 'beta', icon: 'Sparkles', campaign_count: 5, conversion_rate: 6.1 },
        ];
        if (isMockEnv()) return fallback;
        try {
            return await pb.collection('tools_marketing').getFullList<MarketingTool>();
        } catch (e) {
            console.warn("Marketing tools collection missing or empty");
            return [];
        }
    },
    
    // Finance Tools
    getFinanceTools: async (): Promise<FinanceTool[]> => {
        const fallback: FinanceTool[] = [
            { id: 'f1', collectionId: 'mock', collectionName: 'tools_finance', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Revenue Monitor', description: 'Track MRR/ARR in real time', category: 'Finance', status: 'active', icon: 'ChartBarIcon', report_type: 'Revenue' },
            { id: 'f2', collectionId: 'mock', collectionName: 'tools_finance', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Reconciliation Bot', description: 'Automate payouts reconciliation', category: 'Finance', status: 'beta', icon: 'BanknotesIcon', report_type: 'Payouts' },
        ];
        if (isMockEnv()) return fallback;
        try {
            return await pb.collection('tools_finance').getFullList<FinanceTool>();
        } catch (e) {
            console.warn("Finance tools collection missing or empty");
            return [];
        }
    },

    // Business Tools
    getBusinessTools: async (): Promise<BusinessTool[]> => {
        const fallback: BusinessTool[] = [
            { id: 'b1', collectionId: 'mock', collectionName: 'tools_business', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Pricing Lab', description: 'Experiment with pricing bundles', category: 'Business', status: 'active', icon: 'AdjustmentsHorizontalIcon', rule_engine: 'Monetization' },
        ];
        if (isMockEnv()) return fallback;
        try {
            return await pb.collection('tools_business').getFullList<BusinessTool>();
        } catch (e) {
            console.warn("Business tools collection missing or empty");
            return [];
        }
    },

    // Marketplace
    getMarketplaceApps: async (): Promise<MarketplaceApp[]> => {
        const fallback: MarketplaceApp[] = [
            { id: 'app1', collectionId: 'mock', collectionName: 'marketplace_apps', created: new Date().toISOString(), updated: new Date().toISOString(), name: 'Attendance Sync', developer: 'GYN Labs', price: 19, rating: 4.8, downloads: 1200, icon: 'CheckCircleIcon' },
        ];
        if (isMockEnv()) return fallback;
        try {
            return await pb.collection('marketplace_apps').getFullList<MarketplaceApp>();
        } catch (e) {
            console.warn("Marketplace apps collection missing or empty");
            return [];
        }
    },

    // Logs
    getSystemLogs: async (page = 1, perPage = 50) => {
        if (isMockEnv()) return { items: [], totalItems: 0 };
        try {
            return await pb.collection('system_logs').getList<SystemLog>(page, perPage, { sort: '-created' });
        } catch (e) {
            console.warn("System logs collection missing or empty");
            return { items: [], totalItems: 0 };
        }
    }
};
