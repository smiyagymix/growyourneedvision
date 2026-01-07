import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import pb from '../../lib/pocketbase';
import { User, useAuth } from '../../context/AuthContext';
import { generateTemporaryPassword } from '../../utils/securePassword';
import { isMockEnv } from '../../utils/mockData';

interface SchoolStats {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalParents: number;
    activeUsers: number;
    pendingInvites: number;
}

interface SchoolError {
    code: string;
    message: string;
    timestamp: Date;
}

interface SchoolContextType {
    users: User[];
    stats: SchoolStats;
    loading: boolean;
    error: SchoolError | null;
    tenantId: string | null;
    refreshData: () => Promise<void>;
    addUser: (userData: Partial<User>) => Promise<{ success: boolean; tempPassword?: string; error?: string }>;
    updateUser: (id: string, userData: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    clearError: () => void;
}

const initialStats: SchoolStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalParents: 0,
    activeUsers: 0,
    pendingInvites: 0,
};

// Mock data for E2E/development without PocketBase
const MOCK_USERS: User[] = [
    {
        id: 'mock-student-1',
        collectionId: 'users',
        collectionName: 'users',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        email: 'student1@school.com',
        name: 'Alex Student',
        role: 'Student',
        verified: true,
    } as User,
    {
        id: 'mock-teacher-1',
        collectionId: 'users',
        collectionName: 'users',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        email: 'teacher1@school.com',
        name: 'Sarah Teacher',
        role: 'Teacher',
        verified: true,
    } as User,
];

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SchoolStats>(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<SchoolError | null>(null);

    // Get tenant ID from current user
    const tenantId = useMemo(() => {
        return currentUser?.tenantId || null;
    }, [currentUser?.tenantId]);

    // Build tenant filter for queries
    const buildTenantFilter = useCallback((): string => {
        if (!tenantId) return '';
        return `tenantId = "${tenantId}"`;
    }, [tenantId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const setErrorState = useCallback((code: string, message: string) => {
        setError({
            code,
            message,
            timestamp: new Date(),
        });
    }, []);

    const refreshData = useCallback(async () => {
        setLoading(true);
        clearError();

        // Handle mock environment
        if (isMockEnv()) {
            setUsers(MOCK_USERS);
            setStats({
                totalStudents: MOCK_USERS.filter(u => u.role === 'Student').length,
                totalTeachers: MOCK_USERS.filter(u => u.role === 'Teacher').length,
                totalStaff: MOCK_USERS.filter(u => u.role === 'SchoolAdmin' || u.role === 'Admin').length,
                totalParents: MOCK_USERS.filter(u => u.role === 'Parent').length,
                activeUsers: MOCK_USERS.length,
                pendingInvites: 0,
            });
            setLoading(false);
            return;
        }

        try {
            const filter = buildTenantFilter();
            
            // Fetch users with tenant isolation
            const records = await pb.collection('users').getFullList<User>({
                filter: filter || undefined,
                sort: '-created',
                requestKey: null,
            });
            setUsers(records);

            // Calculate stats from fetched data
            const newStats: SchoolStats = {
                totalStudents: records.filter(u => u.role === 'Student').length,
                totalTeachers: records.filter(u => u.role === 'Teacher').length,
                totalStaff: records.filter(u => u.role === 'SchoolAdmin' || u.role === 'Admin').length,
                totalParents: records.filter(u => u.role === 'Parent').length,
                activeUsers: records.filter(u => u.verified).length,
                pendingInvites: records.filter(u => !u.verified).length,
            };
            setStats(newStats);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch school data';
            console.error('SchoolContext: Failed to fetch data:', err);
            setErrorState('FETCH_ERROR', errorMessage);
            
            // Set empty state on error
            setUsers([]);
            setStats(initialStats);
        } finally {
            setLoading(false);
        }
    }, [buildTenantFilter, clearError, setErrorState]);

    // Refresh data when tenant changes
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const addUser = useCallback(async (userData: Partial<User>): Promise<{ success: boolean; tempPassword?: string; error?: string }> => {
        clearError();

        if (isMockEnv()) {
            // In mock mode, simulate success
            const mockUser: User = {
                id: `mock-${Date.now()}`,
                collectionId: 'users',
                collectionName: 'users',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                email: userData.email || '',
                name: userData.name || '',
                role: userData.role || 'Student',
                verified: true,
            } as User;
            setUsers(prev => [...prev, mockUser]);
            return { success: true, tempPassword: 'mock-password' };
        }

        try {
            // Generate a secure temporary password for new users
            const tempPassword = generateTemporaryPassword();
            
            // Create user with tenant isolation
            await pb.collection('users').create({
                ...userData,
                password: tempPassword,
                passwordConfirm: tempPassword,
                emailVisibility: true,
                mustChangePassword: true,
                tenantId: tenantId || userData.tenantId, // Ensure tenant isolation
                verified: false, // Require email verification
            });
            
            await refreshData();
            
            return { success: true, tempPassword };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
            console.error('SchoolContext: Failed to create user:', err);
            setErrorState('CREATE_ERROR', errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [clearError, tenantId, refreshData, setErrorState]);

    const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
        clearError();

        if (isMockEnv()) {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
            return;
        }

        try {
            // Prevent changing tenantId
            const { tenantId: _, ...safeData } = userData as any;
            
            await pb.collection('users').update(id, safeData);
            await refreshData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
            console.error('SchoolContext: Failed to update user:', err);
            setErrorState('UPDATE_ERROR', errorMessage);
            throw err;
        }
    }, [clearError, refreshData, setErrorState]);

    const deleteUser = useCallback(async (id: string) => {
        clearError();

        if (isMockEnv()) {
            setUsers(prev => prev.filter(u => u.id !== id));
            return;
        }

        try {
            // Verify user belongs to current tenant before deletion
            const userToDelete = await pb.collection('users').getOne<User>(id);
            
            if (tenantId && userToDelete.tenantId !== tenantId) {
                throw new Error('Cannot delete user from different tenant');
            }

            await pb.collection('users').delete(id);
            await refreshData();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
            console.error('SchoolContext: Failed to delete user:', err);
            setErrorState('DELETE_ERROR', errorMessage);
            throw err;
        }
    }, [clearError, tenantId, refreshData, setErrorState]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        users,
        stats,
        loading,
        error,
        tenantId,
        refreshData,
        addUser,
        updateUser,
        deleteUser,
        clearError,
    }), [users, stats, loading, error, tenantId, refreshData, addUser, updateUser, deleteUser, clearError]);

    return (
        <SchoolContext.Provider value={contextValue}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};

// Export types for external use
export type { SchoolStats, SchoolError, SchoolContextType };
