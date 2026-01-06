import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ownerService } from '../../services/ownerService';
import * as ReactQuery from '@tanstack/react-query';

// Mock ownerService
vi.mock('../../services/ownerService', () => ({
    ownerService: {
        getDashboardData: vi.fn(),
    },
}));

// Mock useQuery
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
}));

// Mock CommonUI components
vi.mock('../../components/shared/ui/CommonUI', () => ({
    Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
    Icon: ({ name }: any) => <span data-testid={`icon-${name}`}>Icon: {name}</span>,
}));

describe('AnalyticsDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', () => {
        (ReactQuery.useQuery as any).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        });

        render(<AnalyticsDashboard />);
        // Check for loading spinner or text (the component has a spinner div)
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('should render error state', () => {
        (ReactQuery.useQuery as any).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Failed to fetch'),
        });

        render(<AnalyticsDashboard />);
        expect(screen.getByText(/Failed to load analytics data/i)).toBeInTheDocument();
    });

    it('should render dashboard data correctly', () => {
        const mockData = {
            kpis: {
                mrr: { label: 'Monthly Recurring Revenue', value: '$10,000', change: 5, changeLabel: 'vs last month', trend: 'up', color: 'green' },
                activeTenants: { label: 'Active Tenants', value: '50', change: 2, changeLabel: 'new', trend: 'up', color: 'blue' },
                ltv: { label: 'Customer LTV', value: '$500', change: 0, changeLabel: '', trend: 'neutral', color: 'purple' },
                churn: { label: 'Churn Rate', value: '1.5%', change: 0, changeLabel: '', trend: 'neutral', color: 'orange' },
            },
            revenueHistory: [
                { label: 'Jan', value: 1000 },
                { label: 'Feb', value: 2000 },
            ],
            expensesByCategory: [
                { label: 'Hosting', value: 500, percentage: 50, color: 'red' },
            ],
            predictiveRevenue: [
                { label: 'Mar', value: 3000, type: 'projected' },
            ],
            cohortRetention: [
                { cohort: 'Jan 2024', retention: [100, 90] },
            ],
        };

        (ReactQuery.useQuery as any).mockReturnValue({
            data: mockData,
            isLoading: false,
            error: null,
        });

        render(<AnalyticsDashboard />);

        // Check KPIs
        expect(screen.getByText('Monthly Recurring Revenue')).toBeInTheDocument();
        expect(screen.getByText('$10,000')).toBeInTheDocument();
        expect(screen.getByText('Active Tenants')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();

        // Check Advanced Analytics sections
        expect(screen.getByText(/Predictive Revenue/i)).toBeInTheDocument();
        expect(screen.getByText(/User Retention Cohorts/i)).toBeInTheDocument();
        
        // Check Cohort Data
        expect(screen.getByText('Jan 2024')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
    });
});
