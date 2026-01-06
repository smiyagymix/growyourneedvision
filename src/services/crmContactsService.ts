/**
 * CRM Contacts Service
 * Manage contacts with full CRUD operations, tags, custom fields, and activity tracking
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';
import { isMockEnv } from '../utils/mockData';
import { RecordModel } from 'pocketbase';

export interface CRMContact extends RecordModel {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    title?: string;
    status: 'lead' | 'prospect' | 'customer' | 'inactive';
    source?: 'website' | 'referral' | 'cold_call' | 'event' | 'social' | 'other';
    tags?: string[];
    custom_fields?: Record<string, unknown>;
    notes?: string;
    last_contact?: string;
    next_follow_up?: string;
    assigned_to?: string;
    lifecycle_stage?: 'subscriber' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer';
    lead_score?: number;
    created_by: string;
    created: string;
    updated: string;
}

export interface ContactFilters {
    status?: CRMContact['status'];
    source?: CRMContact['source'];
    company?: string;
    tags?: string[];
    search?: string;
    assigned_to?: string;
    lifecycle_stage?: CRMContact['lifecycle_stage'];
}

export interface ContactActivity {
    id: string;
    contact_id: string;
    type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal';
    description: string;
    performed_by: string;
    performed_at: string;
}

const MOCK_CONTACTS: CRMContact[] = [
    {
        id: 'contact-1',
        collectionId: 'mock',
        collectionName: 'crm_contacts',
        first_name: 'John',
        last_name: 'Anderson',
        email: 'john.anderson@techcorp.com',
        phone: '+1 555-123-4567',
        company: 'TechCorp Inc.',
        title: 'CTO',
        status: 'customer',
        source: 'referral',
        tags: ['enterprise', 'decision-maker', 'tech'],
        lifecycle_stage: 'customer',
        lead_score: 85,
        last_contact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Key account - renewal coming up in Q2',
        created_by: 'user-1',
        created: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'contact-2',
        collectionId: 'mock',
        collectionName: 'crm_contacts',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        email: 'sarah.m@startup.io',
        phone: '+1 555-987-6543',
        company: 'StartupIO',
        title: 'Head of Operations',
        status: 'prospect',
        source: 'website',
        tags: ['startup', 'high-growth', 'education'],
        lifecycle_stage: 'sql',
        lead_score: 72,
        last_contact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        next_follow_up: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: 'user-1',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'contact-3',
        collectionId: 'mock',
        collectionName: 'crm_contacts',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'mchen@innovate.edu',
        phone: '+1 555-456-7890',
        company: 'Innovate Academy',
        title: 'Director',
        status: 'lead',
        source: 'event',
        tags: ['education', 'k12'],
        lifecycle_stage: 'lead',
        lead_score: 45,
        created_by: 'user-2',
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'contact-4',
        collectionId: 'mock',
        collectionName: 'crm_contacts',
        first_name: 'Emily',
        last_name: 'Thompson',
        email: 'ethompson@oldcorp.com',
        company: 'OldCorp Ltd',
        title: 'Manager',
        status: 'inactive',
        source: 'cold_call',
        tags: ['churned'],
        lifecycle_stage: 'customer',
        lead_score: 20,
        last_contact: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Contract ended - moved to competitor',
        created_by: 'user-1',
        created: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_ACTIVITIES: ContactActivity[] = [
    {
        id: 'activity-1',
        contact_id: 'contact-1',
        type: 'call',
        description: 'Quarterly review call - discussed renewal terms',
        performed_by: 'user-1',
        performed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'activity-2',
        contact_id: 'contact-2',
        type: 'email',
        description: 'Sent product demo follow-up',
        performed_by: 'user-1',
        performed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'activity-3',
        contact_id: 'contact-2',
        type: 'meeting',
        description: 'Product demo presentation',
        performed_by: 'user-1',
        performed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
];

class CRMContactsService {
    private collection = 'crm_contacts';
    private activitiesCollection = 'crm_contact_activities';

    /**
     * Build filter string from ContactFilters
     */
    private buildFilterString(filters?: ContactFilters): string {
        if (!filters) return '';

        const conditions: string[] = [];

        if (filters.status) {
            conditions.push(`status = "${filters.status}"`);
        }

        if (filters.source) {
            conditions.push(`source = "${filters.source}"`);
        }

        if (filters.company) {
            conditions.push(`company ~ "${filters.company}"`);
        }

        if (filters.assigned_to) {
            conditions.push(`assigned_to = "${filters.assigned_to}"`);
        }

        if (filters.lifecycle_stage) {
            conditions.push(`lifecycle_stage = "${filters.lifecycle_stage}"`);
        }

        if (filters.search) {
            conditions.push(`(first_name ~ "${filters.search}" || last_name ~ "${filters.search}" || email ~ "${filters.search}" || company ~ "${filters.search}")`);
        }

        return conditions.join(' && ');
    }

    /**
     * Filter contacts by filters (for mock)
     */
    private filterMockContacts(contacts: CRMContact[], filters?: ContactFilters): CRMContact[] {
        if (!filters) return contacts;

        return contacts.filter(contact => {
            if (filters.status && contact.status !== filters.status) return false;
            if (filters.source && contact.source !== filters.source) return false;
            if (filters.lifecycle_stage && contact.lifecycle_stage !== filters.lifecycle_stage) return false;
            if (filters.assigned_to && contact.assigned_to !== filters.assigned_to) return false;
            if (filters.company && !contact.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matches =
                    contact.first_name.toLowerCase().includes(search) ||
                    contact.last_name.toLowerCase().includes(search) ||
                    contact.email.toLowerCase().includes(search) ||
                    contact.company?.toLowerCase().includes(search);
                if (!matches) return false;
            }
            return true;
        });
    }

    /**
     * Get all contacts with optional filters
     */
    async getAllContacts(filters?: ContactFilters): Promise<CRMContact[]> {
        if (isMockEnv()) {
            return this.filterMockContacts([...MOCK_CONTACTS], filters);
        }

        try {
            const filterString = this.buildFilterString(filters);
            const contacts = await pb.collection(this.collection).getFullList({
                filter: filterString,
                sort: '-created',
                requestKey: null
            });
            return contacts as unknown as CRMContact[];
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    }

    /**
     * Get paginated contacts
     */
    async getContacts(page = 1, perPage = 25, filters?: ContactFilters): Promise<{
        items: CRMContact[];
        totalItems: number;
        totalPages: number;
    }> {
        if (isMockEnv()) {
            const filtered = this.filterMockContacts([...MOCK_CONTACTS], filters);
            return {
                items: filtered.slice((page - 1) * perPage, page * perPage),
                totalItems: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage)
            };
        }

        try {
            const filterString = this.buildFilterString(filters);
            const result = await pb.collection(this.collection).getList(page, perPage, {
                filter: filterString,
                sort: '-created',
                requestKey: null
            });
            return {
                items: result.items as unknown as CRMContact[],
                totalItems: result.totalItems,
                totalPages: result.totalPages
            };
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return { items: [], totalItems: 0, totalPages: 0 };
        }
    }

    /**
     * Get a contact by ID
     */
    async getContactById(id: string): Promise<CRMContact | null> {
        if (isMockEnv()) {
            return MOCK_CONTACTS.find(c => c.id === id) || null;
        }

        try {
            const contact = await pb.collection(this.collection).getOne(id, {
                requestKey: null
            });
            return contact as unknown as CRMContact;
        } catch (error) {
            console.error('Error fetching contact:', error);
            return null;
        }
    }

    /**
     * Create a new contact
     */
    async createContact(data: Partial<CRMContact>): Promise<CRMContact | null> {
        if (isMockEnv()) {
            const newContact: CRMContact = {
                id: `contact-${Date.now()}`,
                collectionId: 'mock',
                collectionName: 'crm_contacts',
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone: data.phone,
                company: data.company,
                title: data.title,
                status: data.status || 'lead',
                source: data.source,
                tags: data.tags || [],
                custom_fields: data.custom_fields,
                notes: data.notes,
                lifecycle_stage: data.lifecycle_stage || 'lead',
                lead_score: data.lead_score || 0,
                assigned_to: data.assigned_to,
                created_by: data.created_by || 'user-1',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_CONTACTS.unshift(newContact);
            return newContact;
        }

        try {
            const contact = await pb.collection(this.collection).create(data);

            await auditLogger.log({
                action: 'contactCreate',
                resource_type: 'crm_contact',
                resource_id: contact.id,
                severity: 'info',
                metadata: {
                    name: `${contact.first_name} ${contact.last_name}`,
                    email: contact.email
                }
            });

            return contact as unknown as CRMContact;
        } catch (error) {
            console.error('Error creating contact:', error);
            return null;
        }
    }

    /**
     * Update a contact
     */
    async updateContact(id: string, data: Partial<CRMContact>): Promise<CRMContact | null> {
        if (isMockEnv()) {
            const idx = MOCK_CONTACTS.findIndex(c => c.id === id);
            if (idx >= 0) {
                MOCK_CONTACTS[idx] = {
                    ...MOCK_CONTACTS[idx],
                    ...data,
                    updated: new Date().toISOString()
                };
                return MOCK_CONTACTS[idx];
            }
            return null;
        }

        try {
            const contact = await pb.collection(this.collection).update(id, data);

            await auditLogger.log({
                action: 'contactUpdate',
                resource_type: 'crm_contact',
                resource_id: id,
                severity: 'info',
                metadata: {
                    changes: Object.keys(data)
                }
            });

            return contact as unknown as CRMContact;
        } catch (error) {
            console.error('Error updating contact:', error);
            return null;
        }
    }

    /**
     * Delete a contact
     */
    async deleteContact(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_CONTACTS.findIndex(c => c.id === id);
            if (idx >= 0) {
                MOCK_CONTACTS.splice(idx, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.collection).delete(id);

            await auditLogger.log({
                action: 'contactDelete',
                resource_type: 'crm_contact',
                resource_id: id,
                severity: 'warning'
            });

            return true;
        } catch (error) {
            console.error('Error deleting contact:', error);
            return false;
        }
    }

    /**
     * Search contacts by query
     */
    async searchContacts(query: string): Promise<CRMContact[]> {
        return this.getAllContacts({ search: query });
    }

    /**
     * Add tag to contact
     */
    async addTag(contactId: string, tag: string): Promise<CRMContact | null> {
        const contact = await this.getContactById(contactId);
        if (!contact) return null;

        const tags = [...(contact.tags || [])];
        if (!tags.includes(tag)) {
            tags.push(tag);
            return this.updateContact(contactId, { tags });
        }
        return contact;
    }

    /**
     * Remove tag from contact
     */
    async removeTag(contactId: string, tag: string): Promise<CRMContact | null> {
        const contact = await this.getContactById(contactId);
        if (!contact) return null;

        const tags = (contact.tags || []).filter(t => t !== tag);
        return this.updateContact(contactId, { tags });
    }

    /**
     * Bulk add tag to multiple contacts
     */
    async bulkAddTag(contactIds: string[], tag: string): Promise<number> {
        let updated = 0;
        for (const id of contactIds) {
            const result = await this.addTag(id, tag);
            if (result) updated++;
        }
        return updated;
    }

    /**
     * Update last contact date
     */
    async updateLastContact(contactId: string): Promise<CRMContact | null> {
        return this.updateContact(contactId, {
            last_contact: new Date().toISOString()
        });
    }

    /**
     * Get contacts by status
     */
    async getContactsByStatus(status: CRMContact['status']): Promise<CRMContact[]> {
        return this.getAllContacts({ status });
    }

    /**
     * Update contact lead score
     */
    async updateLeadScore(contactId: string, score: number): Promise<CRMContact | null> {
        return this.updateContact(contactId, { lead_score: Math.max(0, Math.min(100, score)) });
    }

    /**
     * Increment lead score
     */
    async incrementLeadScore(contactId: string, points: number): Promise<CRMContact | null> {
        const contact = await this.getContactById(contactId);
        if (!contact) return null;

        const newScore = Math.max(0, Math.min(100, (contact.lead_score || 0) + points));
        return this.updateContact(contactId, { lead_score: newScore });
    }

    /**
     * Get contact activities
     */
    async getContactActivities(contactId: string): Promise<ContactActivity[]> {
        if (isMockEnv()) {
            return MOCK_ACTIVITIES.filter(a => a.contact_id === contactId);
        }

        try {
            const activities = await pb.collection(this.activitiesCollection).getFullList({
                filter: `contact_id = "${contactId}"`,
                sort: '-performed_at',
                requestKey: null
            });
            return activities as unknown as ContactActivity[];
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    }

    /**
     * Log contact activity
     */
    async logActivity(contactId: string, type: ContactActivity['type'], description: string, performedBy: string): Promise<ContactActivity | null> {
        const activity: ContactActivity = {
            id: `activity-${Date.now()}`,
            contact_id: contactId,
            type,
            description,
            performed_by: performedBy,
            performed_at: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_ACTIVITIES.unshift(activity);
            // Also update last_contact
            await this.updateLastContact(contactId);
            return activity;
        }

        try {
            const result = await pb.collection(this.activitiesCollection).create(activity);
            // Update last_contact
            await this.updateLastContact(contactId);
            return result as unknown as ContactActivity;
        } catch (error) {
            console.error('Error logging activity:', error);
            return null;
        }
    }

    /**
     * Get contacts due for follow-up
     */
    async getContactsDueForFollowUp(): Promise<CRMContact[]> {
        const now = new Date().toISOString();

        if (isMockEnv()) {
            return MOCK_CONTACTS.filter(c => c.next_follow_up && c.next_follow_up <= now);
        }

        try {
            const contacts = await pb.collection(this.collection).getFullList({
                filter: `next_follow_up <= "${now}"`,
                sort: 'next_follow_up',
                requestKey: null
            });
            return contacts as unknown as CRMContact[];
        } catch (error) {
            console.error('Error fetching follow-up contacts:', error);
            return [];
        }
    }

    /**
     * Get contact statistics
     */
    async getContactStats(): Promise<{
        total: number;
        by_status: Record<string, number>;
        by_source: Record<string, number>;
        by_lifecycle: Record<string, number>;
        recent: number;
        avg_lead_score: number;
    }> {
        const contacts = await this.getAllContacts();

        const by_status: Record<string, number> = { lead: 0, prospect: 0, customer: 0, inactive: 0 };
        const by_source: Record<string, number> = {};
        const by_lifecycle: Record<string, number> = {};
        let totalScore = 0;
        let scoreCount = 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recent = 0;

        for (const contact of contacts) {
            by_status[contact.status] = (by_status[contact.status] || 0) + 1;

            if (contact.source) {
                by_source[contact.source] = (by_source[contact.source] || 0) + 1;
            }

            if (contact.lifecycle_stage) {
                by_lifecycle[contact.lifecycle_stage] = (by_lifecycle[contact.lifecycle_stage] || 0) + 1;
            }

            if (contact.lead_score !== undefined) {
                totalScore += contact.lead_score;
                scoreCount++;
            }

            if (new Date(contact.created) > thirtyDaysAgo) {
                recent++;
            }
        }

        return {
            total: contacts.length,
            by_status,
            by_source,
            by_lifecycle,
            recent,
            avg_lead_score: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
        };
    }

    /**
     * Import contacts from CSV data
     */
    async importContacts(csvData: string, createdBy: string): Promise<{ success: number; failed: number; errors: string[] }> {
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return { success: 0, failed: 0, errors: ['No data to import'] };
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['email'];
        const hasRequired = requiredHeaders.every(h => headers.includes(h));

        if (!hasRequired) {
            return { success: 0, failed: 0, errors: ['Missing required column: email'] };
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const contact: Partial<CRMContact> = { created_by: createdBy, status: 'lead' };

            headers.forEach((header, idx) => {
                const value = values[idx];
                if (value) {
                    switch (header) {
                        case 'first_name': contact.first_name = value; break;
                        case 'last_name': contact.last_name = value; break;
                        case 'email': contact.email = value; break;
                        case 'phone': contact.phone = value; break;
                        case 'company': contact.company = value; break;
                        case 'title': contact.title = value; break;
                        case 'status': contact.status = value as CRMContact['status']; break;
                        case 'source': contact.source = value as CRMContact['source']; break;
                    }
                }
            });

            if (!contact.email) {
                failed++;
                errors.push(`Line ${i + 1}: Missing email`);
                continue;
            }

            try {
                await this.createContact(contact);
                success++;
            } catch (error) {
                failed++;
                errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return { success, failed, errors };
    }

    /**
     * Export contacts to CSV
     */
    async exportContacts(filters?: ContactFilters): Promise<string> {
        const contacts = await this.getAllContacts(filters);

        const headers = ['first_name', 'last_name', 'email', 'phone', 'company', 'title', 'status', 'source', 'lead_score', 'tags'];
        const csvLines = [headers.join(',')];

        for (const contact of contacts) {
            const values = headers.map(h => {
                const value = contact[h as keyof CRMContact];
                if (Array.isArray(value)) return value.join(';');
                return value?.toString() || '';
            });
            // Escape commas in values
            csvLines.push(values.map(v => v.includes(',') ? `"${v}"` : v).join(','));
        }

        return csvLines.join('\n');
    }

    /**
     * Merge duplicate contacts
     */
    async mergeContacts(primaryId: string, duplicateIds: string[]): Promise<CRMContact | null> {
        const primary = await this.getContactById(primaryId);
        if (!primary) return null;

        // Collect tags from all duplicates
        const allTags = new Set(primary.tags || []);

        for (const dupId of duplicateIds) {
            const dup = await this.getContactById(dupId);
            if (dup) {
                // Merge tags
                dup.tags?.forEach(tag => allTags.add(tag));
                // Delete duplicate
                await this.deleteContact(dupId);
            }
        }

        // Update primary with merged tags
        return this.updateContact(primaryId, { tags: Array.from(allTags) });
    }
}

export const crmContactsService = new CRMContactsService();
