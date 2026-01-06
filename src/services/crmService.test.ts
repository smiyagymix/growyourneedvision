import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crmService } from './crmService';
import pb from '../lib/pocketbase';

// Mock PocketBase
vi.mock('../lib/pocketbase', () => ({
  default: {
    collection: vi.fn(() => ({
      getFullList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('crmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDeals', () => {
    it('should fetch deals successfully', async () => {
      const mockDeals = [
        { id: '1', title: 'Deal 1', value: 1000, stage: 'Lead' },
        { id: '2', title: 'Deal 2', value: 2000, stage: 'Closed Won' },
      ];

      const getFullListMock = vi.fn().mockResolvedValue(mockDeals);
      (pb.collection as any).mockReturnValue({
        getFullList: getFullListMock,
      });

      const result = await crmService.getDeals();

      expect(pb.collection).toHaveBeenCalledWith('deals');
      expect(getFullListMock).toHaveBeenCalled();
      expect(result).toEqual(mockDeals);
    });

    it('should handle errors when fetching deals', async () => {
      const getFullListMock = vi.fn().mockRejectedValue(new Error('Network error'));
      (pb.collection as any).mockReturnValue({
        getFullList: getFullListMock,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await crmService.getDeals();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching deals:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('createDeal', () => {
    it('should create a deal successfully', async () => {
      const newDeal = { 
        title: 'New Deal', 
        value: 5000, 
        stage: 'Lead' as const,
        description: 'Test',
        contact_name: 'John Doe',
        assigned_to: 'user1'
      };
      
      const createdDeal = { ...newDeal, id: '123', created: 'now', updated: 'now' };

      const createMock = vi.fn().mockResolvedValue(createdDeal);
      (pb.collection as any).mockReturnValue({
        create: createMock,
      });

      const result = await crmService.createDeal(newDeal);

      expect(pb.collection).toHaveBeenCalledWith('deals');
      expect(createMock).toHaveBeenCalledWith(newDeal);
      expect(result).toEqual(createdDeal);
    });

    it('should throw error when creation fails', async () => {
      const newDeal = { 
        title: 'New Deal', 
        value: 5000, 
        stage: 'Lead' as const,
        description: 'Test',
        contact_name: 'John Doe',
        assigned_to: 'user1'
      };

      const createMock = vi.fn().mockRejectedValue(new Error('Create failed'));
      (pb.collection as any).mockReturnValue({
        create: createMock,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(crmService.createDeal(newDeal)).rejects.toThrow('Create failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error creating deal:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateDealStage', () => {
    it('should update deal stage successfully', async () => {
      const dealId = '123';
      const newStage = 'Closed Won';
      const updatedDeal = { id: dealId, stage: newStage };

      const updateMock = vi.fn().mockResolvedValue(updatedDeal);
      (pb.collection as any).mockReturnValue({
        update: updateMock,
      });

      const result = await crmService.updateDealStage(dealId, newStage);

      expect(pb.collection).toHaveBeenCalledWith('deals');
      expect(updateMock).toHaveBeenCalledWith(dealId, { stage: newStage });
      expect(result).toEqual(updatedDeal);
    });
  });

  describe('deleteDeal', () => {
    it('should delete deal successfully', async () => {
      const dealId = '123';
      
      const deleteMock = vi.fn().mockResolvedValue(true);
      (pb.collection as any).mockReturnValue({
        delete: deleteMock,
      });

      const result = await crmService.deleteDeal(dealId);

      expect(pb.collection).toHaveBeenCalledWith('deals');
      expect(deleteMock).toHaveBeenCalledWith(dealId);
      expect(result).toBe(true);
    });
  });
});
