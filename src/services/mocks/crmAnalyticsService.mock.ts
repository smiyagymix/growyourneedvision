export const MOCK_CONVERSION_RATES = {
    lead_to_prospect: 45.5,
    prospect_to_customer: 62.3,
    overall: 28.4
};

export const MOCK_PIPELINE_HEALTH = {
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

export const MOCK_PERFORMANCE = {
    avg_cycle_time: 42.5,
    win_rate: 68.2,
    total_deals: 22,
    won_deals: 15,
    lost_deals: 7
};

export const generateMockRevenue = (): number[] => {
    const baseRevenue = 45000;
    return Array.from({ length: 12 }, (_, i) => {
        const seasonality = Math.sin((i / 12) * Math.PI * 2) * 15000;
        const growth = i * 2500;
        const randomVariation = (Math.random() - 0.5) * 10000;
        return Math.max(0, Math.round(baseRevenue + seasonality + growth + randomVariation));
    });
};
