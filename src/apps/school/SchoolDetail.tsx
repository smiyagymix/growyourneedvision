import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { tenantService, Tenant } from '../../services/tenantService';
import { User } from '../../context/AuthContext';
import { ticketService, Ticket } from '../../services/ticketService';
import { Button } from '../../components/shared/ui/Button';
import { Avatar } from '../../components/shared/ui/Avatar';
import { Badge } from '../../components/shared/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/shared/ui/Table';
import { Input } from '../../components/shared/ui/Input';
import { Select } from '../../components/shared/ui/Select';
import { Modal } from '../../components/shared/ui/Modal';
import env from '../../config/environment';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const addUserSchema = z.object({
    email: emailSchema,
    role: z.enum(['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual']),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long')
});

const ticketSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    category: z.string().min(2, 'Category required').max(50, 'Category too long')
});

const brandingSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
    custom_domain: z.string().max(100, 'Domain too long').optional()
});

// ============================================
// TYPES
// ============================================

type TabType = 'Overview' | 'Users' | 'Branding' | 'Billing' | 'Support';

interface Invoice {
    id: string;
    created: number;
    amount_due: number;
    status: 'paid' | 'pending' | 'failed' | 'open';
    invoice_pdf?: string;
}

interface BrandingForm {
    primaryColor: string;
    secondaryColor: string;
    custom_domain: string;
}

interface TicketForm {
    subject: string;
    description: string;
    priority: string;
    category: string;
}

interface SchoolDetailProps {
    tenantId: string;
    onBack: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const SchoolDetail: React.FC<SchoolDetailProps> = ({ tenantId, onBack }) => {
    const { showToast } = useToast();
    
    // Core state
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // API config
    const apiBase = env.get('apiUrl') || '/api';
    const serviceApiKey = env.get('serviceApiKey');

    // Form states
    const [brandingForm, setBrandingForm] = useState<BrandingForm>({
        primaryColor: '#002366',
        secondaryColor: '#00B5FF',
        custom_domain: '',
    });

    const [ticketForm, setTicketForm] = useState<TicketForm>({
        subject: '',
        description: '',
        priority: 'Medium',
        category: 'Other'
    });

    const [billingInvoices, setBillingInvoices] = useState<Invoice[]>([]);

    // User form state
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('Student');
    const [newUserName, setNewUserName] = useState('');
    const [addingUser, setAddingUser] = useState(false);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Loading states for actions
    const [savingBranding, setSavingBranding] = useState(false);
    const [verifyingDNS, setVerifyingDNS] = useState(false);
    const [creatingTicket, setCreatingTicket] = useState(false);
    const [assumingAdmin, setAssumingAdmin] = useState(false);

    // ============================================
    // API HELPERS
    // ============================================

    const getHeaders = useCallback((): HeadersInit => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (serviceApiKey) {
            headers['x-api-key'] = serviceApiKey;
        }
        return headers;
    }, [serviceApiKey]);

