import React, { useMemo, useState } from 'react';
import { WidgetErrorBoundary } from '../../../components/shared/ui/WidgetErrorBoundary';
import { useDataQuery } from '../../../hooks/useDataQuery';
import { DataTable } from '../../../components/shared/DataTable';
import { DataToolbar } from '../../../components/shared/DataToolbar';
import { Badge } from '../../../components/shared/ui/Badge';
import { Button } from '../../../components/shared/ui/Button';
import { Modal } from '../../../components/shared/ui/CommonUI';
import { AIContentGeneratorModal } from '../../../components/shared/modals/AIContentGeneratorModal';
import { IDCardGenerator } from './IDCardGenerator';
import { BulkImport } from './BulkImport';
import { AddStudentModal } from './components/AddStudentModal';
import { SkeletonTable } from '../../../components/shared/SkeletonLoader';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import pb from '../../../lib/pocketbase';
import { User } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import env from '../../../config/environment';

export const StudentDirectory: React.FC = () => {
    const { user } = useAuth();
    const apiBase = env.get('apiUrl') || '/api';
    const serviceApiKey = env.get('serviceApiKey');
    const tenantId = user?.tenantId;
    const baseFilter = useMemo(() => tenantId ? `role = "Student" && tenantId = "${tenantId}"` : 'role = "Student"', [tenantId]);

    const query = useDataQuery<User>('users', {
        filter: baseFilter,
        sort: '-created'
    });

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isIDModalOpen, setIsIDModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [enrollData, setEnrollData] = useState({ classId: '' });
    const [classes, setClasses] = useState<any[]>([]);
    const { addToast } = useToast();

    // Fetch classes when opening enroll modal
    const openEnrollModal = async (user: User) => {
        setSelectedUser(user);
        try {
            const res = await pb.collection('school_classes').getFullList({
                filter: tenantId ? `tenantId = "${tenantId}"` : undefined
            });
            setClasses(res);
            setIsEnrollModalOpen(true);
        } catch (e) {
            console.error("Failed to fetch classes", e);
        }
    };

    const { showToast } = useToast();

    const handleEnroll = async () => {
        // Validate
        const enrollmentSchema = z.object({
            student: z.string().min(1, 'Student ID required'),
            classId: z.string().min(1, 'Class selection required')
        });

        const result = enrollmentSchema.safeParse({
            student: selectedUser?.id || '',
            classId: enrollData.classId
        });

        if (!result.success) {
            showToast(`Validation error: ${result.error.issues[0].message}`, 'error');
            return;
        }

        try {
            await pb.collection('enrollments').create({
                student: selectedUser.id,
                class: enrollData.classId,
                enrolled_at: new Date().toISOString(),
                tenantId
            });
            setIsEnrollModalOpen(false);
            showToast(`Successfully enrolled ${selectedUser.name}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Enrollment failed', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${apiBase}/school/people/export?role=Student`, {
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
            a.download = 'students.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            addToast('Failed to export students', 'error');
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name', sortable: true },
        { header: 'Email', accessor: 'email', sortable: true },
        {
            header: 'Status',
            accessor: (user: User) => (
                <Badge variant={user.verified ? 'success' : 'warning'}>
                    {user.verified ? 'Verified' : 'Pending'}
                </Badge>
            )
        },
        {
            header: 'Last Active',
            accessor: (user: User) => user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'
        },
        {
            header: 'Actions',
            accessor: (user: User) => (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setIsAddModalOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setIsIDModalOpen(true); }}>ID Card</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setIsAIModalOpen(true); }}>Report</Button>
                    <Button size="sm" variant="primary" onClick={() => openEnrollModal(user)}>Enroll</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => { setUserToDelete(user); setIsDeleteConfirmOpen(true); }}>Delete</Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Student Directory</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>Bulk Import</Button>
                    <Button variant="primary" onClick={() => { setSelectedUser(null); setIsAddModalOpen(true); }}>Add Student</Button>
                </div>
            </div>

            <DataToolbar
                collectionName="students_view"
                onSearch={(term) => query.setFilter(`${baseFilter} && (name ~ "${term}" || email ~ "${term}")`)}
                onExport={handleExport}
                onRefresh={query.refresh}
                loading={query.loading}
            />

            <DataTable
                query={query}
                columns={columns}
                onRowClick={(user) => console.log("View profile", user)}
            />

            <IDCardGenerator
                user={selectedUser}
                isOpen={isIDModalOpen}
                onClose={() => setIsIDModalOpen(false)}
            />

            <BulkImport
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => { setIsImportModalOpen(false); query.refresh(); }}
                role="Student"
            />

            <Modal isOpen={isEnrollModalOpen} onClose={() => setIsEnrollModalOpen(false)} title={`Enroll ${selectedUser?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Class</label>
                        <select
                            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                            value={enrollData.classId}
                            onChange={e => setEnrollData({ classId: e.target.value })}
                        >
                            <option value="">-- Select Class --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEnrollModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleEnroll}>Confirm Enrollment</Button>
                    </div>
                </div>
            </Modal>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setSelectedUser(null); }}
                onSuccess={() => { query.refresh(); addToast('Student saved successfully!', 'success'); }}
                studentToEdit={selectedUser}
            />

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => { setIsDeleteConfirmOpen(false); setUserToDelete(null); }}
                onConfirm={async () => {
                    if (userToDelete) {
                        try {
                            await pb.collection('users').delete(userToDelete.id);
                            addToast('Student deleted successfully', 'success');
                            query.refresh();
                        } catch (error) {
                            addToast('Failed to delete student', 'error');
                        } finally {
                            setIsDeleteConfirmOpen(false);
                            setUserToDelete(null);
                        }
                    }
                }}
                title="Delete Student?"
                message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                variant="danger"
                confirmText="Delete Student"
            />

            <AIContentGeneratorModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSuccess={() => setIsAIModalOpen(false)}
                title={`Generate Report Card for ${selectedUser?.name}`}
                promptTemplate={`Generate a formal student report card for ${selectedUser?.name}.
                
                Include sections for:
                1. Academic Performance Summary (Simulated based on typical performance)
                2. Behavioral Assessment
                3. Attendance Record
                4. Teacher Comments
                
                Tone: Professional and Encouraging.`}
                contextData={{ student: selectedUser }}
            />
        </div>
    );
};
