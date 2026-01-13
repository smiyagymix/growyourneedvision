
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import pb from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';
import { ipRateLimitingService } from '../services/ipRateLimitingService';

// Define User type based on PocketBase 'users' collection
export interface User extends RecordModel {
  name: string;
  email: string;
  role: 'Owner' | 'SchoolAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Individual';
  avatar?: string;
  tenantId?: string; // Link to a School or Organization
  emailVisibility?: boolean;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passwordConfirm: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realUser, setRealUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Refresh auth store to ensure we have latest user data (like roles)
    const refreshAuth = async () => {
      if (pb.authStore.isValid) {
        try {
          // Disable auto-cancellation to prevent React Strict Mode double-fetch issues
          const authData = await pb.collection('users').authRefresh({ requestKey: null });
          setUser(authData.record as User);
          setRealUser(authData.record as User);
        } catch (err) {
          // Ignore auto-cancellation errors
          if (err instanceof Error && err.name === 'AbortError') return;
          // PocketBase specific error check
          const isAbort = (err as { isAbort?: boolean }).isAbort;
          if (isAbort) return;

          console.warn("Session expired or invalid:", err instanceof Error ? err.message : String(err));
          // If refresh fails (e.g. deleted user), clear auth
          pb.authStore.clear();
          setUser(null);
          setRealUser(null);
        }
      }
      setLoading(false);
    };

    refreshAuth();

    // Listen to auth state changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      console.log("Auth State Changed:", model);
      if (!isImpersonating) {
        setUser(model as User | null);
        setRealUser(model as User | null);
      }
    }, false); // Don't trigger immediately, we handled it with refreshAuth

    return () => {
      unsubscribe();
    };
  }, [isImpersonating]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. IP Rate Limit Check
      if (!isMockEnv()) {
        try {
          // Note: In a real app we'd get IP from a service or the backend would handle this.
          // For now we check the platform-wide rate limit.
          const check = await ipRateLimitingService.checkRateLimit('platform', 'current-session');
          if (check && !check.allowed) {
            const errorMsg = `Too many attempts from this IP. ${check.reason || 'Please try again later.'}`;
            setError(errorMsg);
            throw new Error(errorMsg);
          }
        } catch (e) {
          // Only throw if it's an actual rate limit block, not a network error
          if (e instanceof Error && e.message.includes('Too many attempts')) {
            throw e;
          }
          // Log warning but don't block on service unavailability
          console.warn("Rate limit check unavailable (proceeding anyway):", e instanceof Error ? e.message : e);
        }
      }

      // 2. Mock Auth
      if (isMockEnv()) {
        const normalizedEmail = (email || '').toLowerCase();
        const roleMap: Record<string, User['role']> = {
          'owner@growyourneed.com': 'Owner',
          'admin@school.com': 'SchoolAdmin',
          'teacher@school.com': 'Teacher',
          'student@school.com': 'Student',
          'parent@school.com': 'Parent',
          'individual@individual.com': 'Individual',
        };

        let role = roleMap[normalizedEmail];
        if (!role) {
          if (normalizedEmail.includes('owner')) role = 'Owner';
          else if (normalizedEmail.includes('schooladmin') || normalizedEmail.includes('admin')) role = 'SchoolAdmin';
          else if (normalizedEmail.includes('teacher')) role = 'Teacher';
          else if (normalizedEmail.includes('student')) role = 'Student';
          else if (normalizedEmail.includes('parent')) role = 'Parent';
          else if (normalizedEmail.includes('individual')) role = 'Individual';
        }

        if (!role) {
          const errorMessage = 'Invalid credentials';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        const roleNameMap: Record<User['role'], string> = {
          Owner: 'Owner User',
          SchoolAdmin: 'School Admin',
          Admin: 'School Admin',
          Teacher: 'Sarah Smith',
          Student: 'Alex Student',
          Parent: 'Jordan Parent',
          Individual: 'Indie User',
        };

        const mockUser: User = {
          id: `mock-${role.toLowerCase()}`,
          collectionId: 'mock',
          collectionName: 'users',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          email,
          name: roleNameMap[role] || `${role} User`,
          role,
          verified: true,
          emailVisibility: true,
        } as User;

        // Persist into PocketBase auth store so downstream consumers stay consistent
        pb.authStore.save('mock-token', mockUser);
        setUser(mockUser);
        setRealUser(mockUser);
        return;
      }

      const authData = await pb.collection('users').authWithPassword(email, password);
      // Explicitly set user to ensure state is consistent immediately
      setUser(authData.record as User);
      setRealUser(authData.record as User);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to login";
      console.error("Login failed:", err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, passwordConfirm: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create the user
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
        role: 'Individual', // Default role for self-registration
        emailVisibility: true,
      });

      // 2. Auto-login after registration
      await login(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register";
      console.error("Registration failed:", err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // logout is now memoized below the context value

  const startImpersonation = async (userId: string) => {
    // Only allowed if real user is Owner or Admin
    if (!realUser || !['Owner', 'Admin', 'SchoolAdmin'].includes(realUser.role)) {
      throw new Error("Unauthorized to impersonate");
    }

    try {
      // Fetch the target user details
      const targetUser = await pb.collection('users').getOne(userId);
      setUser(targetUser as User); // Swap the context user
      setIsImpersonating(true);
      // Note: We do NOT update pb.authStore, so API calls still use Admin token
      // This allows fetching data, but RLS might block if it relies on auth.id
      // However, we are simulating the frontend experience.
    } catch (e) {
      console.error("Failed to impersonate", e);
      throw e;
    }
  };

  const stopImpersonation = () => {
    if (realUser) {
      setUser(realUser);
      setIsImpersonating(false);
    }
  };

  // Memoize logout to prevent re-renders
  const memoizedLogout = useCallback(() => {
    setIsImpersonating(false);
    pb.authStore.clear();
    setUser(null);
    setRealUser(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout: memoizedLogout,
    loading,
    error,
    startImpersonation,
    stopImpersonation,
    isImpersonating
  }), [user, login, register, memoizedLogout, loading, error, startImpersonation, stopImpersonation, isImpersonating]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
