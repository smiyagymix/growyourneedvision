/**
 * Incident Response Types
 * Proper types for incident management
 */

export interface IncidentEventData {
    errorCode?: string;
    errorMessage?: string;
    stackTrace?: string;
    userId?: string;
    tenantId?: string;
    resourceId?: string;
    resourceType?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: string | number | boolean | undefined;
}
