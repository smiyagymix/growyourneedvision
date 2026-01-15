import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';

export interface User extends RecordModel {
    name: string;
    email: string;
    avatar?: string;
    role: 'Owner' | 'SchoolAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';
    verified: boolean;
    lastActive?: string;
    tenant?: string;
    phone?: string;
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

export interface CoreUserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    byRole: Record<string, number>;
}

class UserService {
    /**
     * Get all users with optional filtering
     */
    async getUsers(role?: string, page = 1, perPage = 50): Promise<{ items: User[], totalItems: number, totalPages: number }> {
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
        try {
            return await pb.collection('users').update<User>(id, { verified: true });
        } catch {
            return null;
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats(tenantId?: string): Promise<CoreUserStats> {
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

            // In production, the backend would trigger an email delivery
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
