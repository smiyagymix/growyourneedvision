import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

export interface User extends RecordModel {
    name: string;
    email: string;
    avatar?: string;
    role: 'Owner' | 'SchoolAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';
    verified: boolean;
    lastActive?: string;
    tenant?: string;
    // Student specific
    student_id?: string;
    grade_level?: string;
    parent_email?: string;
    // Teacher specific
    department?: string;
    specialization?: string;
}

export interface CreateUserParams {
    email: string;
    password?: string;
    passwordConfirm?: string;
    name: string;
    role: 'Student' | 'Teacher' | 'Parent' | 'SchoolAdmin' | 'Individual' | 'Owner';
    verified?: boolean;
    tenant?: string;
    // Additional fields
    student_id?: string;
    grade_level?: string;
    department?: string;
    specialization?: string;
    parent_email?: string;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    byRole: Record<string, number>;
}

// Mock Data
const MOCK_USERS: User[] = [
    {
        id: 'user-owner',
        name: 'System Owner',
        email: 'owner@growyourneed.com',
        avatar: '',
        role: 'Owner',
        verified: true,
        lastActive: new Date().toISOString(),
        collectionId: '', collectionName: '', created: '2024-01-01T00:00:00Z', updated: ''
    },
    {
        id: 'user-admin',
        name: 'School Administrator',
        email: 'admin@school.com',
        avatar: '',
        role: 'SchoolAdmin',
        verified: true,
        lastActive: new Date().toISOString(),
        tenant: 'tenant-1',
        collectionId: '', collectionName: '', created: '2024-01-05T00:00:00Z', updated: ''
    },
    {
        id: 'user-teacher-1',
        name: 'John Smith',
        email: 'teacher@school.com',
        avatar: '',
        role: 'Teacher',
        verified: true,
        lastActive: new Date().toISOString(),
        tenant: 'tenant-1',
        department: 'Mathematics',
        specialization: 'Algebra',
        collectionId: '', collectionName: '', created: '2024-01-10T00:00:00Z', updated: ''
    },
    {
        id: 'user-teacher-2',
        name: 'Jane Doe',
        email: 'jane.doe@school.com',
        avatar: '',
        role: 'Teacher',
        verified: true,
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        tenant: 'tenant-1',
        department: 'Science',
        specialization: 'Physics',
        collectionId: '', collectionName: '', created: '2024-01-11T00:00:00Z', updated: ''
    },
    {
        id: 'user-student-1',
        name: 'Alice Johnson',
        email: 'student@school.com',
        avatar: '',
        role: 'Student',
        verified: true,
        lastActive: new Date().toISOString(),
        tenant: 'tenant-1',
        student_id: 'STU001',
        grade_level: '10',
        parent_email: 'parent@example.com',
        collectionId: '', collectionName: '', created: '2024-01-15T00:00:00Z', updated: ''
    },
    {
        id: 'user-student-2',
        name: 'Bob Williams',
        email: 'bob.williams@school.com',
        avatar: '',
        role: 'Student',
        verified: true,
        lastActive: new Date(Date.now() - 172800000).toISOString(),
        tenant: 'tenant-1',
        student_id: 'STU002',
        grade_level: '10',
        collectionId: '', collectionName: '', created: '2024-01-16T00:00:00Z', updated: ''
    },
    {
        id: 'user-parent',
        name: 'Sarah Johnson',
        email: 'parent@example.com',
        avatar: '',
        role: 'Parent',
        verified: true,
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        tenant: 'tenant-1',
        collectionId: '', collectionName: '', created: '2024-01-17T00:00:00Z', updated: ''
    },
    {
        id: 'user-individual',
        name: 'Mike Individual',
        email: 'individual@example.com',
        avatar: '',
        role: 'Individual',
        verified: true,
        lastActive: new Date().toISOString(),
        collectionId: '', collectionName: '', created: '2024-01-20T00:00:00Z', updated: ''
    }
];

