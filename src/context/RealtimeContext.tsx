import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import pb from '../lib/pocketbase';
import { useAuth } from './AuthContext';
import { RecordSubscription } from 'pocketbase';
import { isMockEnv } from '../utils/mockData';

interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created: string;
    user: string;
}

interface RealtimeContextType {
    isConnected: boolean;
    notifications: Notification[];
    onlineUsers: string[]; // List of user IDs
    markAsRead: (id: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Debounce helper to prevent excessive re-renders
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [onlineUsersRaw, setOnlineUsersRaw] = useState<string[]>([]);
    
    // Debounce online users to prevent rapid state updates
    const onlineUsers = useDebounce(onlineUsersRaw, 500);
    
    // Track if audio has been played recently to prevent spam
    const lastAudioPlayRef = useRef<number>(0);

    // 1. Heartbeat & Presence
    useEffect(() => {
        if (!user || isMockEnv()) {
            setIsConnected(true);
            return;
        }

        const updatePresence = async () => {
            try {
                // Update 'lastActive' timestamp for the current user
                // We assume the 'users' collection has a 'lastActive' field.
                // If not, this might fail or be ignored depending on PB strictness.
                // For production, ensure schema has this field.
                await pb.collection('users').update(user.id, {
                    lastActive: new Date().toISOString(),
                });
                setIsConnected(true);
            } catch (err) {
                console.warn("Failed to update presence:", err);
                setIsConnected(false);
            }
        };

        // Initial update
        updatePresence();

        // Interval update (every 60s)
        const interval = setInterval(updatePresence, 60000);

        return () => clearInterval(interval);
    }, [user]);

    // 2. Subscribe to Notifications
    useEffect(() => {
        if (!user || isMockEnv()) return;

        const fetchNotifications = async () => {
            try {
                const res = await pb.collection('notifications').getList<Notification>(1, 20, {
                    // sort: '-created', // Causing 400 Bad Request in this environment
                    filter: `user = "${user.id}" && is_read = false`,
                });
                setNotifications(res.items);
            } catch (e) {
                // Collection might not exist yet
                console.log("Notifications collection not found or empty.");
            }
        };

        fetchNotifications();

        // Subscribe to user's notifications
        pb.collection('notifications').subscribe<Notification>('*', (e) => {
            if (e.record.user !== user.id) return; // Client-side filter if needed

            if (e.action === 'create') {
                setNotifications(prev => [e.record, ...prev].slice(0, 50)); // Limit to 50 notifications
                // Play sound with throttling (max once per 2 seconds)
                const now = Date.now();
                if (now - lastAudioPlayRef.current > 2000) {
                    lastAudioPlayRef.current = now;
                    try {
                        const audio = new Audio('/assets/notification.mp3');
                        audio.play().catch(() => {}); // Silent fail
                    } catch { /* ignore */ }
                }
            } else if (e.action === 'update') {
                setNotifications(prev => prev.map(n => n.id === e.record.id ? e.record : n));
            }
        }).catch(() => {}); // Silent fail for subscription

        return () => {
            pb.collection('notifications').unsubscribe('*');
        };
    }, [user]);

    // 3. Subscribe to Online Users (Simulated via 'users' updates)
    useEffect(() => {
        if (isMockEnv()) return;
        // In a real app, we might have a separate 'presence' collection.
        // Here we listen to 'users' updates to see who is active.
        // This is a simplified approach with batch updates.
        
        let pendingUpdates: string[] = [];
        let updateTimeout: ReturnType<typeof setTimeout> | null = null;
        
        const flushUpdates = () => {
            if (pendingUpdates.length > 0) {
                setOnlineUsersRaw(prev => {
                    const newSet = new Set([...prev, ...pendingUpdates]);
                    pendingUpdates = [];
                    return Array.from(newSet);
                });
            }
        };
        
        const handleUserUpdate = (e: RecordSubscription<any>) => {
            if (e.action === 'update' && e.record.lastActive) {
                const lastActive = new Date(e.record.lastActive).getTime();
                const now = Date.now();
                if (now - lastActive < 5 * 60 * 1000) { // Active in last 5 mins
                    pendingUpdates.push(e.record.id);
                    // Batch updates every 300ms
                    if (!updateTimeout) {
                        updateTimeout = setTimeout(() => {
                            flushUpdates();
                            updateTimeout = null;
                        }, 300);
                    }
                }
            }
        };

        pb.collection('users').subscribe('*', handleUserUpdate).catch(() => {});

        return () => {
            if (updateTimeout) clearTimeout(updateTimeout);
            pb.collection('users').unsubscribe('*');
        };
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        if (isMockEnv()) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            return;
        }
        try {
            await pb.collection('notifications').update(id, { is_read: true });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        isConnected,
        notifications,
        onlineUsers,
        markAsRead
    }), [isConnected, notifications, onlineUsers, markAsRead]);

    return (
        <RealtimeContext.Provider value={contextValue}>
            {children}
        </RealtimeContext.Provider>
    );
};

export const useRealtimeContext = () => {
    const context = useContext(RealtimeContext);
    if (context === undefined) {
        throw new Error('useRealtimeContext must be used within a RealtimeProvider');
    }
    return context;
};
