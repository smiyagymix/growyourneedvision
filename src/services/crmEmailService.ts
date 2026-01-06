/**
 * CRM Email Integration Service
 * Send emails from CRM with templates and tracking
 */

import pb from '../lib/pocketbase';
import { auditLogger } from './auditLogger';
import { isMockEnv } from '../utils/mockData';

export interface Email {
    id: string;
    contact_id: string;
    deal_id?: string;
    subject: string;
    body: string;
    template_id?: string;
    status: 'draft' | 'sent' | 'delivered' | 'opened' | 'clicked';
    sent_at?: string;
    opened_at?: string;
    tracking_enabled: boolean;
    created: string;
    updated: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject_template: string;
    body_template: string;
    variables: string[];
    category: string;
    created: string;
    updated: string;
}

export interface EmailDraft {
    id: string;
    contact_id: string;
    subject: string;
    body: string;
    created: string;
    updated: string;
}

// Mock data for development/testing
const MOCK_TEMPLATES: EmailTemplate[] = [
    {
        id: 'template-1',
        name: 'Welcome Email',
        subject_template: 'Welcome to Grow Your Need, {{first_name}}!',
        body_template: `Dear {{first_name}},\n\nWelcome aboard! We're thrilled to have {{company}} join the Grow Your Need family.\n\nYour journey to transforming education starts now.\n\nBest regards,\nThe Grow Your Need Team`,
        variables: ['first_name', 'company'],
        category: 'onboarding',
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'template-2',
        name: 'Demo Follow-up',
        subject_template: 'Thank you for your time, {{first_name}} - Next Steps',
        body_template: `Hi {{first_name}},\n\nThank you for taking the time to see our platform demo today. It was great learning more about {{company}}'s goals.\n\nLooking forward to partnering with you!\n\nBest,\nYour Grow Your Need Representative`,
        variables: ['first_name', 'company'],
        category: 'sales',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'template-3',
        name: 'Proposal Submission',
        subject_template: 'Your Custom Proposal from Grow Your Need',
        body_template: `Dear {{first_name}},\n\nPlease find attached your customized proposal for {{company}}.\n\nThis proposal is valid for 30 days.\n\nBest regards,\nYour Grow Your Need Team`,
        variables: ['first_name', 'company'],
        category: 'sales',
        created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'template-4',
        name: 'Check-in Email',
        subject_template: 'Checking in - How is everything going, {{first_name}}?',
        body_template: `Hi {{first_name}},\n\nI hope this message finds you well! I wanted to check in and see how things are going at {{company}}.\n\nLooking forward to hearing from you!\n\nBest,\nYour Grow Your Need Representative`,
        variables: ['first_name', 'company'],
        category: 'nurture',
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_EMAILS: Email[] = [
    {
        id: 'email-1',
        contact_id: 'contact-1',
        subject: 'Welcome to Grow Your Need, John!',
        body: 'Dear John, Welcome aboard! We are thrilled to have TechCorp Inc. join the Grow Your Need family...',
        status: 'opened',
        sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        opened_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        tracking_enabled: true,
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'email-2',
        contact_id: 'contact-2',
        subject: 'Thank you for your time, Sarah - Next Steps',
        body: 'Hi Sarah, Thank you for taking the time to see our platform demo today...',
        status: 'sent',
        sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tracking_enabled: true,
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_DRAFTS: EmailDraft[] = [];

class CRMEmailService {
    private emailCollection = 'crm_emails';
    private templateCollection = 'email_templates';
    private draftCollection = 'crm_email_drafts';

    async sendEmail(to: string, subject: string, body: string, options?: {
        contactId?: string;
        dealId?: string;
        trackingEnabled?: boolean;
    }): Promise<Email> {
        const email: Email = {
            id: `email-${Date.now()}`,
            contact_id: options?.contactId || '',
            deal_id: options?.dealId,
            subject,
            body,
            status: 'sent',
            sent_at: new Date().toISOString(),
            tracking_enabled: options?.trackingEnabled ?? true,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_EMAILS.unshift(email);
            return email;
        }

        try {
            const created = await pb.collection(this.emailCollection).create<Email>({
                contact_id: options?.contactId,
                deal_id: options?.dealId,
                subject,
                body,
                status: 'sent',
                sent_at: new Date().toISOString(),
                tracking_enabled: options?.trackingEnabled ?? true
            });

            await auditLogger.log({
                action: 'emailSent',
                resource_type: 'crm_email',
                resource_id: created.id,
                severity: 'info',
                metadata: { to, subject }
            });

            return created;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async saveDraft(contactId: string, subject: string, body: string): Promise<EmailDraft> {
        const draft: EmailDraft = {
            id: `draft-${Date.now()}`,
            contact_id: contactId,
            subject,
            body,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            const existingIdx = MOCK_DRAFTS.findIndex(d => d.contact_id === contactId);
            if (existingIdx >= 0) {
                MOCK_DRAFTS[existingIdx] = draft;
            } else {
                MOCK_DRAFTS.unshift(draft);
            }
            return draft;
        }

        try {
            const existing = await pb.collection(this.draftCollection).getFirstListItem(`contact_id="${contactId}"`).catch(() => null);
            
            if (existing) {
                return await pb.collection(this.draftCollection).update<EmailDraft>(existing.id, {
                    subject,
                    body,
                    updated: new Date().toISOString()
                });
            }

            return await pb.collection(this.draftCollection).create<EmailDraft>(draft);
        } catch (error) {
            console.error('Error saving draft:', error);
            throw error;
        }
    }

    async getDraft(contactId: string): Promise<EmailDraft | null> {
        if (isMockEnv()) {
            return MOCK_DRAFTS.find(d => d.contact_id === contactId) || null;
        }

        try {
            return await pb.collection(this.draftCollection).getFirstListItem<EmailDraft>(`contact_id="${contactId}"`);
        } catch {
            return null;
        }
    }

    async getEmailTemplates(): Promise<EmailTemplate[]> {
        if (isMockEnv()) {
            return [...MOCK_TEMPLATES];
        }

        try {
            return await pb.collection(this.templateCollection).getFullList<EmailTemplate>({
                sort: 'name'
            });
        } catch (error) {
            console.error('Error fetching templates:', error);
            return [...MOCK_TEMPLATES];
        }
    }

    async createTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
        const newTemplate: EmailTemplate = {
            id: `template-${Date.now()}`,
            name: template.name || 'Untitled Template',
            subject_template: template.subject_template || '',
            body_template: template.body_template || '',
            variables: template.variables || [],
            category: template.category || 'general',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_TEMPLATES.unshift(newTemplate);
            return newTemplate;
        }

        try {
            const created = await pb.collection(this.templateCollection).create<EmailTemplate>(template);
            await auditLogger.log({
                action: 'emailTemplateCreate',
                resource_type: 'crm_email_template',
                resource_id: created.id,
                severity: 'info',
                metadata: { name: created.name }
            });
            return created;
        } catch (error) {
            console.error('Error creating template:', error);
            throw error;
        }
    }

    async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
        if (isMockEnv()) {
            const idx = MOCK_TEMPLATES.findIndex(t => t.id === id);
            if (idx >= 0) {
                MOCK_TEMPLATES[idx] = { ...MOCK_TEMPLATES[idx], ...data, updated: new Date().toISOString() };
                return MOCK_TEMPLATES[idx];
            }
            throw new Error('Template not found');
        }

        try {
            return await pb.collection(this.templateCollection).update<EmailTemplate>(id, { ...data, updated: new Date().toISOString() });
        } catch (error) {
            console.error('Error updating template:', error);
            throw error;
        }
    }

    async deleteTemplate(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_TEMPLATES.findIndex(t => t.id === id);
            if (idx >= 0) { MOCK_TEMPLATES.splice(idx, 1); return true; }
            return false;
        }

        try {
            await pb.collection(this.templateCollection).delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting template:', error);
            return false;
        }
    }

    parseTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
        let subject = template.subject_template;
        let body = template.body_template;

        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
            body = body.replace(new RegExp(placeholder, 'g'), value);
        });

        return { subject, body };
    }

    async trackEmailOpen(emailId: string): Promise<Email> {
        if (isMockEnv()) {
            const idx = MOCK_EMAILS.findIndex(e => e.id === emailId);
            if (idx >= 0) {
                MOCK_EMAILS[idx] = { ...MOCK_EMAILS[idx], status: 'opened', opened_at: new Date().toISOString(), updated: new Date().toISOString() };
                return MOCK_EMAILS[idx];
            }
            throw new Error('Email not found');
        }

        try {
            return await pb.collection(this.emailCollection).update<Email>(emailId, {
                status: 'opened',
                opened_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error tracking email open:', error);
            throw error;
        }
    }

    async getEmailHistory(contactId: string): Promise<Email[]> {
        if (isMockEnv()) {
            return MOCK_EMAILS.filter(e => e.contact_id === contactId);
        }

        try {
            return await pb.collection(this.emailCollection).getFullList<Email>({
                filter: `contact_id="${contactId}"`,
                sort: '-sent_at'
            });
        } catch (error) {
            console.error('Error fetching email history:', error);
            return [];
        }
    }

    async deleteDraft(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const idx = MOCK_DRAFTS.findIndex(d => d.id === id);
            if (idx >= 0) { MOCK_DRAFTS.splice(idx, 1); return true; }
            return false;
        }

        try {
            await pb.collection(this.draftCollection).delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting draft:', error);
            throw error;
        }
    }
}

export const crmEmailService = new CRMEmailService();
