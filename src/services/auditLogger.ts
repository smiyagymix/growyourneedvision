/**
 * Audit Logging Service
 * 
 * Automatically logs all owner actions for security and compliance.
 * Integrates with PocketBase audit_logs collection.
 */

import pb from '../lib/pocketbase';

export interface AuditLogEntry {
    action: string;
    user_id: string;
    user_email?: string;
    resource_type: string;
    resource_id?: string;
    changes?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    severity: 'info' | 'warning' | 'critical';
    metadata?: Record<string, any>;
}

class AuditLogger {
    /**
     * Log an action to the audit trail
     */
    async log(entry: Partial<AuditLogEntry>): Promise<void> {
        try {
            const authStore = pb.authStore;

            // Construct log entry
            const logEntry = {
                action: entry.action || 'unknown_action',
                user_id: entry.user_id || authStore.model?.id || 'system',
                user_email: entry.user_email || authStore.model?.email || 'system',
                resource_type: entry.resource_type || 'unknown',
                resource_id: entry.resource_id,
                changes: entry.changes || {},
                ip_address: entry.ip_address || await this.getClientIP(),
                user_agent: entry.user_agent || navigator.userAgent,
                severity: entry.severity || 'info',
                metadata: entry.metadata || {},
                timestamp: new Date().toISOString()
            };

            // Write to PocketBase
            await pb.collection('audit_logs').create(logEntry);

            // Also log to console in development
            if (import.meta.env.DEV) {
                console.log('[Audit Log]', logEntry);
            }

            // Send critical logs to external monitoring (Sentry, etc.)
            if (logEntry.severity === 'critical' && import.meta.env.VITE_SENTRY_DSN) {
                this.sendToMonitoring(logEntry);
            }
        } catch (error) {
            // Fallback: log to console if PocketBase fails
            console.error('[Audit Log Failed]', entry, error);
        }
    }

    /**
     * Log tenant creation
     */
    async logTenantCreate(tenantId: string, tenantName: string, tenantType: string): Promise<void> {
        await this.log({
            action: 'tenant.create',
            resource_type: 'tenant',
            resource_id: tenantId,
            severity: 'info',
            metadata: {
                tenant_name: tenantName,
                tenant_type: tenantType
            }
        });
    }

    /**
     * Log tenant update
     */
    async logTenantUpdate(tenantId: string, changes: Record<string, any>): Promise<void> {
        await this.log({
            action: 'tenant.update',
            resource_type: 'tenant',
            resource_id: tenantId,
            changes: changes,
            severity: 'info'
        });
    }

    /**
     * Log tenant deletion (critical action)
     */
    async logTenantDelete(tenantId: string, tenantName: string): Promise<void> {
        await this.log({
            action: 'tenant.delete',
            resource_type: 'tenant',
            resource_id: tenantId,
            severity: 'critical',
            metadata: {
                tenant_name: tenantName
            }
        });
    }

    /**
     * Log settings change
     */
    async logSettingsChange(settingKey: string, oldValue: any, newValue: any): Promise<void> {
        await this.log({
            action: 'settings.update',
            resource_type: 'system_setting',
            resource_id: settingKey,
            changes: {
                old_value: oldValue,
                new_value: newValue
            },
            severity: 'warning'
        });
    }

    /**
     * Log feature flag change
     */
    async logFeatureFlagChange(flagName: string, enabled: boolean): Promise<void> {
        await this.log({
            action: 'feature_flag.toggle',
            resource_type: 'feature_flag',
            resource_id: flagName,
            changes: {
                enabled: enabled
            },
            severity: 'warning',
            metadata: {
                flag_name: flagName
            }
        });
    }

    /**
     * Log payment gateway configuration change (critical)
     */
    async logPaymentConfigChange(gateway: string, action: string): Promise<void> {
        await this.log({
            action: `payment.config.${action}`,
            resource_type: 'payment_gateway',
            resource_id: gateway,
            severity: 'critical',
            metadata: {
                gateway: gateway
            }
        });
    }

    /**
     * Log API key creation/rotation
     */
    async logAPIKeyChange(keyName: string, action: 'create' | 'rotate' | 'delete'): Promise<void> {
        await this.log({
            action: `api_key.${action}`,
            resource_type: 'api_key',
            resource_id: keyName,
            severity: 'critical'
        });
    }

