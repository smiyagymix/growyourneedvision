import React, { useMemo, useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { DataTable } from '../../../components/shared/DataTable';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { BulkImport } from './BulkImport';
import pb from '../../../lib/pocketbase';
import { User } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import env from '../../../config/environment';
import { useToast } from '../../../hooks/useToast';

export const StaffDirectory: React.FC = () => {
    const { user } = useAuth();
    const apiBase = env.get('apiUrl') || '/api';
    const serviceApiKey = env.get('serviceApiKey');
    const tenantId = user?.tenantId;
    const baseFilter = useMemo(() => tenantId ? `role = "Staff" && tenantId = "${tenantId}"` : 'role = "Staff"', [tenantId]);

    const query = useDataQuery<User>('users', {
        filter: baseFilter,
        sort: '-created'
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [newRole, setNewRole] = useState('');

    const handleRoleUpdate = async () => {
        if (!selectedUser || !newRole) return;
        try {
            await pb.collection('users').update(selectedUser.id, {
                title: newRole,
                tenantId
            });
            setIsRoleModalOpen(false);
            query.refresh();
        } catch (e) {
            console.error(e);
            alert('Update failed');
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${apiBase}/school/people/export?role=Staff`, {
                headers: {
                    'x-api-key': serviceApiKey,
                    'x-tenant-id': tenantId || '',
                    'x-user-role': user?.role || 'SchoolAdmin'
                }
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'staff.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Failed to export staff');
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name', sortable: true },
        { header: 'Email', accessor: 'email', sortable: true },
        { header: 'Job Title', accessor: 'title', sortable: true },
        { 
            header: 'Status', 
            accessor: (user: User) => (
                <Badge variant={user.verified ? 'success' : 'warning'}>
                    {user.verified ? 'Active' : 'Pending'}
                </Badge>
            ) 
        },
        {
            header: 'Actions',
            accessor: (user: User) => (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setIsRoleModalOpen(true); }}>Edit Role</Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Staff Directory</h2>
                <Button variant="primary" onClick={() => setIsImportModalOpen(true)}>Bulk Import</Button>
            </div>

            <DataToolbar 
                collectionName="staff_view"
                onSearch={(term) => query.setFilter(`${baseFilter} && (name ~ "${term}" || email ~ "${term}" || title ~ "${term}")`)}
                onExport={handleExport}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable 
                query={query} 
                columns={columns}
                onRowClick={(user) => console.log("View profile", user)}
            />

            <BulkImport 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onSuccess={() => { setIsImportModalOpen(false); query.refresh(); }}
                role="Staff"
            />

            <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={`Edit Role for ${selectedUser?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Job Title / Role</label>
                        <input 
                            type="text"
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            placeholder="e.g. Administrator, Maintenance, Nurse"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleRoleUpdate}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
