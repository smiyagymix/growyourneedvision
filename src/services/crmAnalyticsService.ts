/**
 * CRM Analytics Service
 * Comprehensive analytics for conversion rates and pipeline health
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface AnalyticsMetrics {
    conversion_rates: {
        lead_to_prospect: number;
        prospect_to_customer: number;
        overall: number;
    };
    pipeline_health: {
        by_stage: Record<string, number>;
        total_value: number;
        weighted_value: number;
    };
    performance: {
        avg_cycle_time: number;
        win_rate: number;
        total_deals: number;
        won_deals: number;
        lost_deals: number;
    };
}

// Mock analytics data calculated from mock contacts and deals
const MOCK_CONVERSION_RATES = {
    lead_to_prospect: 45.5,
    prospect_to_customer: 62.3,
    overall: 28.4
};

const MOCK_PIPELINE_HEALTH = {
    by_stage: {
        'Lead': 3,
        'Contacted': 2,
        'Demo Scheduled': 4,
        'Trial': 2,
        'Subscribed': 1
    },
    total_value: 680000,
    weighted_value: 323000
};

const MOCK_PERFORMANCE = {
    avg_cycle_time: 42.5,
    win_rate: 68.2,
    total_deals: 22,
    won_deals: 15,
    lost_deals: 7
};

// Generate realistic revenue data for the past 12 months
const generateMockRevenue = (): number[] => {
    const baseRevenue = 45000;
    return Array.from({ length: 12 }, (_, i) => {
        // Add seasonality and growth trend
        const seasonality = Math.sin((i / 12) * Math.PI * 2) * 15000;
        const growth = i * 2500;
        const randomVariation = (Math.random() - 0.5) * 10000;
        return Math.max(0, Math.round(baseRevenue + seasonality + growth + randomVariation));
    });
};

class CRMAnalyticsService {
    async getConversionRates(): Promise<AnalyticsMetrics['conversion_rates']> {
        if (isMockEnv()) {
            return { ...MOCK_CONVERSION_RATES };
        }

        try {
            const contacts = await pb.collection('crm_contacts').getFullList();

            const leads = contacts.filter(c => c.status === 'lead').length;
            const prospects = contacts.filter(c => c.status === 'prospect').length;
            const customers = contacts.filter(c => c.status === 'customer').length;

            const lead_to_prospect = leads > 0 ? (prospects / leads) * 100 : 0;
            const prospect_to_customer = prospects > 0 ? (customers / prospects) * 100 : 0;
            const overall = leads > 0 ? (customers / leads) * 100 : 0;

            return {
                lead_to_prospect,
                prospect_to_customer,
                overall
            };
        } catch (error) {
            console.error('Error calculating conversion rates:', error);
            return { ...MOCK_CONVERSION_RATES };
        }
    }

    async getPipelineHealth(): Promise<AnalyticsMetrics['pipeline_health']> {
        if (isMockEnv()) {
            return { ...MOCK_PIPELINE_HEALTH };
        }

        try {
            const deals = await pb.collection('deals').getFullList();
            const openDeals = deals.filter(d => d.status === 'open');

            const by_stage: Record<string, number> = {};
            let total_value = 0;
            let weighted_value = 0;

            openDeals.forEach(deal => {
                by_stage[deal.stage] = (by_stage[deal.stage] || 0) + 1;
                total_value += deal.value || 0;
                weighted_value += deal.weighted_value || 0;
            });

            return {
                by_stage,
                total_value,
                weighted_value
            };
        } catch (error) {
            console.error('Error calculating pipeline health:', error);
            return { ...MOCK_PIPELINE_HEALTH };
        }
    }

    async getAverageCycleTime(): Promise<number> {
        if (isMockEnv()) {
            return MOCK_PERFORMANCE.avg_cycle_time;
        }

        try {
            const deals = await pb.collection('deals').getFullList();
            const closedDeals = deals.filter(d => d.actual_close_date);

            if (closedDeals.length === 0) return 0;

            const cycleTimes = closedDeals.map(deal => {
                const created = new Date(deal.created);
                const closed = new Date(deal.actual_close_date);
                return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
            });

            return cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length;
        } catch (error) {
            console.error('Error calculating cycle time:', error);
            return MOCK_PERFORMANCE.avg_cycle_time;
        }
    }

    async getWinLossAnalysis(): Promise<AnalyticsMetrics['performance']> {
        if (isMockEnv()) {
            return { ...MOCK_PERFORMANCE };
        }

        try {
            const deals = await pb.collection('deals').getFullList();

            const won_deals = deals.filter(d => d.status === 'won').length;
            const lost_deals = deals.filter(d => d.status === 'lost').length;
            const total_deals = won_deals + lost_deals;
            const win_rate = total_deals > 0 ? (won_deals / total_deals) * 100 : 0;
            const avg_cycle_time = await this.getAverageCycleTime();

            return {
                avg_cycle_time,
                win_rate,
                total_deals,
                won_deals,
                lost_deals
            };
        } catch (error) {
            console.error('Error calculating win/loss analysis:', error);
            return { ...MOCK_PERFORMANCE };
        }
    }

    async getRevenueByPeriod(period: 'month' | 'quarter' | 'year'): Promise<number[]> {
        if (isMockEnv()) {
            return generateMockRevenue();
        }

        try {
            const deals = await pb.collection('deals').getFullList();
            const wonDeals = deals.filter(d => d.status === 'won');

            // Simplified: return last 12 months
            const revenue: number[] = new Array(12).fill(0);

            wonDeals.forEach(deal => {
                const closeDate = new Date(deal.actual_close_date);
                const monthIndex = closeDate.getMonth();
                revenue[monthIndex] += deal.value || 0;
            });

            return revenue;
        } catch (error) {
            console.error('Error calculating revenue:', error);
            return generateMockRevenue();
        }
    }

    /**
     * Get email analytics metrics
     */
    async getEmailAnalytics(): Promise<{
        totalSent: number;
        openRate: number;
        clickRate: number;
        bounceRate: number;
        byMonth: { month: string; sent: number; opened: number; clicked: number }[];
    }> {
        if (isMockEnv()) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            
            // Generate realistic monthly data
            const byMonth = months.slice(0, currentMonth + 1).map((month, i) => {
                const sent = Math.floor(80 + Math.random() * 120);
                const opened = Math.floor(sent * (0.2 + Math.random() * 0.15));
                const clicked = Math.floor(opened * (0.3 + Math.random() * 0.2));
                return { month, sent, opened, clicked };
            });

            const totalSent = byMonth.reduce((sum, m) => sum + m.sent, 0);
            const totalOpened = byMonth.reduce((sum, m) => sum + m.opened, 0);
            const totalClicked = byMonth.reduce((sum, m) => sum + m.clicked, 0);

            return {
                totalSent,
                openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
                clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
                bounceRate: 2.3, // Typical bounce rate
                byMonth
            };
        }

        try {
            const emails = await pb.collection('crm_emails').getFullList();
            
            const totalSent = emails.filter(e => e.status !== 'draft').length;
            const opened = emails.filter(e => e.status === 'opened' || e.status === 'clicked').length;
            const clicked = emails.filter(e => e.status === 'clicked').length;

            // Group by month
            const byMonthMap = new Map<string, { sent: number; opened: number; clicked: number }>();
            emails.forEach(email => {
                if (email.sent_at) {
                    const date = new Date(email.sent_at);
                    const monthKey = date.toLocaleString('en-US', { month: 'short' });
                    const current = byMonthMap.get(monthKey) || { sent: 0, opened: 0, clicked: 0 };
                    current.sent++;
                    if (email.status === 'opened' || email.status === 'clicked') current.opened++;
                    if (email.status === 'clicked') current.clicked++;
                    byMonthMap.set(monthKey, current);
                }
            });

            return {
                totalSent,
                openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
                clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
                bounceRate: 0,
                byMonth: Array.from(byMonthMap.entries()).map(([month, data]) => ({ month, ...data }))
            };
        } catch (error) {
            console.error('Error calculating email analytics:', error);
            // Return fallback
            return {
                totalSent: 342,
                openRate: 24.5,
                clickRate: 12.8,
                bounceRate: 2.3,
                byMonth: []
            };
        }
    }

    /**
     * Get sales team performance metrics
     */
    async getTeamPerformance(): Promise<{
        byUser: { userId: string; name: string; deals: number; revenue: number; winRate: number }[];
        topPerformer: string;
        averageDealsPerUser: number;
    }> {
        if (isMockEnv()) {
            const mockUsers = [
                { userId: 'user-1', name: 'Alice Sales', deals: 12, revenue: 285000, winRate: 75.0 },
                { userId: 'user-2', name: 'Bob Manager', deals: 8, revenue: 195000, winRate: 62.5 },
                { userId: 'user-3', name: 'Charlie SDR', deals: 15, revenue: 145000, winRate: 80.0 }
            ];

            return {
                byUser: mockUsers,
                topPerformer: 'Charlie SDR',
                averageDealsPerUser: Math.round(mockUsers.reduce((s, u) => s + u.deals, 0) / mockUsers.length)
            };
        }

        try {
            const assignments = await pb.collection('deal_assignments').getFullList({ expand: 'assigned_to,deal_id' });
            const deals = await pb.collection('deals').getFullList();

            const userMap = new Map<string, { name: string; deals: number; won: number; revenue: number }>();

            assignments.forEach(assignment => {
                const userId = assignment.assigned_to;
                const deal = deals.find(d => d.id === assignment.deal_id);
                if (!deal) return;

                const current = userMap.get(userId) || { name: assignment.expand?.assigned_to?.name || userId, deals: 0, won: 0, revenue: 0 };
                current.deals++;
                if (deal.status === 'won') {
                    current.won++;
                    current.revenue += deal.value || 0;
                }
                userMap.set(userId, current);
            });

            const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
                userId,
                name: data.name,
                deals: data.deals,
                revenue: data.revenue,
                winRate: data.deals > 0 ? (data.won / data.deals) * 100 : 0
            }));

            const topPerformer = byUser.sort((a, b) => b.revenue - a.revenue)[0]?.name || 'N/A';

            return {
                byUser,
                topPerformer,
                averageDealsPerUser: byUser.length > 0 ? Math.round(byUser.reduce((s, u) => s + u.deals, 0) / byUser.length) : 0
            };
        } catch (error) {
            console.error('Error calculating team performance:', error);
            return { byUser: [], topPerformer: 'N/A', averageDealsPerUser: 0 };
        }
    }
}

export const crmAnalyticsService = new CRMAnalyticsService();