    /**
     * Log user login
     */
    async logLogin(userId: string, email: string, role: string): Promise<void> {
        await this.log({
            action: 'auth.login',
            resource_type: 'user',
            resource_id: userId,
            user_email: email,
            severity: 'info',
            metadata: {
                role: role
            }
        });
    }

    /**
     * Log failed login attempt
     */
    async logLoginFailure(email: string, reason: string): Promise<void> {
        await this.log({
            action: 'auth.login_failed',
            resource_type: 'user',
            user_email: email,
            severity: 'warning',
            metadata: {
                reason: reason
            }
        });
    }

    /**
     * Get client IP address (best effort)
     */
    private async getClientIP(): Promise<string> {
        try {
            // Try to get from headers if available (set by reverse proxy)
            return 'client_ip'; // Placeholder - would be set server-side
        } catch {
            return 'unknown';
        }
    }

    /**
     * Send critical logs to external monitoring
     */
    private sendToMonitoring(logEntry: any): void {
        // Integration with Sentry or other monitoring service
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureMessage(
                `Critical Audit Log: ${logEntry.action}`,
                {
                    level: 'warning',
                    extra: logEntry
                }
            );
        }
    }

    /**
     * Query audit logs for a specific resource
     */
    async getLogsForResource(resourceType: string, resourceId: string, limit = 50): Promise<any[]> {
        try {
            const logs = await pb.collection('audit_logs').getList(1, limit, {
                filter: `resource_type = "${resourceType}" && resource_id = "${resourceId}"`,
                sort: '-created'
            });
            return logs.items;
        } catch (error) {
            console.error('[Audit Log Query Failed]', error);
            return [];
        }
    }

    /**
     * Query audit logs for a specific user
     */
    async getLogsForUser(userId: string, limit = 100): Promise<any[]> {
        try {
            const logs = await pb.collection('audit_logs').getList(1, limit, {
                filter: `user_id = "${userId}"`,
                sort: '-created'
            });
            return logs.items;
        } catch (error) {
            console.error('[Audit Log Query Failed]', error);
            return [];
        }
    }

    /**
     * Get recent critical actions
     */
    async getCriticalActions(limit = 20): Promise<any[]> {
        try {
            const logs = await pb.collection('audit_logs').getList(1, limit, {
                filter: 'severity = "critical"',
                sort: '-created'
            });
            return logs.items;
        } catch (error) {
            console.error('[Audit Log Query Failed]', error);
            return [];
        }
    }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export helper functions for common use cases
export const auditLog = {
    // Generic log method for flexible audit logging
    log: (action: string, metadata: Record<string, any> = {}, severity: 'info' | 'warning' | 'critical' = 'info') =>
        auditLogger.log({
            action,
            resource_type: metadata.resource_type || 'system',
            resource_id: metadata.resource_id,
            severity,
            metadata
        }),

    tenantCreate: (tenantId: string, tenantName: string, tenantType: string) =>
        auditLogger.logTenantCreate(tenantId, tenantName, tenantType),

    tenantUpdate: (tenantId: string, changes: Record<string, any>) =>
        auditLogger.logTenantUpdate(tenantId, changes),

    tenantDelete: (tenantId: string, tenantName: string) =>
        auditLogger.logTenantDelete(tenantId, tenantName),

    settingsChange: (settingKey: string, oldValue: any, newValue: any) =>
        auditLogger.logSettingsChange(settingKey, oldValue, newValue),

    featureFlagChange: (flagName: string, enabled: boolean) =>
        auditLogger.logFeatureFlagChange(flagName, enabled),

    paymentConfigChange: (gateway: string, action: string) =>
        auditLogger.logPaymentConfigChange(gateway, action),

    apiKeyChange: (keyName: string, action: 'create' | 'rotate' | 'delete') =>
        auditLogger.logAPIKeyChange(keyName, action),

    login: (userId: string, email: string, role: string) =>
        auditLogger.logLogin(userId, email, role),

    loginFailure: (email: string, reason: string) =>
        auditLogger.logLoginFailure(email, reason)
};