class UserService {
    /**
     * Get all users with optional filtering
     */
    async getUsers(role?: string, page = 1, perPage = 50): Promise<{ items: User[], totalItems: number, totalPages: number }> {
        if (isMockEnv()) {
            let users = [...MOCK_USERS];
            if (role) {
                users = users.filter(u => u.role === role);
            }
            const start = (page - 1) * perPage;
            const paginatedUsers = users.slice(start, start + perPage);
            return {
                items: paginatedUsers,
                totalItems: users.length,
                totalPages: Math.ceil(users.length / perPage)
            };
        }

        try {
            const filter = role ? `role = "${role}"` : '';
            const result = await pb.collection('users').getList<User>(page, perPage, {
                filter,
                sort: '-created',
            });
            return result;
        } catch (error) {
            console.error('Failed to get users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User | null> {
        if (isMockEnv()) {
            return MOCK_USERS.find(u => u.id === id) || null;
        }

        try {
            return await pb.collection('users').getOne<User>(id);
        } catch {
            return null;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        if (isMockEnv()) {
            return MOCK_USERS.find(u => u.email === email) || null;
        }

        try {
            return await pb.collection('users').getFirstListItem<User>(`email = "${email}"`);
        } catch {
            return null;
        }
    }

    /**
     * Get users by tenant
     */
    async getUsersByTenant(tenantId: string, role?: string): Promise<User[]> {
        if (isMockEnv()) {
            let users = MOCK_USERS.filter(u => u.tenant === tenantId);
            if (role) {
                users = users.filter(u => u.role === role);
            }
            return users;
        }

        try {
            let filter = `tenant = "${tenantId}"`;
            if (role) {
                filter += ` && role = "${role}"`;
            }
            return await pb.collection('users').getFullList<User>({
                filter,
                sort: '-created'
            });
        } catch {
            return [];
        }
    }

    /**
     * Create a new user
     */
    async createUser(data: CreateUserParams): Promise<User> {
        if (isMockEnv()) {
            const password = data.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: data.name,
                email: data.email,
                avatar: '',
                role: data.role as User['role'],
                verified: data.verified ?? false,
                lastActive: new Date().toISOString(),
                tenant: data.tenant,
                student_id: data.student_id,
                grade_level: data.grade_level,
                parent_email: data.parent_email,
                department: data.department,
                specialization: data.specialization,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_USERS.push(newUser);
            console.log(`Mock user created with password: ${password}`);
            return newUser;
        }

        try {
            const password = data.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            const userData = {
                ...data,
                password,
                passwordConfirm: password,
                emailVisibility: true,
            };

            const record = await pb.collection('users').create<User>(userData);
            return record;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    /**
     * Update an existing user
     */
    async updateUser(id: string, data: Partial<User>): Promise<User | null> {
        if (isMockEnv()) {
            const user = MOCK_USERS.find(u => u.id === id);
            if (user) {
                Object.assign(user, data);
            }
            return user || null;
        }

        try {
            return await pb.collection('users').update<User>(id, data);
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    /**
     * Update user last active timestamp
     */
    async updateLastActive(id: string): Promise<void> {
        if (isMockEnv()) {
            const user = MOCK_USERS.find(u => u.id === id);
            if (user) {
                user.lastActive = new Date().toISOString();
            }
            return;
        }

        try {
            await pb.collection('users').update(id, { lastActive: new Date().toISOString() });
        } catch {
            // Silent fail for activity tracking
        }
    }

    /**
     * Delete a user
     */
    async deleteUser(id: string): Promise<boolean> {
        if (isMockEnv()) {
            const index = MOCK_USERS.findIndex(u => u.id === id);
            if (index !== -1) {
                MOCK_USERS.splice(index, 1);
            }
            return true;
        }

        try {
            await pb.collection('users').delete(id);
            return true;
        } catch (error) {
            console.error('Failed to delete user:', error);
            return false;
        }
    }

    /**
     * Bulk delete users
     */
    async deleteUsers(ids: string[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const id of ids) {
            const deleted = await this.deleteUser(id);
            if (deleted) {
                success++;
            } else {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Search users
     */
    async searchUsers(query: string, role?: string): Promise<User[]> {
        if (isMockEnv()) {
            const lowerQuery = query.toLowerCase();
            let users = MOCK_USERS.filter(u =>
                u.name.toLowerCase().includes(lowerQuery) ||
                u.email.toLowerCase().includes(lowerQuery)
            );
            if (role) {
                users = users.filter(u => u.role === role);
            }
            return users.slice(0, 20);
        }

        try {
            let filter = `name ~ "${query}" || email ~ "${query}"`;
            if (role) {
                filter = `(${filter}) && role = "${role}"`;
            }

            return await pb.collection('users').getFullList<User>({
                filter,
                sort: '-created',
            });
        } catch (error) {
            console.error('Failed to search users:', error);
            return [];
        }
    }

    /**
     * Verify user email
     */
    async verifyUser(id: string): Promise<User | null> {
        if (isMockEnv()) {
            const user = MOCK_USERS.find(u => u.id === id);
            if (user) {
                user.verified = true;
            }
            return user || null;
        }

        try {
            return await pb.collection('users').update<User>(id, { verified: true });
        } catch {
            return null;
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(tenantId?: string): Promise<UserStats> {
        if (isMockEnv()) {
            let users = [...MOCK_USERS];
            if (tenantId) {
                users = users.filter(u => u.tenant === tenantId);
            }

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const byRole: Record<string, number> = {};
            users.forEach(u => {
                byRole[u.role] = (byRole[u.role] || 0) + 1;
            });

            return {
                totalUsers: users.length,
                activeUsers: users.filter(u =>
                    u.lastActive && new Date(u.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length,
                newUsersThisMonth: users.filter(u =>
                    new Date(u.created) >= monthStart
                ).length,
                byRole
            };
        }

        try {
            const filter = tenantId ? `tenant = "${tenantId}"` : '';
            const users = await pb.collection('users').getFullList<User>({ filter });

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const byRole: Record<string, number> = {};
            users.forEach(u => {
                byRole[u.role] = (byRole[u.role] || 0) + 1;
            });

            return {
                totalUsers: users.length,
                activeUsers: users.filter(u =>
                    u.lastActive && new Date(u.lastActive) > weekAgo
                ).length,
                newUsersThisMonth: users.filter(u =>
                    new Date(u.created) >= monthStart
                ).length,
                byRole
            };
        } catch (error) {
            console.error('Failed to get user stats:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                newUsersThisMonth: 0,
                byRole: {}
            };
        }
    }

    /**
     * Get online users (active in last 5 minutes)
     */
    async getOnlineUsers(tenantId?: string): Promise<User[]> {
        if (isMockEnv()) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            let users = MOCK_USERS.filter(u =>
                u.lastActive && new Date(u.lastActive) > fiveMinutesAgo
            );
            if (tenantId) {
                users = users.filter(u => u.tenant === tenantId);
            }
            return users;
        }

        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            let filter = `lastActive >= "${fiveMinutesAgo}"`;
            if (tenantId) {
                filter += ` && tenant = "${tenantId}"`;
            }

            return await pb.collection('users').getFullList<User>({
                filter,
                sort: '-lastActive'
            });
        } catch {
            return [];
        }
    }

    /**
     * Invite user via email
     */
    async inviteUser(email: string, role: User['role'], tenantId?: string): Promise<{ success: boolean; userId?: string }> {
        if (isMockEnv()) {
            const tempPassword = Math.random().toString(36).slice(-8);
            const newUser: User = {
                id: `user-${Date.now()}`,
                name: email.split('@')[0],
                email,
                avatar: '',
                role,
                verified: false,
                lastActive: undefined,
                tenant: tenantId,
                collectionId: '', collectionName: '', created: new Date().toISOString(), updated: ''
            };
            MOCK_USERS.push(newUser);
            console.log(`Invitation sent to ${email} with temp password: ${tempPassword}`);
            return { success: true, userId: newUser.id };
        }

        try {
            const tempPassword = Math.random().toString(36).slice(-12);
            const user = await pb.collection('users').create({
                email,
                password: tempPassword,
                passwordConfirm: tempPassword,
                name: email.split('@')[0],
                role,
                tenant: tenantId,
                verified: false
            });

            // In production, send email with temp password
            return { success: true, userId: user.id };
        } catch {
            return { success: false };
        }
    }

    /**
     * Change user role
     */
    async changeRole(userId: string, newRole: User['role']): Promise<User | null> {
        return this.updateUser(userId, { role: newRole });
    }

    /**
     * Get users with role hierarchy (for permission checks)
     */
    getRoleHierarchy(): Record<User['role'], number> {
        return {
            'Owner': 100,
            'SchoolAdmin': 80,
            'Admin': 80,
            'Teacher': 50,
            'Parent': 30,
            'Student': 20,
            'Individual': 40
        };
    }

    /**
     * Check if user has permission based on role
     */
    hasPermission(userRole: User['role'], requiredRole: User['role']): boolean {
        const hierarchy = this.getRoleHierarchy();
        return hierarchy[userRole] >= hierarchy[requiredRole];
    }
}

export const userService = new UserService();
