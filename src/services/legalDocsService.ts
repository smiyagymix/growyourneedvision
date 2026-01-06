import pb from '../lib/pocketbase';
import { auditLog } from './auditLogger';
import { isMockEnv } from '../utils/mockData';

export interface LegalDocument {
    id: string;
    title: string;
    type: 'terms' | 'privacy' | 'gdpr' | 'cookie' | 'acceptable_use';
    version: string;
    status: 'draft' | 'published' | 'archived';
    content: string;
    updated_by: string;
    created: string;
    updated: string;
}

// Mock data
const MOCK_LEGAL_DOCS: LegalDocument[] = [
    {
        id: 'legal-1',
        title: 'Terms of Service',
        type: 'terms',
        version: '2.1.0',
        status: 'published',
        content: `# Terms of Service

**Last updated: January 1, 2024**

## 1. Introduction
Welcome to Grow Your Need. These Terms of Service govern your use of our platform.

## 2. Acceptance of Terms
By accessing our service, you agree to be bound by these terms.

## 3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials.

## 4. Acceptable Use
You agree not to use the service for any unlawful purposes.

## 5. Termination
We reserve the right to terminate accounts that violate these terms.`,
        updated_by: 'admin-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-15T00:00:00Z'
    },
    {
        id: 'legal-2',
        title: 'Privacy Policy',
        type: 'privacy',
        version: '1.5.0',
        status: 'published',
        content: `# Privacy Policy

**Last updated: January 1, 2024**

## 1. Information We Collect
We collect information you provide directly to us.

## 2. How We Use Information
We use the information to provide and improve our services.

## 3. Information Sharing
We do not sell your personal information to third parties.

## 4. Data Security
We implement appropriate security measures to protect your data.

## 5. Your Rights
You have the right to access, update, or delete your personal information.`,
        updated_by: 'admin-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-10T00:00:00Z'
    },
    {
        id: 'legal-3',
        title: 'GDPR Compliance',
        type: 'gdpr',
        version: '1.0.0',
        status: 'published',
        content: `# GDPR Compliance

**Last updated: January 1, 2024**

## Data Protection Rights
Under GDPR, EU residents have specific rights regarding their personal data.

## Data Processing
We process data in accordance with GDPR requirements.

## Data Retention
We retain personal data only as long as necessary.`,
        updated_by: 'admin-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-05T00:00:00Z'
    },
    {
        id: 'legal-4',
        title: 'Cookie Policy',
        type: 'cookie',
        version: '1.2.0',
        status: 'published',
        content: `# Cookie Policy

**Last updated: January 1, 2024**

## What Are Cookies
Cookies are small text files stored on your device.

## Types of Cookies We Use
- Essential cookies
- Analytics cookies
- Preference cookies

## Managing Cookies
You can control cookies through your browser settings.`,
        updated_by: 'admin-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-08T00:00:00Z'
    },
    {
        id: 'legal-5',
        title: 'Acceptable Use Policy',
        type: 'acceptable_use',
        version: '1.1.0',
        status: 'published',
        content: `# Acceptable Use Policy

**Last updated: January 1, 2024**

## Prohibited Activities
- Unauthorized access to systems
- Distribution of malware
- Harassment or abuse

## Enforcement
Violations may result in account suspension or termination.`,
        updated_by: 'admin-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-12T00:00:00Z'
    },
    {
        id: 'legal-6',
        title: 'Terms of Service (Draft)',
        type: 'terms',
        version: '3.0.0-draft',
        status: 'draft',
        content: `# Terms of Service (Draft)

**Draft version - not yet published**

This is the upcoming version of our Terms of Service with updated provisions.`,
        updated_by: 'admin-1',
        created: '2024-02-01T00:00:00Z',
        updated: '2024-02-05T00:00:00Z'
    }
];

class LegalDocumentsService {
    private collection = 'legal_documents';

