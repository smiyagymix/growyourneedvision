import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { systemHealthService } from '../systemHealthService';
import pb from '../../lib/pocketbase';

// Mock PocketBase
vi.mock('../../lib/pocketbase', () => ({
    default: {
        collection: vi.fn(() => ({
            create: vi.fn(),
        })),
    },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('systemHealthService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('checkService', () => {
        it('should return healthy for a responding service', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: 'healthy' })
            });

            const result = await systemHealthService.checkService({
                name: 'test',
                endpoint: 'http://test.com',
                healthPath: '/health'
            });

            expect(result.status).toBe('healthy');
            expect(mockFetch).toHaveBeenCalledWith('http://test.com/health', expect.any(Object));
        });

        it('should return down and create an incident alert for a failing service', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const alertSpy = vi.spyOn(systemHealthService, 'createIncidentAlert').mockResolvedValue(undefined);

            const result = await systemHealthService.checkService({
                name: 'test',
                endpoint: 'http://test.com',
                healthPath: '/health'
            });

            expect(result.status).toBe('down');
            expect(alertSpy).toHaveBeenCalledWith('test', 'down', expect.stringContaining('Connection refused'));
        });
    });

    describe('getOverallHealth', () => {
        it('should return healthy if all latest metrics are healthy', async () => {
            const mockMetrics = [
                { service_name: 'pocketbase', status: 'healthy', last_check: new Date().toISOString() },
                { service_name: 'ai_service', status: 'healthy', last_check: new Date().toISOString() }
            ];

            vi.spyOn(systemHealthService, 'getLatestMetrics').mockResolvedValue(mockMetrics as any);

            const result = await systemHealthService.getOverallHealth();
            expect(result.status).toBe('healthy');
            expect(result.healthy_count).toBe(2);
        });

        it('should return down if a critical service is down', async () => {
            const mockMetrics = [
                { service_name: 'pocketbase', status: 'down', last_check: new Date().toISOString() },
                { service_name: 'ai_service', status: 'healthy', last_check: new Date().toISOString() }
            ];

            vi.spyOn(systemHealthService, 'getLatestMetrics').mockResolvedValue(mockMetrics as any);
            // Pocketbase is critical by default in DEFAULT_SERVICES

            const result = await systemHealthService.getOverallHealth();
            expect(result.status).toBe('down');
            expect(result.critical_down).toBe(true);
        });
    });
});
