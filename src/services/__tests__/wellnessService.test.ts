import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wellnessService } from '../wellnessService';
import pb from '../../lib/pocketbase';

// Mock PocketBase
vi.mock('../../lib/pocketbase', () => ({
    default: {
        collection: vi.fn(() => ({
            getList: vi.fn(),
            getFullList: vi.fn(),
            getOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            getFirstListItem: vi.fn(),
        })),
    },
}));

// Mock isMockEnv to return false so we test the REAL logic
vi.mock('../../utils/mockData', () => ({
    isMockEnv: vi.fn(() => false),
}));

describe('wellnessService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getLogs', () => {
        it('should fetch wellness logs from PocketBase', async () => {
            const mockLogs = [
                { id: '1', steps: 5000, user: 'user1' },
                { id: '2', steps: 7000, user: 'user1' },
            ];

            (pb.collection as any).mockReturnValue({
                getList: vi.fn().mockResolvedValue({ items: mockLogs }),
            });

            const result = await wellnessService.getLogs('user1');
            expect(result).toEqual(mockLogs);
            expect(pb.collection).toHaveBeenCalledWith('wellness_logs');
        });

        it('should return empty array and warn on failure', async () => {
            (pb.collection as any).mockReturnValue({
                getList: vi.fn().mockRejectedValue(new Error('Fetch failed')),
            });

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const result = await wellnessService.getLogs('user1');

            expect(result).toEqual([]);
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe('createLog', () => {
        it('should create a log entry in PocketBase', async () => {
            const logData = { steps: 10000, user: 'user1' };
            const createdLog = { id: '3', ...logData };

            (pb.collection as any).mockReturnValue({
                create: vi.fn().mockResolvedValue(createdLog),
            });

            const result = await wellnessService.createLog(logData as any);
            expect(result).toEqual(createdLog);
        });
    });

    describe('getTodayLog', () => {
        it('should return the log for today if it exists', async () => {
            const today = new Date();
            const mockTodayLog = {
                id: 'today-1',
                date: today.toISOString(),
                user: 'user1'
            };

            // Mock getLogs which is called internally
            vi.spyOn(wellnessService, 'getLogs').mockResolvedValue([mockTodayLog] as any);

            const result = await wellnessService.getTodayLog('user1');
            expect(result).toEqual(mockTodayLog);
        });

        it('should return null if no log exists for today', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockOldLog = {
                id: 'old-1',
                date: yesterday.toISOString(),
                user: 'user1'
            };

            vi.spyOn(wellnessService, 'getLogs').mockResolvedValue([mockOldLog] as any);

            const result = await wellnessService.getTodayLog('user1');
            expect(result).toBeNull();
        });
    });
});
