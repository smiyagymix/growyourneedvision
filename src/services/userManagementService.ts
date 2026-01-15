import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { auditLog } from './auditLogger';

/**
 * User Management Service
 * Handles all user-related operations for the Owner role
 */

export interface ManagementUser extends RecordModel {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    emailVisibility?: boolean;
    verified?: boolean;
    tenant_id?: string;
    last_login?: string;
    status?: 'active' | 'suspended' | 'deleted';
}

export interface CreateManagementUserData {
    name: string;
    email: string;
    password: string;
    role: string;
    tenant_id?: string;
    emailVisibility?: boolean;
}

export interface UpdateManagementUserData {
    name?: string;
    email?: string;
    role?: string;
    status?: 'active' | 'suspended' | 'deleted';
    avatar?: File;
}

export interface ManagementUserFilters {
    search?: string;
    role?: string;
    tenant_id?: string;
    status?: 'active' | 'suspended' | 'deleted';
}

export interface ManagementUserStats {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    recentlyCreated: number; // Last 7 days
}

class UserManagementService {
    private collection = 'users';

    /**
     * Get all users with optional filtering and pagination
     */
    async getManagementUsers(
        page: number = 1,
        pageSize: number = 50,
        filters?: ManagementUserFilters
    ): Promise<{ items: ManagementUser[]; totalItems: number; totalPages: number }> {
        try {
            let filterQuery = '';
            const filterParts: string[] = [];

            if (filters?.search) {
                const search = filters.search.toLowerCase();
                filterParts.push(`(name ~ "${search}" || email ~ "${search}")`);
            }

            if (filters?.role && filters.role !== 'all') {
                filterParts.push(`role = "${filters.role}"`);
            }

            if (filters?.tenant_id) {
                filterParts.push(`tenant_id = "${filters.tenant_id}"`);
            }

            if (filters?.status) {
                filterParts.push(`status = "${filters.status}"`);
            }

            filterQuery = filterParts.join(' && ');

            const result = await pb.collection(this.collection).getList<ManagementUser>(page, pageSize, {
                filter: filterQuery || undefined,
                sort: '-created',
            });

            return {
                items: result.items,
                totalItems: result.totalItems,
                totalPages: result.totalPages
            };
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        }
    }

