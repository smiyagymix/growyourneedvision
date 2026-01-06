/**
 * Security Settings Service
 * Manage platform security, staff members, and access controls
 */

import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { auditLogger } from './auditLogger';

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'support' | 'analyst' | 'developer';
    permissions: string[];
    mfaEnabled: boolean;
    lastLogin?: string;
    status: 'active' | 'inactive' | 'suspended';
    avatar?: string;
    created: string;
    updated: string;
}

export interface IPWhitelistEntry {
    id: string;
    ip: string;
    description: string;
    addedBy: string;
    created: string;
}

export interface SecuritySettings {
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        expirationDays: number;
    };
    ipWhitelistEnabled: boolean;
    loginAttemptLimit: number;
    lockoutDuration: number; // minutes
}

export interface SecurityAuditEntry {
    id: string;
    action: string;
    userId: string;
    userName: string;
    ip: string;
    userAgent: string;
    success: boolean;
    details?: string;
    timestamp: string;
}

// Mock staff members
const MOCK_STAFF: StaffMember[] = [
    {
        id: 'staff-1',
        name: 'John Administrator',
        email: 'john@growyourneed.com',
        role: 'super_admin',
        permissions: ['all'],
        mfaEnabled: true,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'staff-2',
        name: 'Sarah Support',
        email: 'sarah@growyourneed.com',
        role: 'support',
        permissions: ['view_tickets', 'respond_tickets', 'view_users'],
        mfaEnabled: true,
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'staff-3',
        name: 'Mike Developer',
        email: 'mike@growyourneed.com',
        role: 'developer',
        permissions: ['view_logs', 'view_analytics', 'manage_webhooks', 'view_api_docs'],
        mfaEnabled: false,
        lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'staff-4',
        name: 'Emily Analyst',
        email: 'emily@growyourneed.com',
        role: 'analyst',
        permissions: ['view_analytics', 'export_reports', 'view_dashboards'],
        mfaEnabled: true,
        lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'staff-5',
        name: 'Tom Admin',
        email: 'tom@growyourneed.com',
        role: 'admin',
        permissions: ['manage_users', 'manage_tenants', 'view_logs', 'manage_settings'],
        mfaEnabled: true,
        status: 'inactive',
        created: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        updated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
];

const MOCK_IP_WHITELIST: IPWhitelistEntry[] = [
    {
        id: 'ip-1',
        ip: '192.168.1.0/24',
        description: 'Office network',
        addedBy: 'John Administrator',
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ip-2',
        ip: '10.0.0.0/8',
        description: 'VPN network',
        addedBy: 'John Administrator',
        created: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'ip-3',
        ip: '203.0.113.50',
        description: 'Remote developer workstation',
        addedBy: 'Mike Developer',
        created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
];

let MOCK_SETTINGS: SecuritySettings = {
    mfaRequired: false,
    sessionTimeout: 60,
    passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90
    },
    ipWhitelistEnabled: false,
    loginAttemptLimit: 5,
    lockoutDuration: 30
};

const MOCK_AUDIT: SecurityAuditEntry[] = [
    {
        id: 'audit-1',
        action: 'login',
        userId: 'staff-1',
        userName: 'John Administrator',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'audit-2',
        action: 'login',
        userId: 'staff-2',
        userName: 'Sarah Support',
        ip: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        success: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'audit-3',
        action: 'failed_login',
        userId: 'unknown',
        userName: 'attacker@example.com',
        ip: '45.33.32.156',
        userAgent: 'curl/7.64.1',
        success: false,
        details: 'Invalid credentials',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'audit-4',
        action: 'settings_change',
        userId: 'staff-1',
        userName: 'John Administrator',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        details: 'Updated session timeout',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'audit-5',
        action: 'mfa_enabled',
        userId: 'staff-4',
        userName: 'Emily Analyst',
        ip: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    }
];

class SecuritySettingsService {
    private staffCollection = 'staff_members';
    private ipCollection = 'ip_whitelist';
    private settingsCollection = 'security_settings';

    // Staff Management
    async getStaffMembers(): Promise<StaffMember[]> {
        if (isMockEnv()) {
            return [...MOCK_STAFF];
        }

        try {
            return await pb.collection(this.staffCollection).getFullList<StaffMember>({
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching staff members:', error);
            return [...MOCK_STAFF];
        }
    }

    async getStaffById(id: string): Promise<StaffMember | null> {
        if (isMockEnv()) {
            return MOCK_STAFF.find(s => s.id === id) || null;
        }

        try {
            return await pb.collection(this.staffCollection).getOne<StaffMember>(id);
        } catch (error) {
            console.error('Error fetching staff member:', error);
            return MOCK_STAFF.find(s => s.id === id) || null;
        }
    }

    async createStaff(data: Omit<StaffMember, 'id' | 'created' | 'updated'>): Promise<StaffMember> {
        const staff: StaffMember = {
            ...data,
            id: `staff-${Date.now()}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_STAFF.push(staff);
            return staff;
        }

        try {
            const created = await pb.collection(this.staffCollection).create<StaffMember>(data);
            await auditLogger.log({
                action: 'createStaffMember',
                resource_type: 'staff',
                resource_id: created.id,
                severity: 'warning',
                metadata: { email: data.email, role: data.role }
            });
            return created;
        } catch (error) {
            console.error('Error creating staff member:', error);
            throw error;
        }
    }

    async updateStaff(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
        if (isMockEnv()) {
            const index = MOCK_STAFF.findIndex(s => s.id === id);
            if (index > -1) {
                MOCK_STAFF[index] = {
                    ...MOCK_STAFF[index],
                    ...data,
                    updated: new Date().toISOString()
                };
                return MOCK_STAFF[index];
            }
            throw new Error('Staff member not found');
        }

        try {
            const updated = await pb.collection(this.staffCollection).update<StaffMember>(id, data);
            await auditLogger.log({
                action: 'updateStaffMember',
                resource_type: 'staff',
                resource_id: id,
                severity: 'info',
                metadata: { changes: Object.keys(data) }
            });
            return updated;
        } catch (error) {
            console.error('Error updating staff member:', error);
            throw error;
        }
    }

    async deleteStaff(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_STAFF.findIndex(s => s.id === id);
            if (index > -1) {
                MOCK_STAFF.splice(index, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.staffCollection).delete(id);
            await auditLogger.log({
                action: 'deleteStaffMember',
                resource_type: 'staff',
                resource_id: id,
                severity: 'critical'
            });
            return true;
        } catch (error) {
            console.error('Error deleting staff member:', error);
            throw error;
        }
    }

    async toggleStaffStatus(id: string, status: StaffMember['status']): Promise<StaffMember> {
        return this.updateStaff(id, { status });
    }

    async toggleStaffMFA(id: string, enabled: boolean): Promise<StaffMember> {
        return this.updateStaff(id, { mfaEnabled: enabled });
    }

    // IP Whitelist Management
    async getIPWhitelist(): Promise<IPWhitelistEntry[]> {
        if (isMockEnv()) {
            return [...MOCK_IP_WHITELIST];
        }

        try {
            return await pb.collection(this.ipCollection).getFullList<IPWhitelistEntry>({
                sort: '-created',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching IP whitelist:', error);
            return [...MOCK_IP_WHITELIST];
        }
    }

    async addIPToWhitelist(ip: string, description: string, addedBy: string): Promise<IPWhitelistEntry> {
        const entry: IPWhitelistEntry = {
            id: `ip-${Date.now()}`,
            ip,
            description,
            addedBy,
            created: new Date().toISOString()
        };

        if (isMockEnv()) {
            MOCK_IP_WHITELIST.push(entry);
            return entry;
        }

        try {
            const created = await pb.collection(this.ipCollection).create<IPWhitelistEntry>({ ip, description, addedBy });
            await auditLogger.log({
                action: 'addIPWhitelist',
                resource_type: 'ip_whitelist',
                resource_id: created.id,
                severity: 'warning',
                metadata: { ip, description }
            });
            return created;
        } catch (error) {
            console.error('Error adding IP to whitelist:', error);
            throw error;
        }
    }

    async removeIPFromWhitelist(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_IP_WHITELIST.findIndex(e => e.id === id);
            if (index > -1) {
                MOCK_IP_WHITELIST.splice(index, 1);
                return true;
            }
            return false;
        }

        try {
            await pb.collection(this.ipCollection).delete(id);
            await auditLogger.log({
                action: 'removeIPWhitelist',
                resource_type: 'ip_whitelist',
                resource_id: id,
                severity: 'warning'
            });
            return true;
        } catch (error) {
            console.error('Error removing IP from whitelist:', error);
            throw error;
        }
    }

    // Security Settings
    async getSecuritySettings(): Promise<SecuritySettings> {
        if (isMockEnv()) {
            return { ...MOCK_SETTINGS };
        }

        try {
            const records = await pb.collection(this.settingsCollection).getFullList({ requestKey: null });
            if (records.length > 0) {
                return records[0] as unknown as SecuritySettings;
            }
            return { ...MOCK_SETTINGS };
        } catch (error) {
            console.error('Error fetching security settings:', error);
            return { ...MOCK_SETTINGS };
        }
    }

    async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
        if (isMockEnv()) {
            MOCK_SETTINGS = { ...MOCK_SETTINGS, ...settings };
            return MOCK_SETTINGS;
        }

        try {
            const records = await pb.collection(this.settingsCollection).getFullList({ requestKey: null });
            let updated: SecuritySettings;
            
            if (records.length > 0) {
                updated = await pb.collection(this.settingsCollection).update<SecuritySettings>(records[0].id, settings);
            } else {
                updated = await pb.collection(this.settingsCollection).create<SecuritySettings>({ ...MOCK_SETTINGS, ...settings });
            }

            await auditLogger.log({
                action: 'updateSecuritySettings',
                resource_type: 'security_settings',
                resource_id: 'global',
                severity: 'critical',
                metadata: { changes: Object.keys(settings) }
            });

            return updated;
        } catch (error) {
            console.error('Error updating security settings:', error);
            throw error;
        }
    }

    // Security Audit
    async getSecurityAudit(options?: { limit?: number; action?: string }): Promise<SecurityAuditEntry[]> {
        if (isMockEnv()) {
            let results = [...MOCK_AUDIT];
            if (options?.action) {
                results = results.filter(a => a.action === options.action);
            }
            if (options?.limit) {
                results = results.slice(0, options.limit);
            }
            return results;
        }

        try {
            const filter = options?.action ? `action = "${options.action}"` : '';
            return await pb.collection('security_audit').getFullList<SecurityAuditEntry>({
                filter,
                sort: '-timestamp',
                requestKey: null
            });
        } catch (error) {
            console.error('Error fetching security audit:', error);
            return MOCK_AUDIT;
        }
    }

    // Statistics
    async getStats(): Promise<{
        totalStaff: number;
        activeStaff: number;
        mfaEnabled: number;
        byRole: Record<string, number>;
        recentLogins: number;
    }> {
        const staff = await this.getStaffMembers();
        const activeStaff = staff.filter(s => s.status === 'active');
        const mfaEnabled = staff.filter(s => s.mfaEnabled).length;
        
        const byRole: Record<string, number> = {};
        staff.forEach(s => {
            byRole[s.role] = (byRole[s.role] || 0) + 1;
        });

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogins = staff.filter(s => 
            s.lastLogin && new Date(s.lastLogin) > oneDayAgo
        ).length;

        return {
            totalStaff: staff.length,
            activeStaff: activeStaff.length,
            mfaEnabled,
            byRole,
            recentLogins
        };
    }
}

export const securitySettingsService = new SecuritySettingsService();
