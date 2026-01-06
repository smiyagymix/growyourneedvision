import React, { useState, useEffect } from 'react';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import { auditLog } from '../../services/auditLogger';
import { securitySettingsService, type StaffMember, type IPWhitelistEntry, type SecuritySettings as SecuritySettingsType } from '../../services/securitySettingsService';

interface Permission {
    id: string;
    key: string;
    name: string;
    description: string;
    category: 'tenants' | 'billing' | 'settings' | 'analytics' | 'tools';
    assigned_roles: string[];
}

const SecuritySettings: React.FC = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([]);
    const [settings, setSettings] = useState<SecuritySettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [newIP, setNewIP] = useState('');
    const [newIPDescription, setNewIPDescription] = useState('');
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'Admin' as 'Super Admin' | 'Admin' | 'Support' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffData, ipData, settingsData] = await Promise.all([
                securitySettingsService.getStaffMembers(),
                securitySettingsService.getIPWhitelist(),
                securitySettingsService.getSecuritySettings()
            ]);
            setStaff(staffData);
            setIpWhitelist(ipData);
            setSettings(settingsData);
        } catch (error) {
            console.error('Failed to load security data:', error);
        }
        setLoading(false);
    };

    const permissions: Permission[] = [
        {
            id: '1',
            key: 'tenant.create',
            name: 'Create Tenants',
            description: 'Ability to create new tenant accounts',
            category: 'tenants',
            assigned_roles: ['Super Admin', 'Admin']
        },
        {
            id: '2',
            key: 'tenant.delete',
            name: 'Delete Tenants',
            description: 'Ability to permanently delete tenant accounts',
            category: 'tenants',
            assigned_roles: ['Super Admin']
        },
        {
            id: '3',
            key: 'billing.view',
            name: 'View Billing',
            description: 'Access to view invoices and payment information',
            category: 'billing',
            assigned_roles: ['Super Admin', 'Admin']
        },
        {
            id: '4',
            key: 'billing.manage',
            name: 'Manage Billing',
            description: 'Create invoices and process payments',
            category: 'billing',
            assigned_roles: ['Super Admin']
        },
        {
            id: '5',
            key: 'settings.update',
            name: 'Update Settings',
            description: 'Modify platform configuration',
            category: 'settings',
            assigned_roles: ['Super Admin']
        },
        {
            id: '6',
            key: 'analytics.view',
            name: 'View Analytics',
            description: 'Access analytics dashboards',
            category: 'analytics',
            assigned_roles: ['Super Admin', 'Admin', 'Support']
        }
    ];

    const handleToggleMFA = async (staffId: string) => {
        try {
            const member = staff.find(s => s.id === staffId);
            if (!member) return;
            const updated = await securitySettingsService.toggleStaffMFA(staffId, !member.mfaEnabled);
            if (updated) {
                setStaff(staff.map(s => s.id === staffId ? updated : s));
            }
        } catch (error) {
            console.error('Failed to toggle MFA:', error);
        }
    };

    const handleToggleStaffStatus = async (staffId: string) => {
        try {
            const member = staff.find(s => s.id === staffId);
            if (!member) return;
            const newStatus = member.status === 'active' ? 'inactive' : 'active';
            const updated = await securitySettingsService.toggleStaffStatus(staffId, newStatus as StaffMember['status']);
            if (updated) {
                setStaff(staff.map(s => s.id === staffId ? updated : s));
            }
        } catch (error) {
            console.error('Failed to toggle staff status:', error);
        }
    };

    const handleAddIP = async () => {
        if (newIP && !ipWhitelist.some(ip => ip.ip === newIP)) {
            try {
                const newEntry = await securitySettingsService.addIPToWhitelist(newIP, newIPDescription || 'Added manually', 'owner');
                setIpWhitelist([...ipWhitelist, newEntry]);
                setNewIP('');
                setNewIPDescription('');
            } catch (error) {
                console.error('Failed to add IP:', error);
            }
        }
    };

    const handleRemoveIP = async (ipId: string) => {
        try {
            await securitySettingsService.removeIPFromWhitelist(ipId);
            setIpWhitelist(ipWhitelist.filter(i => i.id !== ipId));
        } catch (error) {
            console.error('Failed to remove IP:', error);
        }
    };

    const handleToggleMFAPolicy = async () => {
        if (!settings) return;
        try {
            const newValue = !settings.mfaRequired;
            await auditLog.settingsChange('mfaRequired', settings.mfaRequired, newValue);
            const updated = await securitySettingsService.updateSecuritySettings({ mfaRequired: newValue });
            setSettings(updated);
        } catch (error) {
            console.error('Failed to toggle MFA policy:', error);
        }
    };

    const handleUpdateSessionTimeout = async (minutes: number) => {
        if (!settings) return;
        try {
            await auditLog.settingsChange('sessionTimeout', settings.sessionTimeout, minutes);
            const updated = await securitySettingsService.updateSecuritySettings({ sessionTimeout: minutes });
            setSettings(updated);
        } catch (error) {
            console.error('Failed to update session timeout:', error);
        }
    };

    const { showToast } = useToast();
    
    const handleAddStaff = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(staffForm.name),
            email: staffForm.email.toLowerCase().trim(),
            role: staffForm.role
        };
        
        // Validate
        const result = staffSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            const newStaff = await securitySettingsService.createStaff({
                name: result.data.name,
                email: result.data.email,
                role: result.data.role.toLowerCase().replace(' ', '_')
            } as any);
            setStaff([...staff, newStaff]);
            setStaffForm({ name: '', email: '', role: 'Admin' });
            setShowAddStaffModal(false);
            showToast('Staff member added successfully', 'success');
        } catch (error) {
            console.error('Failed to add staff:', error);
            showToast('Failed to add staff member', 'error');
        }
    };

    const handleUpdateStaff = async () => {
        if (!editingStaff) return;
        
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(editingStaff.name),
            email: editingStaff.email.toLowerCase().trim(),
            role: editingStaff.role
        };
        
        // Validate
        const result = staffSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            const updated = await securitySettingsService.updateStaff(editingStaff.id, result.data);
            if (updated) {
                setStaff(staff.map(s => s.id === editingStaff.id ? updated : s));
                showToast('Staff member updated successfully', 'success');
            }
            setEditingStaff(null);
        } catch (error) {
            console.error('Failed to update staff:', error);
            showToast('Failed to update staff member', 'error');
        }
    };

    const handleDeleteStaff = async (staffId: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await securitySettingsService.deleteStaff(staffId);
            setStaff(staff.filter(s => s.id !== staffId));
        } catch (error) {
            console.error('Failed to delete staff:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Access Control</h2>
                <p className="text-sm text-gray-500 mt-1">Manage owner staff, permissions, and security policies</p>
            </div>

            {/* Security Policies */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security Policies</h3>

                <div className="space-y-4">
                    {/* MFA Enforcement */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon name="ShieldCheckIcon" className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900 dark:text-white">Multi-Factor Authentication</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Require MFA for all owner staff accounts</p>
                        </div>
                        <button
                            onClick={handleToggleMFAPolicy}
                            name="toggle-mfa-policy"
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings?.mfaRequired ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings?.mfaRequired ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Session Timeout */}
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="ClockIcon" className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">Session Timeout</h4>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                name="session-timeout"
                                min="15"
                                max="480"
                                step="15"
                                value={settings?.sessionTimeout || 60}
                                onChange={(e) => handleUpdateSessionTimeout(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <div className="w-32 text-right">
                                <span className="font-bold text-gray-900 dark:text-white">{settings?.sessionTimeout || 60} min</span>
                                <p className="text-xs text-gray-500">
                                    {(settings?.sessionTimeout || 60) < 60 ? `${settings?.sessionTimeout || 60} minutes` : `${((settings?.sessionTimeout || 60) / 60).toFixed(1)} hours`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* IP Whitelist */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Icon name="GlobeAltIcon" className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">IP Whitelist</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Restrict owner dashboard access to specific IP addresses or ranges
                        </p>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                name="ip-address"
                                placeholder="Enter IP or CIDR range (e.g., 203.0.113.0/24)"
                                value={newIP}
                                onChange={(e) => setNewIP(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <input
                                type="text"
                                name="ip-description"
                                placeholder="Description (optional)"
                                value={newIPDescription}
                                onChange={(e) => setNewIPDescription(e.target.value)}
                                className="w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <Button variant="primary" onClick={handleAddIP} name="add-ip">Add IP</Button>
                        </div>

                        <div className="space-y-2">
                            {ipWhitelist.map((ipEntry) => (
                                <div key={ipEntry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div>
                                        <code className="text-sm font-mono text-gray-900 dark:text-white">{ipEntry.ip}</code>
                                        <p className="text-xs text-gray-500">{ipEntry.description}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveIP(ipEntry.id)} name="remove-ip">
                                        <Icon name="XMarkIcon" className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Owner Staff Management */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Owner Staff</h3>
                    <Button variant="primary" onClick={() => setShowAddStaffModal(true)} name="add-staff-member">
                        <Icon name="PlusIcon" className="w-4 h-4 mr-2" />
                        Add Staff Member
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <Icon name="ArrowPathIcon" className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                        <p className="text-gray-500 mt-2">Loading staff...</p>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MFA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {staff.map((member) => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={member.role === 'super_admin' ? 'primary' : 'secondary'}>
                                            {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={member.status === 'active' ? 'success' : 'danger'}>
                                            {member.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleMFA(member.id)}
                                            name="toggle-staff-mfa"
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.mfaEnabled ? 'bg-green-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${member.mfaEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {member.lastLogin}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingStaff(member)}
                                            name="edit-staff"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStaffStatus(member.id)}
                                            name="toggle-staff-status"
                                        >
                                            {member.status === 'active' ? 'Suspend' : 'Activate'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteStaff(member.id)}
                                            className="text-red-500"
                                            name="delete-staff"
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </Card>

            {/* Permissions Matrix */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Permission Matrix</h3>

                <div className="space-y-4">
                    {['tenants', 'billing', 'settings', 'analytics', 'tools'].map((category) => {
                        const categoryPerms = permissions.filter(p => p.category === category);

                        return (
                            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{category}</h4>
                                </div>
                                <div className="p-4 space-y-3">
                                    {categoryPerms.map((perm) => (
                                        <div key={perm.id} className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">{perm.name}</div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{perm.description}</p>
                                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 inline-block">
                                                    {perm.key}
                                                </code>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {perm.assigned_roles.map((role, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Security Log */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <div className="flex gap-4">
                    <Icon name="InformationCircleIcon" className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Security Best Practices</h4>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <li>• Require MFA for all owner staff members</li>
                            <li>• Use IP whitelisting for production environments</li>
                            <li>• Set session timeout to maximum 2 hours for security</li>
                            <li>• Review audit logs regularly for suspicious activity</li>
                            <li>• Limit Super Admin role to 1-2 trusted individuals</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Staff Member</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="staff-name"
                                    value={staffForm.name}
                                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="staff-email"
                                    value={staffForm.email}
                                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    placeholder="email@growyourneed.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    name="staff-role"
                                    value={staffForm.role}
                                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'Super Admin' | 'Admin' | 'Support' })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <option value="Support">Support</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Super Admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setShowAddStaffModal(false)} className="flex-1" name="modal-cancel">Cancel</Button>
                                <Button variant="primary" onClick={handleAddStaff} className="flex-1" name="modal-add-staff">Add Staff</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Staff Modal */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Staff Member</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="edit-staff-name"
                                    value={editingStaff.name}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="edit-staff-email"
                                    value={editingStaff.email}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    name="edit-staff-role"
                                    value={editingStaff.role}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as StaffMember['role'] })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <option value="support">Support</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setEditingStaff(null)} className="flex-1" name="modal-cancel">Cancel</Button>
                                <Button variant="primary" onClick={handleUpdateStaff} className="flex-1" name="modal-save-staff">Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SecuritySettings;