    /**
     * Get a single user by ID
     */
    async getManagementUser(userId: string): Promise<ManagementUser> {
        try {
            return await pb.collection(this.collection).getOne<ManagementUser>(userId);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     */
    async createManagementUser(data: CreateManagementUserData, createdBy?: string): Promise<ManagementUser> {
        try {
            const userData = {
                name: data.name,
                email: data.email,
                password: data.password,
                passwordConfirm: data.password,
                role: data.role,
                emailVisibility: data.emailVisibility ?? true,
                tenant_id: data.tenant_id,
                status: 'active' as const
            };

            const newManagementUser = await pb.collection(this.collection).create<ManagementUser>(userData);

            // Audit log
            await auditLog.log('user.created', {
                target_type: 'user',
                target_id: newManagementUser.id,
                user_email: newManagementUser.email,
                user_role: newManagementUser.role,
                created_by: createdBy || 'system'
            }, 'info');

            return newManagementUser;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    /**
     * Update an existing user
     */
    async updateManagementUser(userId: string, data: UpdateManagementUserData, updatedBy?: string): Promise<ManagementUser> {
        try {
            const updateData: any = {};

            if (data.name !== undefined) updateData.name = data.name;
            if (data.email !== undefined) updateData.email = data.email;
            if (data.role !== undefined) updateData.role = data.role;
            if (data.status !== undefined) updateData.status = data.status;

            // Handle avatar upload
            if (data.avatar) {
                updateData.avatar = data.avatar;
            }

            const updatedManagementUser = await pb.collection(this.collection).update<ManagementUser>(userId, updateData);

            // Audit log
            await auditLog.log('user.updated', {
                target_type: 'user',
                target_id: userId,
                updated_fields: Object.keys(data),
                updated_by: updatedBy || 'system'
            }, 'info');

            return updatedManagementUser;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    /**
     * Delete a user (soft delete by changing status)
     */
    async deleteManagementUser(userId: string, deletedBy?: string, hardDelete: boolean = false): Promise<void> {
        try {
            if (hardDelete) {
                await pb.collection(this.collection).delete(userId);
            } else {
                // Soft delete
                await pb.collection(this.collection).update(userId, {
                    status: 'deleted'
                });
            }

            // Audit log
            await auditLog.log(hardDelete ? 'user.hard_deleted' : 'user.soft_deleted', {
                target_type: 'user',
                target_id: userId,
                deleted_by: deletedBy || 'system',
                hard_delete: hardDelete
            }, 'warning');
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }

    /**
     * Suspend a user account
     */
    async suspendManagementUser(userId: string, suspendedBy?: string): Promise<ManagementUser> {
        try {
            const user = await this.updateManagementUser(userId, { status: 'suspended' }, suspendedBy);

            await auditLog.log('user.suspended', {
                target_type: 'user',
                target_id: userId,
                suspended_by: suspendedBy || 'system'
            }, 'warning');

            return user;
        } catch (error) {
            console.error('Failed to suspend user:', error);
            throw error;
        }
    }

    /**
     * Reactivate a suspended user
     */
    async reactivateManagementUser(userId: string, reactivatedBy?: string): Promise<ManagementUser> {
        try {
            const user = await this.updateManagementUser(userId, { status: 'active' }, reactivatedBy);

            await auditLog.log('user.reactivated', {
                target_type: 'user',
                target_id: userId,
                reactivated_by: reactivatedBy || 'system'
            }, 'info');

            return user;
        } catch (error) {
            console.error('Failed to reactivate user:', error);
            throw error;
        }
    }

    /**
     * Get user statistics
     */
    async getManagementUserStats(): Promise<ManagementUserStats> {
        try {
            // Get all users (we'll process them client-side for stats)
            const allManagementUsers = await pb.collection(this.collection).getFullList<ManagementUser>({
                filter: 'status != "deleted"'
            });

            const stats: ManagementUserStats = {
                total: allManagementUsers.length,
                byRole: {},
                byStatus: {},
                recentlyCreated: 0
            };

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            allManagementUsers.forEach(user => {
                // Count by role
                stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

                // Count by status
                const status = user.status || 'active';
                stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

                // Count recently created
                if (new Date(user.created) > sevenDaysAgo) {
                    stats.recentlyCreated++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Failed to get user stats:', error);
            throw error;
        }
    }

    /**
     * Reset user password (admin function)
     */
    async resetManagementUserPassword(userId: string, newPassword: string, resetBy?: string): Promise<void> {
        try {
            await pb.collection(this.collection).update(userId, {
                password: newPassword,
                passwordConfirm: newPassword
            });

            await auditLog.log('user.password_reset', {
                target_type: 'user',
                target_id: userId,
                reset_by: resetBy || 'system'
            }, 'warning');
        } catch (error) {
            console.error('Failed to reset password:', error);
            throw error;
        }
    }

    /**
     * Bulk operations
     */
    async bulkUpdateManagementUsers(userIds: string[], updates: Partial<UpdateManagementUserData>, updatedBy?: string): Promise<void> {
        try {
            const promises = userIds.map(id => this.updateManagementUser(id, updates, updatedBy));
            await Promise.all(promises);

            await auditLog.log('user.bulk_updated', {
                target_type: 'user',
                target_id: 'bulk',
                user_count: userIds.length,
                updates: Object.keys(updates),
                updated_by: updatedBy || 'system'
            }, 'info');
        } catch (error) {
            console.error('Failed to bulk update users:', error);
            throw error;
        }
    }

    /**
     * Get avatar URL for a user
     */
    getAvatarUrl(user: ManagementUser): string | undefined {
        if (!user.avatar) return undefined;
        return pb.files.getUrl(user, user.avatar);
    }
}

export const userManagementService = new UserManagementService();
export default userManagementService;
