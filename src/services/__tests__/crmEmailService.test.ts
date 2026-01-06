import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crmEmailService, EmailTemplate } from '../crmEmailService';
import pb from '../../lib/pocketbase';
import { auditLogger } from '../auditLogger';

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

// Mock AuditLogger
vi.mock('../auditLogger', () => ({
    auditLogger: {
        log: vi.fn().mockResolvedValue(true),
    },
}));

describe('crmEmailService', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('sendEmail', () => {
        it('should create email record and log audit', async () => {
            const emailData = {
                to: 'test@example.com',
                subject: 'Hello',
                body: 'World',
                options: { contactId: 'contact1' }
            };

            const createdEmail = {
                id: 'email123',
                status: 'sent',
                ...emailData
            };

            (pb.collection as any).mockReturnValue({
                create: vi.fn().mockResolvedValue(createdEmail),
            });

            const result = await crmEmailService.sendEmail(
                emailData.to,
                emailData.subject,
                emailData.body,
                emailData.options
            );

            expect(pb.collection).toHaveBeenCalledWith('crm_emails');
            expect(result).toEqual(createdEmail);
            expect(auditLogger.log).toHaveBeenCalledWith('emailSent', expect.any(Object));
        });
    });

    describe('parseTemplate', () => {
        it('should replace variables correctly', () => {
            const template: EmailTemplate = {
                id: 't1',
                name: 'Welcome',
                subject_template: 'Hello {{name}}',
                body_template: 'Welcome to {{company}}!',
                variables: ['name', 'company'],
                category: 'Onboarding',
                created: '',
                updated: ''
            };

            const variables = {
                name: 'John',
                company: 'Acme Corp'
            };

            const result = crmEmailService.parseTemplate(template, variables);

            expect(result.subject).toBe('Hello John');
            expect(result.body).toBe('Welcome to Acme Corp!');
        });
    });

    describe('getEmailHistory', () => {
        it('should fetch emails for a contact', async () => {
            const contactId = 'c1';
            const mockEmails = [{ id: 'e1', subject: 'Hi' }];

            const getFullListMock = vi.fn().mockResolvedValue(mockEmails);
            (pb.collection as any).mockReturnValue({
                getFullList: getFullListMock,
            });

            const result = await crmEmailService.getEmailHistory(contactId);

            expect(getFullListMock).toHaveBeenCalledWith(expect.objectContaining({
                filter: `contact_id="${contactId}"`
            }));
            expect(result).toEqual(mockEmails);
        });
    });
});
