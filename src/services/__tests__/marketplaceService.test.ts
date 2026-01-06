import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { marketplaceService } from '../marketplaceService';
import pb from '../../lib/pocketbase';

// Mock PocketBase
vi.mock('../../lib/pocketbase', () => ({
    default: {
        collection: vi.fn(() => ({
            getFullList: vi.fn(),
            create: vi.fn(),
        })),
    },
}));

describe('marketplaceService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getApps', () => {
        it('should fetch all apps sorted by installs', async () => {
            const mockApps = [
                { id: '1', name: 'App 1', installs: 100 },
                { id: '2', name: 'App 2', installs: 50 },
            ];

            const getFullListMock = vi.fn().mockResolvedValue(mockApps);
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });

            const result = await marketplaceService.getApps();

            expect(pb.collection).toHaveBeenCalledWith('marketplace_apps');
            expect(getFullListMock).toHaveBeenCalledWith(expect.objectContaining({
                sort: '-installs'
            }));
            expect(result).toEqual(mockApps);
        });

        it('should return empty array on failing fetch', async () => {
            const getFullListMock = vi.fn().mockRejectedValue(new Error('Network error'));
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await marketplaceService.getApps();
            expect(result).toEqual([]);
            consoleSpy.mockRestore();
        });
    });

    describe('getMyApps', () => {
        it('should fetch apps for specific provider', async () => {
            const userId = 'user123';
            const mockApps = [{ id: '1', name: 'My App', provider: userId }];

            const getFullListMock = vi.fn().mockResolvedValue(mockApps);
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });

            const result = await marketplaceService.getMyApps(userId);

            expect(getFullListMock).toHaveBeenCalledWith(expect.objectContaining({
                filter: `provider = "${userId}"`,
                sort: '-created'
            }));
            expect(result).toEqual(mockApps);
        });
    });

    describe('submitApp', () => {
        it('should create new app entry', async () => {
            const newApp = { name: 'New App', price: 'Free' };
            const createdApp = { id: '789', ...newApp };

            const createMock = vi.fn().mockResolvedValue(createdApp);
            (pb.collection as any).mockReturnValue({
                create: createMock,
            });

            const result = await marketplaceService.submitApp(newApp as any);
            expect(result).toEqual(createdApp);
            expect(pb.collection).toHaveBeenCalledWith('marketplace_apps');
        });
    });
});
