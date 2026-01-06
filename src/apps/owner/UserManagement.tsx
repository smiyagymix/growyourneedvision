import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, Button, Icon, Badge, Input, Select } from '../../components/shared/ui/CommonUI';
import { WidgetErrorBoundary } from '../../components/shared/ui/WidgetErrorBoundary';
import { useApiError } from '../../hooks/useApiError';
import { useAuth } from '../../context/AuthContext';
import { DropdownMenu } from '../../components/shared/ui/DropdownMenu';
import { IconButton } from '../../components/shared/ui/IconButton';
import { userManagementService, User } from '../../services/userManagementService';
import { TableSkeleton } from '../../components/shared/ui/DashboardSkeletons';
import { emailSchema } from '../../validation/schemas';
import { sanitizeText } from '../../utils/sanitization';
import { useToast } from '../../hooks/useToast';

const userCreationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual'])
});

const ROLES = ['Owner', 'SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Individual'];

const UserManagement: React.FC = () => {
    const { handleError } = useApiError();
    const { startImpersonation, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ total: 0, byRole: {}, byStatus: {}, recentlyCreated: 0 });

    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const result = await userManagementService.getUsers(1, 100, {
                search: searchTerm || undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined
            });
            setUsers(result.items);
        } catch (error) {
            handleError(error, 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await userManagementService.getUserStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    // Reload users when search or filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter]);

    const filteredUsers = users;

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Owner': return 'purple';
            case 'Admin': return 'blue';
            case 'SchoolAdmin': return 'blue';
            case 'Teacher': return 'green';
            case 'Student': return 'orange';
            case 'Parent': return 'pink';
            case 'Individual': return 'cyan';
            default: return 'gray';
        }
    };

    const handleViewProfile = (user: User) => {
        setSelectedUser(user);
        setShowProfileModal(true);
    };

    const handleAddUser = async () => {
        // Sanitize inputs
        const sanitized = {
            name: sanitizeText(userForm.name),
            email: userForm.email.trim().toLowerCase(),
            password: userForm.password,
            role: userForm.role as 'Owner' | 'SchoolAdmin' | 'Teacher' | 'Student' | 'Parent' | 'Individual'
        };
        
        // Validate with Zod
        const result = userCreationSchema.safeParse(sanitized);
        if (!result.success) {
            handleError(result.error, result.error.issues[0].message);
            return;
        }

        setSaving(true);
        try {
            const newUser = await userManagementService.createUser({
                name: result.data.name,
                email: result.data.email,
                password: result.data.password,
                role: result.data.role,
                emailVisibility: true
            }, currentUser?.id);

            // Optimistic UI update
            setUsers([newUser, ...users]);

            setShowAddModal(false);
            setUserForm({ name: '', email: '', password: '', role: 'Student' });

            // Reload stats
            await loadStats();
        } catch (error: any) {
            handleError(error, 'Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        // Optimistic UI update
        const previousUsers = [...users];
        setUsers(users.filter(u => u.id !== userId));

        try {
            await userManagementService.deleteUser(userId, currentUser?.id, true);
            await loadStats();
        } catch (error) {
            handleError(error, 'Failed to delete user');
            // Rollback on failure
            setUsers(previousUsers);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all users across the platform</p>
                </div>
                <Button name="add-user" aria-label="Add new user" variant="primary" className="bg-[#002366] hover:bg-[#001a4d] text-white border-none shadow-md" onClick={() => setShowAddModal(true)}>
                    <Icon name="PlusIcon" className="w-5 h-5 mr-2" />
                    Add User
                </Button>
            </div>

            <Card className="p-6">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <Input
                            name="search-users"
                            aria-label="Search users"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<Icon name="MagnifyingGlassIcon" className="w-5 h-5 text-gray-400" />}
                        />
                    </div>
                    <div className="w-48">
                        <Select
                            name="role-filter"
                            aria-label="Filter by role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value="Owner">Owner</option>
                            <option value="Admin">Admin</option>
                            <option value="Teacher">Teacher</option>
                            <option value="Student">Student</option>
                            <option value="Parent">Parent</option>
                        </Select>
                    </div>
                </div>

                <WidgetErrorBoundary title="User List">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">User</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Role</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Joined</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8">
                                            <TableSkeleton rows={5} />
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">No users found</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="font-bold text-gray-500">{user.name.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={getRoleColor(user.role) as any}>{user.role}</Badge>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">
                                                {new Date(user.created).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <DropdownMenu
                                                    trigger={<IconButton name="EllipsisHorizontalIcon" />}
                                                    align="right"
                                                    items={[
                                                        {
                                                            label: 'View Profile',
                                                            icon: 'User',
                                                            onClick: () => handleViewProfile(user)
                                                        },
                                                        {
                                                            label: 'Impersonate User',
                                                            icon: 'Eye',
                                                            onClick: async () => {
                                                                if (window.confirm(`Are you sure you want to impersonate ${user.name}?`)) {
                                                                    try {
                                                                        await startImpersonation(user.id);
                                                                        window.location.href = '/';
                                                                    } catch (e) {
                                                                        alert('Failed to impersonate: ' + e);
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        {
                                                            label: 'Delete User',
                                                            icon: 'Trash',
                                                            onClick: () => handleDeleteUser(user.id),
                                                            danger: true
                                                        }
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </WidgetErrorBoundary>
            </Card>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New User</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                <Input
                                    name="user-name"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                <Input
                                    name="user-email"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                                <Input
                                    name="user-password"
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder="Minimum 8 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <Select
                                    name="user-role"
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button name="modal-cancel" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                                <Button name="modal-create-user" variant="primary" onClick={handleAddUser} className="flex-1" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create User'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* User Profile Modal */}
            {showProfileModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Profile</h3>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-4">
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-500">{selectedUser.name.charAt(0)}</span>
                                )}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h4>
                            <Badge variant={getRoleColor(selectedUser.role) as any} className="mt-2">{selectedUser.role}</Badge>
                        </div>
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email</span>
                                <span className="text-gray-900 dark:text-white">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">User ID</span>
                                <span className="text-gray-900 dark:text-white font-mono text-sm">{selectedUser.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Joined</span>
                                <span className="text-gray-900 dark:text-white">{new Date(selectedUser.created).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <Button name="modal-close" variant="secondary" onClick={() => setShowProfileModal(false)} className="flex-1">Close</Button>
                            <Button
                                name="modal-impersonate"
                                variant="primary"
                                onClick={async () => {
                                    if (confirm(`Impersonate ${selectedUser.name}?`)) {
                                        await startImpersonation(selectedUser.id);
                                        window.location.href = '/';
                                    }
                                }}
                                className="flex-1"
                            >
                                Impersonate
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div >
    );
};

export default UserManagement;
