/**
 * Audit Types
 * Proper types for audit logging
 */

export interface AuditMetadata {
    ipAddress?: string;
    userAgent?: string;
    resourceType?: string;
    resourceId?: string;
    changes?: {
        field: string;
        oldValue: string | number | boolean | null;
        newValue: string | number | boolean | null;
    }[];
    additionalData?: {
        [key: string]: string | number | boolean | null | undefined;
    };
}
