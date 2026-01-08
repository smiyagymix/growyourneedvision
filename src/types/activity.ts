/**
 * Activity Types
 * Proper types for activity tracking and logging
 */

export interface ActivityMetadata {
    targetId?: string;
    targetName?: string;
    actionType?: string;
    resourceId?: string;
    resourceType?: string;
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: string | number | boolean | undefined;
}
