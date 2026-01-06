import React, { useState, useRef } from 'react';
import { z } from 'zod';
import { Card, Icon, Badge, Button } from '../../components/shared/ui/CommonUI';
import {
    useContacts,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    useContactStats,
    useImportContacts,
    useExportContacts
} from '../../hooks/useCRMContacts';
import { CRMContact } from '../../services/crmContactsService';
import { useAuth } from '../../context/AuthContext';
import { sanitizeText } from '../../utils/sanitization';
import { emailSchema, phoneSchema } from '../../validation/schemas';
import { useToast } from '../../hooks/useToast';

const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  status: z.enum(['lead', 'prospect', 'customer', 'lost']),
  created_by: z.string().min(1)
});

const ContactsManager: React.FC = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
    const [formData, setFormData] = useState<Partial<CRMContact>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filters = statusFilter !== 'all' ? { status: statusFilter as any } : undefined;
    const { data: contacts, isLoading } = useContacts(filters);
    const { data: stats } = useContactStats();
    const createMutation = useCreateContact();
    const updateMutation = useUpdateContact();
    const deleteMutation = useDeleteContact();
    const importMutation = useImportContacts();
    const exportMutation = useExportContacts();

    const filteredContacts = contacts?.filter(contact => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            contact.first_name?.toLowerCase().includes(query) ||
            contact.last_name?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.company?.toLowerCase().includes(query)
        );
    });

    const { showToast } = useToast();
    
    // Form validation
    const validateForm = (): boolean => {
        // Sanitize inputs
        const sanitized = {
            first_name: sanitizeText(formData.first_name || ''),
            last_name: sanitizeText(formData.last_name || ''),
            email: formData.email?.toLowerCase().trim() || '',
            phone: formData.phone?.trim(),
            company: sanitizeText(formData.company || ''),
            status: formData.status || 'lead',
            created_by: user?.id || ''
        };
        
        const result = contactSchema.safeParse(sanitized);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    errors[issue.path[0].toString()] = issue.message;
                }
            });
            setFormErrors(errors);
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return false;
        }
        
        // Update formData with validated data
        Object.assign(formData, result.data);
        setFormErrors({});
        return true;
    };

    // Clear messages after timeout
    const clearMessages = () => {
        setTimeout(() => {
            setErrorMessage('');
            setSuccessMessage('');
        }, 5000);
    };

    const handleCreate = async () => {
        if (!validateForm()) {
            showToast('Please fix the form errors before submitting', 'error');
            return;
        }

        if (!user?.id) {
            showToast('User not authenticated', 'error');
            return;
        }

        try {
            const contactData: Partial<CRMContact> = {
                ...formData,
                created_by: user.id
            };
            await createMutation.mutateAsync(contactData);
            showToast('Contact created successfully', 'success');
            setShowCreateModal(false);
            setFormData({});
            setFormErrors({});
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to create contact';
            showToast(errorMsg, 'error');
        }
    };

    const handleUpdate = async () => {
        if (!editingContact) return;

        if (!validateForm()) {
            showToast('Please fix the form errors before submitting', 'error');
            return;
        }

        try {
            await updateMutation.mutateAsync({ id: editingContact.id, data: formData });
            showToast('Contact updated successfully', 'success');
            setEditingContact(null);
            setFormData({});
            setFormErrors({});
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to update contact';
            showToast(errorMsg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) return;

        try {
            await deleteMutation.mutateAsync(id);
            setSuccessMessage('Contact deleted successfully');
            clearMessages();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to delete contact';
            setErrorMessage(errorMsg);
            clearMessages();
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!user?.id) {
            setErrorMessage('User not authenticated');
            clearMessages();
            return;
        }

        if (!file.name.endsWith('.csv')) {
            setErrorMessage('Please upload a CSV file');
            clearMessages();
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const csvData = e.target?.result as string;
            if (!csvData) {
                setErrorMessage('File is empty');
                clearMessages();
                return;
            }

            try {
                const result = await importMutation.mutateAsync({ csvData, createdBy: user.id });
                if (result.success > 0) {
                    setSuccessMessage(`Imported ${result.success} contacts successfully${result.failed > 0 ? `. ${result.failed} failed.` : ''}`);
                } else {
                    setErrorMessage(`Import failed: ${result.errors.join(', ')}`);
                }
                clearMessages();
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Failed to import contacts';
                setErrorMessage(errorMsg);
                clearMessages();
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
            setErrorMessage('Failed to read file');
            clearMessages();
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleExport = async () => {
        try {
            const csv = await exportMutation.mutateAsync(filters);
            if (!csv) {
                setErrorMessage('No data to export');
                clearMessages();
                return;
            }

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            a.download = `contacts_${timestamp}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccessMessage('Contacts exported successfully');
            clearMessages();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to export contacts';
            setErrorMessage(errorMsg);
            clearMessages();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'customer': return 'success';
            case 'prospect': return 'info';
            case 'lead': return 'warning';
            case 'inactive': return 'neutral';
            default: return 'neutral';
        }
    };

    const openCreateModal = () => {
        setFormData({ 
            status: 'lead',
            lifecycle_stage: 'lead',
            lead_score: 0,
            tags: []
        });
        setFormErrors({});
        setErrorMessage('');
        setSuccessMessage('');
        setShowCreateModal(true);
    };

    const openEditModal = (contact: CRMContact) => {
        setEditingContact(contact);
        setFormData(contact);
        setFormErrors({});
        setErrorMessage('');
        setSuccessMessage('');
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingContact(null);
        setFormData({});
        setFormErrors({});
        setErrorMessage('');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                    <Icon name="CheckCircleIcon" className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-auto text-green-600 hover:text-green-800">
                        <Icon name="XMarkIcon" className="w-4 h-4" />
                    </button>
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 animate-fadeIn">
                    <Icon name="ExclamationCircleIcon" className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-400">{errorMessage}</span>
                    <button onClick={() => setErrorMessage('')} className="ml-auto text-red-600 hover:text-red-800">
                        <Icon name="XMarkIcon" className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Contacts</h2>
                    <p className="text-[8px] text-gray-500 mt-0.5">Manage your CRM contacts</p>
                </div>
                <div className="flex gap-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importMutation.isPending}
                        className="text-[10px] px-2 py-1"
                    >
                        <Icon name="ArrowUpTrayIcon" className="w-3 h-3 mr-1" />
                        Import
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        className="text-[10px] px-2 py-1"
                    >
                        <Icon name="ArrowDownTrayIcon" className="w-3 h-3 mr-1" />
                        Export
                    </Button>
                    <Button variant="primary" size="sm" onClick={openCreateModal} className="text-[10px] px-2 py-1">
                        <Icon name="PlusIcon" className="w-3 h-3 mr-1" />
                        New Contact
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Card className="p-2 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                    <p className="text-[8px] text-gray-600">Total</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{stats?.total || 0}</p>
                </Card>
                <Card className="p-2">
                    <p className="text-[8px] text-gray-600">Leads</p>
                    <p className="text-base font-bold text-yellow-600">{stats?.by_status.lead || 0}</p>
                </Card>
                <Card className="p-2">
                    <p className="text-[8px] text-gray-600">Prospects</p>
                    <p className="text-base font-bold text-blue-600">{stats?.by_status.prospect || 0}</p>
                </Card>
                <Card className="p-2">
                    <p className="text-[8px] text-gray-600">Customers</p>
                    <p className="text-base font-bold text-green-600">{stats?.by_status.customer || 0}</p>
                </Card>
                <Card className="p-2">
                    <p className="text-[8px] text-gray-600">Recent (30d)</p>
                    <p className="text-base font-bold text-purple-600">{stats?.recent || 0}</p>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card className="p-2">
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                        <div className="relative">
                            <Icon name="MagnifyingGlassIcon" className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search contacts..."
                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-[10px]"
                            />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-[10px]"
                    >
                        <option value="all">All Status</option>
                        <option value="lead">Leads</option>
                        <option value="prospect">Prospects</option>
                        <option value="customer">Customers</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Contacts List */}
            <div className="space-y-2">
                {filteredContacts?.map((contact) => (
                    <Card key={contact.id} className="p-2.5 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-[10px]">
                                            {contact.first_name} {contact.last_name}
                                        </h3>
                                        <Badge variant={getStatusColor(contact.status)}>
                                            {contact.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] text-gray-600">
                                        <span className="flex items-center gap-0.5">
                                            <Icon name="EnvelopeIcon" className="w-2.5 h-2.5" />
                                            {contact.email}
                                        </span>
                                        {contact.phone && (
                                            <span className="flex items-center gap-0.5">
                                                <Icon name="PhoneIcon" className="w-2.5 h-2.5" />
                                                {contact.phone}
                                            </span>
                                        )}
                                        {contact.company && (
                                            <span className="flex items-center gap-0.5">
                                                <Icon name="BuildingOfficeIcon" className="w-2.5 h-2.5" />
                                                {contact.company}
                                            </span>
                                        )}
                                    </div>
                                    {contact.title && (
                                        <p className="text-[8px] text-gray-500 mt-0.5">{contact.title}</p>
                                    )}
                                    {contact.tags && contact.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {contact.tags.map((tag, idx) => (
                                                <span key={idx} className="text-[7px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditModal(contact)}
                                    className="p-1"
                                >
                                    <Icon name="PencilIcon" className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(contact.id)}
                                    disabled={deleteMutation.isPending}
                                    className="p-1"
                                >
                                    <Icon name="TrashIcon" className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredContacts?.length === 0 && (
                    <Card className="p-12 text-center">
                        <Icon name="UserGroupIcon" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No contacts found</p>
                        <Button variant="primary" size="sm" onClick={openCreateModal} className="mt-4">
                            Create your first contact
                        </Button>
                    </Card>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingContact) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">
                            {editingContact ? 'Edit Contact' : 'New Contact'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, first_name: e.target.value });
                                        if (formErrors.first_name) {
                                            setFormErrors({ ...formErrors, first_name: '' });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                                        formErrors.first_name 
                                            ? 'border-red-500 dark:border-red-500' 
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                />
                                {formErrors.first_name && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.first_name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, last_name: e.target.value });
                                        if (formErrors.last_name) {
                                            setFormErrors({ ...formErrors, last_name: '' });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                                        formErrors.last_name 
                                            ? 'border-red-500 dark:border-red-500' 
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                />
                                {formErrors.last_name && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (formErrors.email) {
                                            setFormErrors({ ...formErrors, email: '' });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                                        formErrors.email 
                                            ? 'border-red-500 dark:border-red-500' 
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder="contact@example.com"
                                />
                                {formErrors.email && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (formErrors.phone) {
                                            setFormErrors({ ...formErrors, phone: '' });
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                                        formErrors.phone 
                                            ? 'border-red-500 dark:border-red-500' 
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    placeholder="+1 234-567-8900"
                                />
                                {formErrors.phone && (
                                    <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company
                                </label>
                                <input
                                    type="text"
                                    value={formData.company || ''}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status *
                            </label>
                            <select
                                value={formData.status || 'lead'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="lead">Lead</option>
                                <option value="prospect">Prospect</option>
                                <option value="customer">Customer</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={closeModal}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={editingContact ? handleUpdate : handleCreate}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1"
                            >
                                {editingContact ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ContactsManager;