    const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getHeaders(),
                ...options.headers
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        return response;
    }, [getHeaders]);

    // ============================================
    // DATA FETCHING
    // ============================================

    const fetchSchoolData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [tenantData, usersData, ticketsData] = await Promise.all([
                tenantService.getTenantById(tenantId),
                tenantService.getTenantUsers(tenantId),
                ticketService.getTicketsByTenant(tenantId)
            ]);

            setTenant(tenantData);
            setUsers(usersData.items as unknown as User[]);
            setTickets(ticketsData);
            
            // Initialize branding form with tenant data
            setBrandingForm({
                primaryColor: tenantData.branding?.primaryColor || '#002366',
                secondaryColor: tenantData.branding?.secondaryColor || '#00B5FF',
                custom_domain: tenantData.custom_domain || tenantData.domain || ''
            });
        } catch (err) {
            console.error("Failed to fetch school details", err);
            setError(err instanceof Error ? err.message : 'Failed to load school details');
            showToast('Failed to load school details', 'error');
        } finally {
            setLoading(false);
        }
    }, [tenantId, showToast]);

    const fetchBillingData = useCallback(async () => {
        try {
            const response = await fetchWithAuth(
                `${apiBase}/admin/billing/invoices?tenantId=${tenantId}`
            );
            const data = await response.json();
            const invoices = Array.isArray(data) ? data : (data.invoices || []);
            setBillingInvoices(invoices);
        } catch (err) {
            console.warn('Failed to load billing invoices', err);
        }
    }, [apiBase, tenantId, fetchWithAuth]);

    useEffect(() => {
        fetchSchoolData();
    }, [fetchSchoolData]);

    useEffect(() => {
        if (activeTab === 'Billing') {
            fetchBillingData();
        }
    }, [activeTab, fetchBillingData]);

    // ============================================
    // USER MANAGEMENT
    // ============================================

    const handleAddUser = async () => {
        // Validate email format first
        const sanitizedEmail = sanitizeText(newUserEmail.trim().toLowerCase());
        const sanitizedName = sanitizeText(newUserName.trim());
        
        if (!sanitizedEmail) {
            showToast('Please enter an email address', 'error');
            return;
        }

        // Generate username from email if name not provided
        const emailPart = sanitizedEmail.split('@')[0];
        const userName = sanitizedName || emailPart;
        const username = emailPart + Math.floor(Math.random() * 10000).toString();

        const userData = {
            email: sanitizedEmail,
            role: newUserRole as User['role'],
            name: userName,
            username: username
        };

        // Validate with schema
        const validationResult = addUserSchema.safeParse(userData);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        setAddingUser(true);
        
        try {
            const newUser = await tenantService.addTenantUser(tenantId, {
                ...validationResult.data,
                status: 'active'
            });
            
            if (newUser) {
                setUsers(prevUsers => [newUser as unknown as User, ...prevUsers]);
                showToast('User added successfully', 'success');
            }
            
            // Reset form
            setNewUserEmail('');
            setNewUserName('');
            setNewUserRole('Student');
        } catch (err) {
            console.error('Failed to add user', err);
            showToast(err instanceof Error ? err.message : 'Failed to add user', 'error');
        } finally {
            setAddingUser(false);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await tenantService.removeTenantUser(userId);
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
            showToast('User removed successfully', 'success');
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to remove user', err);
            showToast('Failed to remove user', 'error');
        }
    };

    // ============================================
    // ADMIN ACTIONS
    // ============================================

    const assumeAdmin = async () => {
        setAssumingAdmin(true);
        
        try {
            const response = await fetchWithAuth(
                `${apiBase}/admin/tenants/${tenantId}/assume`,
                { method: 'POST' }
            );
            
            const data = await response.json();
            
            // Store the temporary token if returned
            if (data.token) {
                sessionStorage.setItem('assumed_admin_token', data.token);
                sessionStorage.setItem('assumed_tenant_id', tenantId);
            }
            
            showToast('Assumed tenant admin role. You can now manage this school.', 'success');
            
            // Optionally redirect to tenant dashboard
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        } catch (err) {
            console.error('Failed to assume admin', err);
            showToast('Failed to assume admin role', 'error');
        } finally {
            setAssumingAdmin(false);
        }
    };

    // ============================================
    // BRANDING
    // ============================================

    const saveBranding = async () => {
        // Validate branding form
        const validationResult = brandingSchema.safeParse(brandingForm);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        setSavingBranding(true);
        
        try {
            await fetchWithAuth(
                `${apiBase}/admin/tenants/${tenantId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        branding: {
                            primaryColor: brandingForm.primaryColor,
                            secondaryColor: brandingForm.secondaryColor
                        },
                        custom_domain: brandingForm.custom_domain || null
                    })
                }
            );
            
            // Update local tenant state
            if (tenant) {
                setTenant({
                    ...tenant,
                    branding: {
                        ...tenant.branding,
                        primaryColor: brandingForm.primaryColor,
                        secondaryColor: brandingForm.secondaryColor
                    },
                    custom_domain: brandingForm.custom_domain
                });
            }
            
            showToast('Branding updated successfully', 'success');
        } catch (err) {
            console.error('Failed to update branding', err);
            showToast('Failed to update branding', 'error');
        } finally {
            setSavingBranding(false);
        }
    };

    const verifyDNS = async () => {
        if (!brandingForm.custom_domain) {
            showToast('Please enter a domain to verify', 'error');
            return;
        }

        setVerifyingDNS(true);
        
        try {
            const response = await fetchWithAuth(
                `${apiBase}/admin/tenants/${tenantId}/verify-dns`,
                {
                    method: 'POST',
                    body: JSON.stringify({ domain: brandingForm.custom_domain })
                }
            );
            
            const data = await response.json();
            
            if (data.verified) {
                showToast('DNS verified successfully! Domain is ready to use.', 'success');
            } else {
                showToast(
                    `DNS not verified. Please add a CNAME record: ${data.requiredRecord || 'Contact support for details'}`,
                    'warning'
                );
            }
        } catch (err) {
            console.error('DNS verification failed', err);
            showToast('DNS verification failed. Please try again.', 'error');
        } finally {
            setVerifyingDNS(false);
        }
    };

    const resetBranding = () => {
        if (tenant) {
            setBrandingForm({
                primaryColor: tenant.branding?.primaryColor || '#002366',
                secondaryColor: tenant.branding?.secondaryColor || '#00B5FF',
                custom_domain: tenant.custom_domain || tenant.domain || ''
            });
            showToast('Branding form reset', 'info');
        }
    };

    // ============================================
    // BILLING
    // ============================================

    const downloadInvoice = async (invoiceId: string) => {
        try {
            const response = await fetch(
                `${apiBase}/admin/billing/invoices/${invoiceId}/download`,
                { headers: serviceApiKey ? { 'x-api-key': serviceApiKey } : undefined }
            );
            
            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showToast('Invoice downloaded', 'success');
        } catch (err) {
            console.error('Failed to download invoice', err);
            showToast('Failed to download invoice', 'error');
        }
    };

    const handleUpgradePlan = () => {
        // Navigate to pricing/upgrade page or open modal
        window.open(`${apiBase}/billing/upgrade?tenant=${tenantId}`, '_blank');
    };

    // ============================================
    // SUPPORT TICKETS
    // ============================================

    const createSupportTicket = async () => {
        // Validate ticket form
        const validationResult = ticketSchema.safeParse(ticketForm);
        if (!validationResult.success) {
            showToast(`Validation error: ${validationResult.error.issues[0].message}`, 'error');
            return;
        }

        setCreatingTicket(true);
        
        try {
            const response = await fetchWithAuth(
                `${apiBase}/admin/tenants/${tenantId}/tickets`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...ticketForm,
                        tenantId,
                        createdAt: new Date().toISOString()
                    })
                }
            );
            
            const newTicket = await response.json();
            setTickets(prevTickets => [newTicket as Ticket, ...prevTickets]);
            showToast('Support ticket created successfully', 'success');
            
            // Reset form
            setTicketForm({
                subject: '',
                description: '',
                priority: 'Medium',
                category: 'Other'
            });
        } catch (err) {
            console.error('Failed to create ticket', err);
            showToast('Failed to create support ticket', 'error');
        } finally {
            setCreatingTicket(false);
        }
    };

    // ============================================
    // COMPUTED VALUES
    // ============================================

    const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'Active' || u.status === 'active').length,
        openTickets: tickets.filter(t => t.status === 'Open' || t.status === 'open').length,
        resolvedTickets: tickets.filter(t => t.status === 'Resolved' || t.status === 'resolved').length
    };

    const nextBillingDate = tenant?.next_billing_date 
        ? new Date(tenant.next_billing_date).toLocaleDateString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();

    // ============================================
    // RENDER HELPERS
    // ============================================

    const renderLoading = () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading school details...</p>
            </div>
        </div>
    );

    const renderError = () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button variant="primary" onClick={fetchSchoolData}>
                    Try Again
                </Button>
            </div>
        </div>
    );

    // ============================================
    // TAB CONTENT RENDERERS
    // ============================================

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                    <h3 className="text-blue-800 font-bold text-sm uppercase mb-2">Total Users</h3>
                    <div className="text-3xl font-black text-blue-900">{stats.totalUsers}</div>
                    <p className="text-sm text-blue-600 mt-1">{stats.activeUsers} active</p>
                </div>
                
                <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                    <h3 className="text-green-800 font-bold text-sm uppercase mb-2">Active Plan</h3>
                    <div className="text-3xl font-black text-green-900 capitalize">
                        {tenant?.subscription_plan || 'Free'}
                    </div>
                    <p className="text-sm text-green-600 mt-1">Next billing: {nextBillingDate}</p>
                </div>
                
                <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                    <h3 className="text-purple-800 font-bold text-sm uppercase mb-2">Open Tickets</h3>
                    <div className="text-3xl font-black text-purple-900">{stats.openTickets}</div>
                    <p className="text-sm text-purple-600 mt-1">{stats.resolvedTickets} resolved</p>
                </div>
                
                <div className="p-6 bg-amber-50 rounded-xl border border-amber-100">
                    <h3 className="text-amber-800 font-bold text-sm uppercase mb-2">Domain</h3>
                    <div className="text-lg font-black text-amber-900 truncate">
                        {tenant?.custom_domain || tenant?.domain || 'Not configured'}
                    </div>
                    <p className="text-sm text-amber-600 mt-1">
                        {tenant?.custom_domain ? 'Custom domain active' : 'Using default'}
                    </p>
                </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">School Information</h3>
                    <dl className="space-y-3">
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Contact Email</dt>
                            <dd className="font-medium">{tenant?.contact_email}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Created</dt>
                            <dd className="font-medium">
                                {tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString() : '-'}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-500">Status</dt>
                            <dd>
                                <Badge variant={tenant?.status === 'active' ? 'success' : 'warning'}>
                                    {tenant?.status}
                                </Badge>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {users.slice(0, 3).map(user => (
                            <div key={user.id} className="flex items-center gap-3">
                                <Avatar initials={user.name.substring(0, 2)} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-gray-500 text-sm">No users yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsersTab = () => (
        <div className="space-y-6">
            {/* Add User Form */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Add New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <Input
                            label="Email Address"
                            placeholder="user@school.edu"
                            type="email"
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <Input
                            label="Full Name (Optional)"
                            placeholder="John Doe"
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Select
                            label="Role"
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value)}
                        >
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                            <option value="SchoolAdmin">School Admin</option>
                            <option value="Parent">Parent</option>
                        </Select>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleAddUser}
                        disabled={addingUser || !newUserEmail}
                        className="bg-[#002366] hover:bg-[#001a4d]"
                    >
                        {addingUser ? 'Adding...' : 'Add User'}
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <Table>
                    <Thead>
                        <Tr>
                            <Th>User</Th>
                            <Th>Role</Th>
                            <Th>Status</Th>
                            <Th>Joined</Th>
                            <Th className="text-right">Actions</Th>
                        </Tr>
                    </Thead>
                    <tbody>
                        {users.length === 0 ? (
                            <Tr>
                                <Td colSpan={5} className="text-center text-gray-500 py-8">
                                    No users found. Add your first user above.
                                </Td>
                            </Tr>
                        ) : (
                            users.map(user => (
                                <Tr key={user.id}>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar initials={user.name.substring(0, 2)} size="sm" />
                                            <div>
                                                <div className="font-bold text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Badge variant="neutral">{user.role}</Badge>
                                    </Td>
                                    <Td>
                                        <Badge 
                                            variant={
                                                user.status === 'Active' || user.status === 'active' 
                                                    ? 'success' 
                                                    : 'neutral'
                                            }
                                        >
                                            {user.status}
                                        </Badge>
                                    </Td>
                                    <Td className="text-sm text-gray-500">
                                        {user.createdAt 
                                            ? new Date(user.createdAt).toLocaleDateString() 
                                            : '-'
                                        }
                                    </Td>
                                    <Td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => {/* TODO: Edit user */}}
                                            >
                                                Edit
                                            </Button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(user.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <Modal
                    isOpen={true}
                    onClose={() => setShowDeleteConfirm(null)}
                    title="Remove User"
                >
                    <div className="p-4">
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to remove this user? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleRemoveUser(showDeleteConfirm)}
                            >
                                Remove User
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );

    const renderBrandingTab = () => (
        <div className="max-w-2xl space-y-8">
            {/* Color Settings */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">Brand Colors</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={brandingForm.primaryColor}
                                onChange={e => setBrandingForm({
                                    ...brandingForm,
                                    primaryColor: e.target.value
                                })}
                                className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                            />
                            <Input
                                value={brandingForm.primaryColor}
                                onChange={e => setBrandingForm({
                                    ...brandingForm,
                                    primaryColor: e.target.value
                                })}
                                placeholder="#002366"
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Secondary Color
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={brandingForm.secondaryColor}
                                onChange={e => setBrandingForm({
                                    ...brandingForm,
                                    secondaryColor: e.target.value
                                })}
                                className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                            />
                            <Input
                                value={brandingForm.secondaryColor}
                                onChange={e => setBrandingForm({
                                    ...brandingForm,
                                    secondaryColor: e.target.value
                                })}
                                placeholder="#00B5FF"
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">Preview</h3>
                <div 
                    className="p-6 rounded-xl border"
                    style={{ 
                        background: `linear-gradient(135deg, ${brandingForm.primaryColor}, ${brandingForm.secondaryColor})` 
                    }}
                >
                    <h4 className="text-white font-bold text-lg mb-2">{tenant?.name}</h4>
                    <p className="text-white/80 text-sm">This is how your school brand will appear</p>
                </div>
            </div>

            {/* Custom Domain */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4">Custom Domain</h3>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="school.yourdomain.com"
                            value={brandingForm.custom_domain}
                            onChange={e => setBrandingForm({
                                ...brandingForm,
                                custom_domain: e.target.value
                            })}
                        />
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={verifyDNS}
                        disabled={verifyingDNS || !brandingForm.custom_domain}
                    >
                        {verifyingDNS ? 'Checking...' : 'Verify DNS'}
                    </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Add a CNAME record pointing to <code className="bg-gray-100 px-1 rounded">
                        {tenant?.domain}.gyn.education
                    </code>
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button 
                    variant="primary" 
                    onClick={saveBranding}
                    disabled={savingBranding}
                    className="bg-[#002366] hover:bg-[#001a4d]"
                >
                    {savingBranding ? 'Saving...' : 'Save Branding'}
                </Button>
                <Button variant="ghost" onClick={resetBranding}>
                    Reset to Saved
                </Button>
            </div>
        </div>
    );

    const renderBillingTab = () => (
        <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                            Current Plan
                        </h3>
                        <div className="text-4xl font-black capitalize">
                            {tenant?.subscription_plan || 'Free'}
                        </div>
                        <div className="text-sm text-gray-400 mt-2">
                            Next billing date: {nextBillingDate}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="primary" 
                            className="bg-white text-black hover:bg-gray-200 border-none"
                            onClick={handleUpgradePlan}
                        >
                            Upgrade Plan
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-white border-white/30 hover:bg-white/10"
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            </div>

            {/* Invoice History */}
            <div>
                <h3 className="font-bold text-lg text-gray-800 mb-4">Invoice History</h3>
                <div className="overflow-x-auto">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Date</Th>
                                <Th>Invoice ID</Th>
                                <Th>Amount</Th>
                                <Th>Status</Th>
                                <Th className="text-right">Actions</Th>
                            </Tr>
                        </Thead>
                        <tbody>
                            {billingInvoices.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} className="text-center text-gray-500 py-8">
                                        No invoices yet. Your first invoice will appear here after your billing cycle.
                                    </Td>
                                </Tr>
                            ) : (
                                billingInvoices.map(invoice => (
                                    <Tr key={invoice.id}>
                                        <Td>
                                            {invoice.created 
                                                ? new Date(invoice.created * 1000).toLocaleDateString()
                                                : '-'
                                            }
                                        </Td>
                                        <Td className="font-mono text-sm">
                                            {invoice.id.substring(0, 20)}...
                                        </Td>
                                        <Td className="font-bold">
                                            {invoice.amount_due 
                                                ? `$${(invoice.amount_due / 100).toFixed(2)}`
                                                : '-'
                                            }
                                        </Td>
                                        <Td>
                                            <Badge 
                                                variant={
                                                    invoice.status === 'paid' ? 'success' :
                                                    invoice.status === 'failed' ? 'danger' :
                                                    'neutral'
                                                }
                                            >
                                                {invoice.status || 'pending'}
                                            </Badge>
                                        </Td>
                                        <Td className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => downloadInvoice(invoice.id)}
                                            >
                                                Download PDF
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Payment Method (placeholder) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Payment Method</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                        </div>
                        <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/25</p>
                        </div>
                    </div>
                    <Button variant="secondary" size="sm">
                        Update
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderSupportTab = () => (
        <div className="space-y-6">
            {/* Create Ticket Form */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Create Support Ticket</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Subject"
                        placeholder="Brief description of the issue"
                        value={ticketForm.subject}
                        onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    />
                    <Select
                        label="Priority"
                        value={ticketForm.priority}
                        onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </Select>
                    <Select
                        label="Category"
                        value={ticketForm.category}
                        onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                    >
                        <option value="Billing">Billing</option>
                        <option value="Technical">Technical</option>
                        <option value="Access">Access</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Other">Other</option>
                    </Select>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Please describe your issue in detail..."
                            value={ticketForm.description}
                            onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button
                        variant="primary"
                        onClick={createSupportTicket}
                        disabled={creatingTicket || !ticketForm.subject || !ticketForm.description}
                        className="bg-[#002366] hover:bg-[#001a4d]"
                    >
                        {creatingTicket ? 'Creating...' : 'Submit Ticket'}
                    </Button>
                </div>
            </div>

            {/* Tickets List */}
            <div>
                <h3 className="font-bold text-lg text-gray-800 mb-4">
                    Support Tickets ({tickets.length})
                </h3>
                <div className="overflow-x-auto">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Subject</Th>
                                <Th>Category</Th>
                                <Th>Priority</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                                <Th className="text-right">Actions</Th>
                            </Tr>
                        </Thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <Tr>
                                    <Td colSpan={6} className="text-center text-gray-500 py-8">
                                        No support tickets found. Create your first ticket above.
                                    </Td>
                                </Tr>
                            ) : (
                                tickets.map(ticket => (
                                    <Tr key={ticket.id}>
                                        <Td>
                                            <span className="font-bold">{ticket.subject}</span>
                                        </Td>
                                        <Td>
                                            <Badge variant="neutral">
                                                {ticket.category || 'General'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge
                                                variant={
                                                    ticket.priority === 'Critical' ? 'danger' :
                                                    ticket.priority === 'High' ? 'warning' :
                                                    'neutral'
                                                }
                                            >
                                                {ticket.priority}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge
                                                variant={
                                                    ticket.status === 'Resolved' || ticket.status === 'resolved' 
                                                        ? 'success' :
                                                    ticket.status === 'Open' || ticket.status === 'open'
                                                        ? 'warning' :
                                                    'neutral'
                                                }
                                            >
                                                {ticket.status}
                                            </Badge>
                                        </Td>
                                        <Td className="text-sm text-gray-500">
                                            {ticket.created 
                                                ? new Date(ticket.created).toLocaleDateString()
                                                : ticket.createdAt
                                                    ? new Date(ticket.createdAt).toLocaleDateString()
                                                    : '-'
                                            }
                                        </Td>
                                        <Td className="text-right">
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>
        </div>
    );

    // ============================================
    // MAIN RENDER
    // ============================================

    if (loading) return renderLoading();
    if (error || !tenant) return renderError();

    return (
        <WidgetErrorBoundary>
            <div className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    <Button 
                        variant="ghost" 
                        onClick={onBack}
                        leftIcon={
                            <OwnerIcon name="ArrowLeftIcon" className="w-4 h-4" />
                        }
                    >
                        Back
                    </Button>
                    
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            {tenant.name}
                            <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>
                                {tenant.status}
                            </Badge>
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {tenant.domain} • {tenant.contact_email}
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary"
                            onClick={() => setShowEditModal(true)}
                        >
                            Edit School
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={assumeAdmin}
                            disabled={assumingAdmin}
                            className="bg-[#002366] hover:bg-[#001a4d]"
                        >
                            {assumingAdmin ? 'Logging in...' : 'Login as Admin'}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
                    {(['Overview', 'Users', 'Branding', 'Billing', 'Support'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === tab
                                    ? 'border-[#002366] text-[#002366]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] p-6">
                    {activeTab === 'Overview' && renderOverviewTab()}
                    {activeTab === 'Users' && renderUsersTab()}
                    {activeTab === 'Branding' && renderBrandingTab()}
                    {activeTab === 'Billing' && renderBillingTab()}
                    {activeTab === 'Support' && renderSupportTab()}
                </div>

                {/* Edit School Modal */}
                {showEditModal && (
                    <Modal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        title="Edit School"
                    >
                        <div className="p-6 space-y-4">
                            <Input
                                label="School Name"
                                defaultValue={tenant.name}
                            />
                            <Input
                                label="Contact Email"
                                type="email"
                                defaultValue={tenant.contact_email}
                            />
                            <Select
                                label="Status"
                                defaultValue={tenant.status}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </Select>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary"
                                    className="bg-[#002366] hover:bg-[#001a4d]"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </WidgetErrorBoundary>
    );
};

export default SchoolDetail;
