import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ownerService } from './ownerService';
import pb from '../lib/pocketbase';

// Mock the pocketbase module
vi.mock('../lib/pocketbase', () => {
    return {
        default: {
            collection: vi.fn(() => ({
                getList: vi.fn(),
                getFullList: vi.fn(),
                getFirstListItem: vi.fn(),
                update: vi.fn(),
                create: vi.fn(),
            })),
        },
    };
});

describe('OwnerService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        (console.error as unknown as { mockRestore: () => void }).mockRestore?.();
    });

    describe('getDashboardData', () => {
        it('should return dashboard data with default values when API calls fail', async () => {
            // Mock implementations to throw errors or return empty
            (pb.collection as any).mockImplementation(() => ({
                getList: vi.fn().mockRejectedValue(new Error('API Error')),
                getFullList: vi.fn().mockRejectedValue(new Error('API Error')),
            }));

            const data = await ownerService.getDashboardData();

            expect(data).toBeDefined();
            expect(data.kpis.mrr.value).toBe('$0');
            expect(data.kpis.activeTenants.value).toBe('0');
            // Check for new fields
            expect(data.predictiveRevenue).toEqual([]);
            // Cohort retention is currently hardcoded/mocked in the service, so it will be present even on API failure
            expect(data.cohortRetention.length).toBeGreaterThan(0);
        });

        it('should calculate KPIs correctly based on mocked data', async () => {
            // Mock successful responses
            const mockTenants = { totalItems: 10, items: [] };
            const mockInvoices = [
                { amount: 100, status: 'Paid', paid_at: new Date().toISOString() },
                { amount: 200, status: 'Paid', paid_at: new Date().toISOString() }
            ];
            
            const collectionMock = vi.fn((collectionName) => {
                if (collectionName === 'tenants') {
                    return {
                        getList: vi.fn().mockResolvedValue(mockTenants),
                        getFullList: vi.fn().mockResolvedValue([]),
                    };
                }
                if (collectionName === 'invoices') {
                    return {
                        getFullList: vi.fn().mockResolvedValue(mockInvoices),
                    };
                }
                if (collectionName === 'system_alerts') {
                    return {
                        getList: vi.fn().mockResolvedValue({ items: [] }),
                    };
                }
                if (collectionName === 'analytics_pages' || collectionName === 'analytics_sources' || collectionName === 'finance_expenses') {
                     return {
                        getList: vi.fn().mockResolvedValue({ items: [] }),
                    };
                }
                return {
                    getList: vi.fn().mockResolvedValue({ items: [] }),
                    getFullList: vi.fn().mockResolvedValue([]),
                };
            });

            (pb.collection as any).mockImplementation(collectionMock);

            const data = await ownerService.getDashboardData();

            // MRR should be sum of invoices (100 + 200 = 300)
            expect(data.kpis.mrr.value).toBe('$300');
            // Active tenants should be 10
            expect(data.kpis.activeTenants.value).toBe('10');
        });
        
        it('should generate predictive revenue and cohorts', async () => {
             const collectionMock = vi.fn(() => ({
                 getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
                 getFullList: vi.fn().mockResolvedValue([]),
             }));
             (pb.collection as any).mockImplementation(collectionMock);
             
             const data = await ownerService.getDashboardData();
             
             // Verify Predictive Revenue structure
             expect(data.predictiveRevenue).toBeDefined();
             // Even if empty history, it might be empty or have just projections if logic allows. 
             // In current impl, if history is empty, predictive is empty.
             expect(Array.isArray(data.predictiveRevenue)).toBe(true);

             // Verify Cohort Retention (Mocked in service)
             expect(data.cohortRetention).toBeDefined();
             expect(data.cohortRetention.length).toBeGreaterThan(0);
             expect(data.cohortRetention[0]).toHaveProperty('cohort');
             expect(data.cohortRetention[0]).toHaveProperty('retention');
        });
    });
});
