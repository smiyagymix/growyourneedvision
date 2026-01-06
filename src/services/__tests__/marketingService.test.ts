import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { marketingService } from '../marketingService';
import pb from '../../lib/pocketbase';

// Mock PocketBase
vi.mock('../../lib/pocketbase', () => ({
    default: {
        collection: vi.fn(() => ({
            getFullList: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        })),
    },
}));

describe('marketingService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getCampaigns', () => {
        it('should fetch campaigns successfully', async () => {
            const mockCampaigns = [
                { id: '1', name: 'Summer Sale', status: 'Active' },
                { id: '2', name: 'Winter Promo', status: 'Draft' },
            ];

            // Setup mock
            (pb.collection as any).mockReturnValue({
                getFullList: vi.fn().mockResolvedValue(mockCampaigns),
            });

            const result = await marketingService.getCampaigns();
            expect(result).toEqual(mockCampaigns);
            expect(pb.collection).toHaveBeenCalledWith('campaigns');
        });

        it('should return empty array on error', async () => {
            // Setup mock to throw
            (pb.collection as any).mockReturnValue({
                getFullList: vi.fn().mockRejectedValue(new Error('Network error')),
            });

            // Mock console.error to avoid noise
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await marketingService.getCampaigns();
            expect(result).toEqual([]);

            consoleSpy.mockRestore();
        });
    });

    describe('createCampaign', () => {
        it('should create a campaign successfully', async () => {
            const newCampaign = { name: 'New Campaign', status: 'Draft' };
            const createdCampaign = { id: '3', ...newCampaign };

            (pb.collection as any).mockReturnValue({
                create: vi.fn().mockResolvedValue(createdCampaign),
            });

            const result = await marketingService.createCampaign(newCampaign as any);
            expect(result).toEqual(createdCampaign);
            expect(pb.collection).toHaveBeenCalledWith('campaigns');
        });
    });

    describe('getSegments', () => {
        it('should fetch segments successfully', async () => {
            const mockSegments = [
                { id: '1', name: 'VIP Users', type: 'Dynamic' },
            ];

            (pb.collection as any).mockReturnValue({
                getFullList: vi.fn().mockResolvedValue(mockSegments),
            });

            const result = await marketingService.getSegments();
            expect(result).toEqual(mockSegments);
        });

        it('should return mock segments on error (fallback)', async () => {
            (pb.collection as any).mockReturnValue({
                getFullList: vi.fn().mockRejectedValue(new Error('Collection not found')),
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await marketingService.getSegments();
            // Should return the hardcoded mock data from service
            expect(result.length).toBe(3);
            expect(result[0].name).toBe('High Value Customers');

            consoleSpy.mockRestore();
        });
    });
});
