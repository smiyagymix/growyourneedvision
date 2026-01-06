import React, { useState, useEffect } from 'react';
import { useRealtimeContext } from '../../context/RealtimeContext';
import { Icon } from './ui/CommonUI';
import { motion, AnimatePresence } from 'framer-motion';

export const RealtimeStatus: React.FC = () => {
    const { isConnected, notifications, markAsRead } = useRealtimeContext();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.is_read).length);
    }, [notifications]);

    // Auto-open if new high-priority notification arrives (optional, maybe just for errors)
    useEffect(() => {
        if (notifications.length > 0 && notifications[0].type === 'error') {
            setIsOpen(true);
        }
    }, [notifications]);

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-gray-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl w-80 mb-2 flex flex-col max-h-[60vh]"
                    >
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                <Icon name="BellIcon" className="w-4 h-4 text-gyn-blue" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <Icon name="XMarkIcon" className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px] custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <motion.div 
                                        key={n.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={`p-3 rounded-xl border text-sm relative group transition-all ${
                                            n.is_read 
                                                ? 'bg-gray-50 dark:bg-slate-800/50 border-transparent opacity-70' 
                                                : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                                n.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                                                n.type === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                                                n.type === 'warning' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${n.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(n.created).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {!n.is_read && (
                                                <button 
                                                    onClick={() => markAsRead(n.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-600 p-1"
                                                    title="Mark as read"
                                                >
                                                    <Icon name="CheckCircleIcon" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-xs text-center">
                                    <Icon name="BellIcon" className="w-8 h-8 mb-2 opacity-20" />
                                    <p>No new notifications</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Pill / Toggle */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border transition-all ${
                    isConnected 
                    ? 'bg-white/80 dark:bg-slate-900/80 text-green-600 border-green-500/30 hover:border-green-500/50' 
                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                }`}
            >
                <div className="relative">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    {isConnected && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />}
                </div>
                
                <span className="hidden sm:inline-block">
                    {isConnected ? 'Platform Online' : 'Reconnecting...'}
                </span>

                {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unreadCount}
                    </span>
                )}

                <Icon name={isOpen ? "ChevronDownIcon" : "ChevronUpIcon"} className="w-3 h-3 opacity-50" />
            </motion.button>
        </div>
    );
};
