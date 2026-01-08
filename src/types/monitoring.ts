/**
 * Monitoring Types
 * Proper types for monitoring and alerting
 */

export interface AlertMetadata {
    service?: string;
    endpoint?: string;
    errorCode?: string;
    userId?: string;
    tenantId?: string;
    requestId?: string;
    timestamp?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface ServiceHealthMetadata {
    version?: string;
    host?: string;
    type?: string;
    used?: string;
    available?: string;
    active_sessions?: number;
    [key: string]: string | number | boolean | undefined;
}
