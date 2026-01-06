import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '../../lib/pocketbase';
import { User } from '../../context/AuthContext';

interface SchoolStats {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalParents: number;
}

interface SchoolContextType {
    users: User[];
    stats: SchoolStats;
    loading: boolean;
    refreshData: () => Promise<void>;
    addUser: (userData: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SchoolStats>({
        totalStudents: 0,
        totalTeachers: 0,
        totalStaff: 0,
        totalParents: 0,
    });
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch all users for now (in a real app, filter by school/tenant)
            const records = await pb.collection('users').getFullList<User>({
                sort: '-created',
                requestKey: null,
            });
            setUsers(records);

            // Calculate stats
            const newStats = {
                totalStudents: records.filter(u => u.role === 'Student').length,
                totalTeachers: records.filter(u => u.role === 'Teacher').length,
                totalStaff: records.filter(u => u.role === 'SchoolAdmin').length, // Assuming Admin is staff for now
                totalParents: records.filter(u => u.role === 'Parent').length,
            };
            setStats(newStats);
        } catch (error) {
            console.error("Failed to fetch school data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addUser = async (userData: Partial<User>) => {
        try {
            await pb.collection('users').create({
                ...userData,
                password: 'password123', // Default password for created users
                passwordConfirm: 'password123',
                emailVisibility: true,
            });
            await refreshData();
        } catch (error) {
            console.error("Failed to create user:", error);
            throw error;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await pb.collection('users').delete(id);
            await refreshData();
        } catch (error) {
            console.error("Failed to delete user:", error);
            throw error;
        }
    };

    return (
        <SchoolContext.Provider value={{ users, stats, loading, refreshData, addUser, deleteUser }}>
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
