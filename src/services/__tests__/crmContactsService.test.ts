import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crmContactsService } from '../crmContactsService';
import pb from '../../lib/pocketbase';
import { auditLogger } from '../auditLogger';

// Mock PocketBase
vi.mock('../../lib/pocketbase', () => ({
    default: {
        collection: vi.fn(() => ({
            getFullList: vi.fn(),
            getOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        })),
    },
}));

// Mock AuditLogger
vi.mock('../auditLogger', () => ({
    auditLogger: {
        log: vi.fn().mockResolvedValue(true),
    },
}));

describe('crmContactsService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllContacts', () => {
        it('should fetch all contacts without filters', async () => {
            const mockContacts = [
                { id: '1', first_name: 'John', last_name: 'Doe' },
            ];

            const getFullListMock = vi.fn().mockResolvedValue(mockContacts);
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });

            const result = await crmContactsService.getAllContacts();

            expect(pb.collection).toHaveBeenCalledWith('crm_contacts');
            expect(getFullListMock).toHaveBeenCalledWith(expect.objectContaining({
                filter: '',
                sort: '-created'
            }));
            expect(result).toEqual(mockContacts);
        });

        it('should build correct filter string', async () => {
            const getFullListMock = vi.fn().mockResolvedValue([]);
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });

            const filters = {
                status: 'lead' as const,
                company: 'TechCorp',
            };

            await crmContactsService.getAllContacts(filters);

            expect(getFullListMock).toHaveBeenCalledWith(expect.objectContaining({
                filter: 'status = "lead" && company ~ "TechCorp"',
            }));
        });
    });

    describe('createContact', () => {
        it('should create contact and log audit event', async () => {
            const newContact = {
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                status: 'lead' as const,
            };

            const createdContact = { ...newContact, id: '123' };

            (pb.collection as any).mockReturnValue({
                create: vi.fn().mockResolvedValue(createdContact),
            });

            const result = await crmContactsService.createContact(newContact);

            expect(result).toEqual(createdContact);
            expect(auditLogger.log).toHaveBeenCalledWith('contactCreate', expect.objectContaining({
                contact_id: '123',
                email: 'jane@example.com'
            }));
        });
    });

    describe('getContactStats', () => {
        it('should calculate stats correctly', async () => {
            const mockContacts = [
                { id: '1', status: 'lead', created: new Date().toISOString() }, // Recent
                { id: '2', status: 'lead', created: new Date().toISOString() }, // Recent
                { id: '3', status: 'customer', created: '2020-01-01T00:00:00.000Z' }, // Old
            ];

            // return ALL contacts for stats
            (pb.collection as any).mockReturnValue({
                getFullList: vi.fn().mockResolvedValue(mockContacts),
            });

            const stats = await crmContactsService.getContactStats();

            expect(stats.total).toBe(3);
            expect(stats.by_status.lead).toBe(2);
            expect(stats.by_status.customer).toBe(1);
            expect(stats.recent).toBe(2); // 2 created just now
        });
    });
});