    async getAll(): Promise<LegalDocument[]> {
        if (isMockEnv()) {
            return [...MOCK_LEGAL_DOCS].sort((a, b) => 
                new Date(b.updated).getTime() - new Date(a.updated).getTime()
            );
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                sort: '-updated',
            });
            return records as unknown as LegalDocument[];
        } catch (error) {
            console.error('Failed to fetch legal documents:', error);
            return MOCK_LEGAL_DOCS;
        }
    }

    async getById(id: string): Promise<LegalDocument | null> {
        if (isMockEnv()) {
            return MOCK_LEGAL_DOCS.find(d => d.id === id) || null;
        }

        try {
            const record = await pb.collection(this.collection).getOne(id);
            return record as unknown as LegalDocument;
        } catch (error) {
            console.error(`Failed to fetch legal document ${id}:`, error);
            return null;
        }
    }

    async create(data: Omit<LegalDocument, 'id' | 'created' | 'updated'>): Promise<LegalDocument> {
        if (isMockEnv()) {
            const newDoc: LegalDocument = {
                ...data,
                id: `legal-${Date.now()}`,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            MOCK_LEGAL_DOCS.push(newDoc);
            return newDoc;
        }

        try {
            const record = await pb.collection(this.collection).create(data);
            await auditLog.log('legal_doc.create', { document_id: record.id, title: data.title }, 'info');
            return record as unknown as LegalDocument;
        } catch (error) {
            console.error('Failed to create legal document:', error);
            throw new Error('Failed to create legal document');
        }
    }

    async update(id: string, data: Partial<LegalDocument>): Promise<LegalDocument | null> {
        if (isMockEnv()) {
            const doc = MOCK_LEGAL_DOCS.find(d => d.id === id);
            if (doc) {
                Object.assign(doc, data, { updated: new Date().toISOString() });
                return doc;
            }
            return null;
        }

        try {
            const record = await pb.collection(this.collection).update(id, data);
            await auditLog.log('legal_doc.update', { document_id: id, changes: data }, 'info');
            return record as unknown as LegalDocument;
        } catch (error) {
            console.error(`Failed to update legal document ${id}:`, error);
            throw new Error('Failed to update legal document');
        }
    }

    async publish(id: string, newVersion: string): Promise<LegalDocument | null> {
        if (isMockEnv()) {
            const doc = MOCK_LEGAL_DOCS.find(d => d.id === id);
            if (doc) {
                doc.status = 'published';
                doc.version = newVersion;
                doc.updated = new Date().toISOString();
                return doc;
            }
            return null;
        }

        try {
            const record = await pb.collection(this.collection).update(id, {
                status: 'published',
                version: newVersion
            });
            await auditLog.log('legal_doc.publish', { document_id: id, version: newVersion }, 'warning');
            return record as unknown as LegalDocument;
        } catch (error) {
            console.error(`Failed to publish legal document ${id}:`, error);
            throw new Error('Failed to publish legal document');
        }
    }

    async archive(id: string): Promise<LegalDocument | null> {
        if (isMockEnv()) {
            const doc = MOCK_LEGAL_DOCS.find(d => d.id === id);
            if (doc) {
                doc.status = 'archived';
                doc.updated = new Date().toISOString();
                return doc;
            }
            return null;
        }

        try {
            const record = await pb.collection(this.collection).update(id, {
                status: 'archived'
            });
            await auditLog.log('legal_doc.archive', { document_id: id }, 'info');
            return record as unknown as LegalDocument;
        } catch (error) {
            console.error(`Failed to archive legal document ${id}:`, error);
            throw new Error('Failed to archive legal document');
        }
    }

    async delete(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_LEGAL_DOCS.findIndex(d => d.id === id);
            if (index !== -1) {
                MOCK_LEGAL_DOCS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection(this.collection).delete(id);
            await auditLog.log('legal_doc.delete', { document_id: id }, 'warning');
            return true;
        } catch (error) {
            console.error(`Failed to delete legal document ${id}:`, error);
            return false;
        }
    }

    async getByType(type: LegalDocument['type']): Promise<LegalDocument[]> {
        if (isMockEnv()) {
            return MOCK_LEGAL_DOCS
                .filter(d => d.type === type)
                .sort((a, b) => a.version.localeCompare(b.version) * -1);
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: `type = "${type}"`,
                sort: '-version',
            });
            return records as unknown as LegalDocument[];
        } catch (error) {
            console.error(`Failed to fetch ${type} documents:`, error);
            return MOCK_LEGAL_DOCS.filter(d => d.type === type);
        }
    }

    async getPublished(): Promise<LegalDocument[]> {
        if (isMockEnv()) {
            return MOCK_LEGAL_DOCS
                .filter(d => d.status === 'published')
                .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "published"',
                sort: '-updated',
            });
            return records as unknown as LegalDocument[];
        } catch (error) {
            console.error('Failed to fetch published documents:', error);
            return MOCK_LEGAL_DOCS.filter(d => d.status === 'published');
        }
    }

    async getDrafts(): Promise<LegalDocument[]> {
        if (isMockEnv()) {
            return MOCK_LEGAL_DOCS.filter(d => d.status === 'draft');
        }

        try {
            const records = await pb.collection(this.collection).getFullList({
                filter: 'status = "draft"',
                sort: '-updated',
            });
            return records as unknown as LegalDocument[];
        } catch (error) {
            console.error('Failed to fetch draft documents:', error);
            return MOCK_LEGAL_DOCS.filter(d => d.status === 'draft');
        }
    }

    async getLatestByType(type: LegalDocument['type']): Promise<LegalDocument | null> {
        if (isMockEnv()) {
            const docs = MOCK_LEGAL_DOCS
                .filter(d => d.type === type && d.status === 'published')
                .sort((a, b) => a.version.localeCompare(b.version) * -1);
            return docs[0] || null;
        }

        try {
            const records = await pb.collection(this.collection).getList(1, 1, {
                filter: `type = "${type}" && status = "published"`,
                sort: '-version',
            });
            return records.items[0] as unknown as LegalDocument || null;
        } catch (error) {
            console.error(`Failed to fetch latest ${type} document:`, error);
            return null;
        }
    }

    // Get document types
    getDocumentTypes(): LegalDocument['type'][] {
        return ['terms', 'privacy', 'gdpr', 'cookie', 'acceptable_use'];
    }

    // Get document statuses
    getDocumentStatuses(): LegalDocument['status'][] {
        return ['draft', 'published', 'archived'];
    }
}

export const legalDocsService = new LegalDocumentsService();
