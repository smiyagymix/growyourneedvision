import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { OwnerIcon } from '../../components/shared/OwnerIcons';
import { tenantService, Tenant } from '../../services/tenantService';
import { User } from '../../context/AuthContext';
import { ticketService, Ticket } from '../../services/ticketService';
import { Button } from '../../components/shared/ui/Button';
import { Avatar } from '../../components/shared/ui/Avatar';
import { Badge } from '../../components/shared/ui/Badge';
import { Table, Thead, Tr, Th, Td } from '../../components/shared/ui/Table';
import { Input } from '../../components/shared/ui/Input';
import { Select } from '../../components/shared/ui/Select';
import env from '../../config/environment';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const addUserSchema = z.object({
    email: emailSchema,
    role: z.enum(['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual']),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long')
});

interface SchoolDetailProps {
    tenantId: string;
    onBack: () => void;
}

export const SchoolDetail: React.FC<SchoolDetailProps> = ({ tenantId, onBack }) => {
    const { showToast } = useToast();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Users' | 'Branding' | 'Billing' | 'Support'>('Overview');
    const [loading, setLoading] = useState(true);

    const apiBase = env.get('apiUrl') || '/api';
    const serviceApiKey = env.get('serviceApiKey');

    const [brandingForm, setBrandingForm] = useState({
        primaryColor: '',
        secondaryColor: '',
        custom_domain: '',
    });
    const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'Medium', category: 'Other' });
    const [billingInvoices, setBillingInvoices] = useState<any[]>([]);

    const downloadInvoice = async (id: string) => {
        try {
            const res = await fetch(`${apiBase}/admin/billing/invoices/${id}/download`, {
                headers: serviceApiKey ? { 'x-api-key': serviceApiKey } : undefined
            });
            if (!res.ok) throw new Error('Failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            showToast('Failed to download invoice', 'error');
        }
    };

    // User Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState('Student');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tData, uData, tickData] = await Promise.all([
                    tenantService.getTenantById(tenantId),
                    tenantService.getTenantUsers(tenantId),
                    ticketService.getTicketsByTenant(tenantId)
                ]);
                setTenant(tData);
                setUsers(uData.items as unknown as User[]);
                setTickets(tickData);
                setBrandingForm({
                    primaryColor: tData.branding?.primaryColor || '#002366',
                    secondaryColor: tData.branding?.secondaryColor || '#00B5FF',
                    custom_domain: tData.custom_domain || tData.domain || ''
                });
            } catch (error) {
                console.error("Failed to fetch school details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tenantId]);

    useEffect(() => {
        const fetchBilling = async () => {
            try {
                const res = await fetch(`${apiBase}/admin/billing/invoices?tenantId=${tenantId}`, {
                    headers: serviceApiKey ? { 'x-api-key': serviceApiKey } : undefined
                });
                if (res.ok) {
                    const data = await res.json();
                    const invoices = (data && (data.invoices || data)) || [];
                    setBillingInvoices(invoices);
                }
            } catch (e) {
                console.warn('Failed to load billing invoices', e);
            }
        };
        fetchBilling();
    }, [apiBase, serviceApiKey, tenantId]);

    const { showToast } = useToast();

    const handleAddUser = async () => {
        // Sanitize
        const sanitized = {
            email: sanitizeText(newUserEmail || ''),
            role: newUserRole
        };

        // Validate
        const userAddSchema = z.object({
            email: z.string().email('Invalid email address'),
            role: z.enum(['Teacher', 'Student', 'Parent', 'SchoolAdmin'])
        });

        const result = userAddSchema.safeParse(sanitized);
        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }
        
        // Prepare user data
        const emailPart = newUserEmail.split('@')[0];
        const userData = {
            email: newUserEmail.trim().toLowerCase(),
            role: newUserRole as User['role'],
            name: sanitizeText(emailPart),
            username: sanitizeText(emailPart + Math.floor(Math.random() * 1000).toString())
        };
        
        // Validate
        const userResult = addUserSchema.safeParse(userData);
        if (!userResult.success) {
            showToast(`Validation error: ${userResult.error.issues[0].message}`, 'error');
            return;
        }
        
        try {
            const newUser = await tenantService.addTenantUser(tenantId, {
                ...userResult.data,
                status: 'active'
            });
            if (newUser) {
                setUsers([newUser as unknown as User, ...users]);
            }
            setNewUserEmail('');
        } catch (error) {
            showToast('Failed to add user', 'error');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (confirm('Are you sure you want to remove this user?')) {
            await tenantService.removeTenantUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const assumeAdmin = async () => {
        try {
            await fetch(`${apiBase}/admin/tenants/${tenantId}/assume`, {
                method: 'POST',
                headers: {
                    ...(serviceApiKey ? { 'x-api-key': serviceApiKey } : {})
                }
            });
            showToast('Assumed tenant admin role', 'success');
        } catch (e) {
            showToast('Failed to assume admin', 'error');
        }
    };

    const saveBranding = async () => {
        try {
            await fetch(`${apiBase}/admin/tenants/${tenantId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(serviceApiKey ? { 'x-api-key': serviceApiKey } : {})
                },
                body: JSON.stringify({
                    branding: {
                        primaryColor: brandingForm.primaryColor,
                        secondaryColor: brandingForm.secondaryColor
                    },
                    custom_domain: brandingForm.custom_domain
                })
            });
            showToast('Branding updated', 'success');
        } catch (e) {
            showToast('Failed to update branding', 'error');
        }
    };

    const verifyDNS = async () => {
        try {
            const res = await fetch(`${apiBase}/admin/tenants/${tenantId}/verify-dns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(serviceApiKey ? { 'x-api-key': serviceApiKey } : {})
                },
                body: JSON.stringify({ domain: brandingForm.custom_domain })
            });
            const data = await res.json();
            alert(`DNS check: ${data.status} - ${data.requiredRecord || ''}`);
        } catch (e) {
            alert('DNS verification failed');
        }
    };

    const createSupportTicket = async () => {
        try {
            const res = await fetch(`${apiBase}/admin/tenants/${tenantId}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(serviceApiKey ? { 'x-api-key': serviceApiKey } : {})
                },
                body: JSON.stringify(ticketForm)
            });
            if (res.ok) {
                const ticket = await res.json();
                setTickets([ticket as Ticket, ...tickets]);
                showToast('Ticket created', 'success');
                setTicketForm({ subject: '', description: '', priority: 'Medium', category: 'Other' });
            } else {
                showToast('Failed to create ticket', 'error');
            }
        } catch (e) {
            showToast('Failed to create ticket', 'error');
        }
    };

    if (loading || !tenant) {
        return <div className="p-12 text-center">Loading school details...</div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack} leftIcon={<OwnerIcon name="ArrowLeftIcon" className="w-4 h-4" />}>
                    Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        {tenant.name}
                        <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>{tenant.status}</Badge>
                    </h1>
                    <p className="text-gray-500 text-sm">{tenant.domain} • {tenant.contact_email}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary">Edit School</Button>
                    <Button variant="primary" onClick={assumeAdmin}>Login as Admin</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {['Overview', 'Users', 'Branding', 'Billing', 'Support'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as 'Overview' | 'Users' | 'Branding' | 'Billing' | 'Support')}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                            activeTab === tab 
                            ? 'border-gyn-blue-dark text-gyn-blue-dark' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] p-6">
                
                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                            <h3 className="text-blue-800 font-bold text-sm uppercase mb-2">Total Users</h3>
                            <div className="text-3xl font-black text-blue-900">{users.length}</div>
                        </div>
                        <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold text-sm uppercase mb-2">Active Plan</h3>
                            <div className="text-3xl font-black text-green-900">{tenant.subscription_plan}</div>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                            <h3 className="text-purple-800 font-bold text-sm uppercase mb-2">Open Tickets</h3>
                            <div className="text-3xl font-black text-purple-900">{tickets.filter(t => t.status === 'Open').length}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'Users' && (
                    <div className="space-y-6">
                        <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex-1">
                                <Input 
                                    label="Add User Email" 
                                    placeholder="user@school.edu" 
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                />
                            </div>
                            <div className="w-48">
                                <Select 
                                    label="Role"
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value)}
                                >
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Parent">Parent</option>
                                </Select>
                            </div>
                            <Button variant="primary" onClick={handleAddUser} className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md">Add User</Button>
                        </div>

                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>User</Th>
                                    <Th>Role</Th>
                                    <Th>Status</Th>
                                    <Th className="text-right">Actions</Th>
                                </Tr>
                            </Thead>
                            <tbody>
                                {users.map(user => (
                                    <Tr key={user.id}>
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <Avatar initials={user.name.substring(0,2)} />
                                                <div>
                                                    <div className="font-bold text-sm">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td><Badge variant="neutral">{user.role}</Badge></Td>
                                        <Td><Badge variant={user.status === 'Active' ? 'success' : 'neutral'}>{user.status}</Badge></Td>
                                        <Td className="text-right">
                                            <button 
                                                onClick={() => handleRemoveUser(user.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                                            >
                                                Remove
                                            </button>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {activeTab === 'Branding' && (
                    <div className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                                <Input 
                                    type="color"
                                    value={brandingForm.primaryColor}
                                    onChange={e => setBrandingForm({...brandingForm, primaryColor: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Secondary Color</label>
                                <Input 
                                    type="color"
                                    value={brandingForm.secondaryColor}
                                    onChange={e => setBrandingForm({...brandingForm, secondaryColor: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Custom Domain</label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="school.yourdomain.com"
                                    value={brandingForm.custom_domain}
                                    onChange={e => setBrandingForm({...brandingForm, custom_domain: e.target.value})}
                                />
                                <Button variant="secondary" onClick={verifyDNS}>Verify DNS</Button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={saveBranding}>Save Branding</Button>
                            <Button variant="ghost" onClick={() => setBrandingForm({
                                primaryColor: tenant.branding?.primaryColor || '#002366',
                                secondaryColor: tenant.branding?.secondaryColor || '#00B5FF',
                                custom_domain: tenant.custom_domain || tenant.domain || ''
                            })}>Reset</Button>
                        </div>
                    </div>
                )}

                {activeTab === 'Billing' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Current Plan</h3>
                                <div className="text-3xl font-black">{tenant.subscription_plan}</div>
                                <div className="text-sm text-gray-400 mt-2">Next billing date: {new Date().toLocaleDateString()}</div>
                            </div>
                            <Button variant="primary" className="bg-white text-black hover:bg-gray-200 border-none">Upgrade Plan</Button>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800 mt-8">Invoice History</h3>
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Date</Th>
                                    <Th>Amount</Th>
                                    <Th>Status</Th>
                                    <Th className="text-right">Download</Th>
                                </Tr>
                            </Thead>
                            <tbody>
                                {billingInvoices.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={4} className="text-center text-gray-500 py-4">No invoices yet</Td>
                                    </Tr>
                                ) : (
                                    billingInvoices.map(inv => (
                                        <Tr key={inv.id}>
                                            <Td>{inv.created ? new Date(inv.created * 1000).toLocaleDateString() : '-'}</Td>
                                            <Td>{inv.amount_due ? `$${(inv.amount_due / 100).toFixed(2)}` : '-'}</Td>
                                            <Td><Badge variant={inv.status === 'paid' ? 'success' : 'neutral'}>{inv.status || 'pending'}</Badge></Td>
                                            <Td className="text-right"><Button variant="ghost" size="sm" onClick={() => downloadInvoice(inv.id)}>PDF</Button></Td>
                                        </Tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}

                {activeTab === 'Support' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">Support Tickets</h3>
                            <Button variant="primary" size="sm" onClick={createSupportTicket}>Create Ticket</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <Input 
                                label="Subject"
                                placeholder="Issue summary"
                                value={ticketForm.subject}
                                onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                            />
                            <Select 
                                label="Priority"
                                value={ticketForm.priority}
                                onChange={e => setTicketForm({...ticketForm, priority: e.target.value})}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </Select>
                            <Input 
                                label="Category"
                                placeholder="Billing, Access, Data..."
                                value={ticketForm.category}
                                onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                            />
                            <Input 
                                label="Description"
                                placeholder="Describe the issue"
                                value={ticketForm.description}
                                onChange={e => setTicketForm({...ticketForm, description: e.target.value})}
                            />
                        </div>
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Subject</Th>
                                    <Th>Priority</Th>
                                    <Th>Status</Th>
                                    <Th>Created</Th>
                                </Tr>
                            </Thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={4} className="text-center text-gray-500 py-8">No tickets found</Td>
                                    </Tr>
                                ) : (
                                    tickets.map(ticket => (
                                        <Tr key={ticket.id}>
                                            <Td className="font-bold">{ticket.subject}</Td>
                                            <Td><Badge variant={ticket.priority === 'Critical' ? 'danger' : 'neutral'}>{ticket.priority}</Badge></Td>
                                            <Td><Badge variant={ticket.status === 'Resolved' ? 'success' : 'warning'}>{ticket.status}</Badge></Td>
                                            <Td>{ticket.created ? new Date(ticket.created).toLocaleDateString() : '-'}</Td>
                                        </Tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                )}

            </div>
        </div>
    );
};
