import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantService } from './tenantService';
import pb from '../lib/pocketbase';

// Mock PocketBase
vi.mock('../lib/pocketbase', () => ({
  default: {
    collection: vi.fn(() => ({
      getList: vi.fn(),
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('tenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenants', () => {
    it('should fetch tenants successfully', async () => {
      const mockTenants = {
        items: [
          { id: '1', name: 'Tenant 1', status: 'active' },
          { id: '2', name: 'Tenant 2', status: 'suspended' },
        ],
        totalItems: 2,
      };

      const getListMock = vi.fn().mockResolvedValue(mockTenants);
      (pb.collection as any).mockReturnValue({
        getList: getListMock,
      });

      const result = await tenantService.getTenants();

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(getListMock).toHaveBeenCalledWith(1, 50, expect.objectContaining({
        sort: '-created',
        expand: 'admin_user'
      }));
      expect(result).toEqual(mockTenants);
    });
  });

  describe('getTenantById', () => {
    it('should fetch a single tenant by ID', async () => {
      const mockTenant = { id: '1', name: 'Tenant 1' };

      const getOneMock = vi.fn().mockResolvedValue(mockTenant);
      (pb.collection as any).mockReturnValue({
        getOne: getOneMock,
      });

      const result = await tenantService.getTenantById('1');

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(getOneMock).toHaveBeenCalledWith('1', expect.objectContaining({
        expand: 'admin_user'
      }));
      expect(result).toEqual(mockTenant);
    });
  });

  describe('createTenant', () => {
    it('should create a tenant successfully', async () => {
      const newTenant = { 
        name: 'New Tenant', 
        subdomain: 'new',
        plan: 'basic' as const,
        status: 'active' as const,
        subscription_status: 'active' as const,
        admin_email: 'admin@new.com',
        admin_user: 'user1',
        max_students: 100,
        max_teachers: 10,
        max_storage_gb: 5,
        features_enabled: []
      };
      
      const createdTenant = { ...newTenant, id: '123', created: 'now', updated: 'now' };

      const createMock = vi.fn().mockResolvedValue(createdTenant);
      (pb.collection as any).mockReturnValue({
        create: createMock,
      });

      const result = await tenantService.createTenant(newTenant);

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(createMock).toHaveBeenCalledWith(newTenant);
      expect(result).toEqual(createdTenant);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const tenantId = '123';
      const updates = { name: 'Updated Name' };
      const updatedTenant = { id: tenantId, ...updates };

      const updateMock = vi.fn().mockResolvedValue(updatedTenant);
      (pb.collection as any).mockReturnValue({
        update: updateMock,
      });

      const result = await tenantService.updateTenant(tenantId, updates);

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(updateMock).toHaveBeenCalledWith(tenantId, updates);
      expect(result).toEqual(updatedTenant);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      const tenantId = '123';
      
      const deleteMock = vi.fn().mockResolvedValue(true);
      (pb.collection as any).mockReturnValue({
        delete: deleteMock,
      });

      const result = await tenantService.deleteTenant(tenantId);

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(deleteMock).toHaveBeenCalledWith(tenantId);
      expect(result).toBe(true);
    });
  });

  describe('suspendTenant', () => {
    it('should suspend tenant successfully', async () => {
      const tenantId = '123';
      const suspendedTenant = { id: tenantId, status: 'suspended' };

      const updateMock = vi.fn().mockResolvedValue(suspendedTenant);
      (pb.collection as any).mockReturnValue({
        update: updateMock,
      });

      const result = await tenantService.suspendTenant(tenantId);

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(updateMock).toHaveBeenCalledWith(tenantId, { status: 'suspended' });
      expect(result).toEqual(suspendedTenant);
    });
  });

  describe('activateTenant', () => {
    it('should activate tenant successfully', async () => {
      const tenantId = '123';
      const activeTenant = { id: tenantId, status: 'active' };

      const updateMock = vi.fn().mockResolvedValue(activeTenant);
      (pb.collection as any).mockReturnValue({
        update: updateMock,
      });

      const result = await tenantService.activateTenant(tenantId);

      expect(pb.collection).toHaveBeenCalledWith('tenants');
      expect(updateMock).toHaveBeenCalledWith(tenantId, { status: 'active' });
      expect(result).toEqual(activeTenant);
    });
  });
});
