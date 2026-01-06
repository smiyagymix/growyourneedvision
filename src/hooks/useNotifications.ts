import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
}

export const useNotifications = (role: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                // Removed recipient_role filter to prevent 400 error if field missing
                const records = await pb.collection('notifications').getList(1, 20, {
                    // sort: '-created', // Removed to prevent 400 error
                    requestKey: null // Disable auto-cancellation
                });
                
                const realNotifs = records.items.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    message: item.message,
                    time: new Date(item.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: item.is_read,
                    type: item.type || 'info'
                }));
                
                setNotifications(realNotifs);
            } catch (err: any) {
                console.warn("Failed to load notifications", err);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Real-time subscription
        try {
            pb.collection('notifications').subscribe('*', function (e) {
                if (e.action === 'create') {
                    // Add new notification if it matches our role
                    // Simplified logic for demo
                    fetchNotifications();
                }
            });
        } catch (err) {
            // Ignore subscription errors if collection missing
        }

        return () => {
            pb.collection('notifications').unsubscribe('*');
        };

    }, [role]);

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // In real app: await pb.collection('notifications').update(id, { is_read: true });
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return { notifications, loading, dismissNotification, clearAll };
};
