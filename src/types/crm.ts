/**
 * CRM Types
 * Proper types for CRM contacts and custom fields
 */

export interface CustomFields {
    industry?: string;
    companySize?: string;
    website?: string;
    linkedin?: string;
    twitter?: string;
    customAttribute1?: string;
    customAttribute2?: string;
    customAttribute3?: string;
    [key: string]: string | number | boolean | undefined;
}
