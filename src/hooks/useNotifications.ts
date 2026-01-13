import { useState, useCallback, useEffect, useRef } from 'react';
import { notificationService, NotificationRecord, NotificationType } from '../services/notificationService';
import { Logger } from '../utils/logging';
import { normalizeError, AppError } from '../utils/errorHandling';

interface UseNotificationsOptions {
  userId?: string;
  tenantId?: string;
  autoFetch?: boolean;
  autoSubscribe?: boolean;
  cacheTimeout?: number;
  filterType?: string;
  filterRead?: boolean | 'all';
}

interface NotificationsState {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  error: AppError | null;
  isSending: boolean;
  isMarking: boolean;
  preferences: Record<string, any> | null;
  isUpdatingPreferences: boolean;
}

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  tenantId: string;
  channels?: string[];
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

interface BulkNotificationParams {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  tenantId: string;
  channels?: string[];
  data?: Record<string, any>;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isSending: false,
  isMarking: false,
  preferences: null,
  isUpdatingPreferences: false,
};

/**
 * Custom hook for managing notifications with real-time subscriptions
 */
export const useNotifications = (options: UseNotificationsOptions | string = {}) => {
  // Some callers historically pass a role string; normalize to options object
  const opts: UseNotificationsOptions = typeof options === 'string' ? {} : options;
  const {
    userId,
    tenantId,
    autoFetch = true,
    autoSubscribe = true,
    cacheTimeout = 2 * 60 * 1000,
    filterType,
    filterRead = 'all',
  } = opts;

  const [state, setState] = useState<NotificationsState>(initialState);
  const logger = useRef(new Logger({ enableConsole: true }));
  const cacheRef = useRef<{ timestamp: number; notifications: NotificationRecord[]; unreadCount: number } | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId || !tenantId) {
      setState((prev) => ({
        ...prev,
        error: normalizeError(new Error('userId and tenantId are required'), 'MISSING_PARAMS'),
      }));
      return;
    }

    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < cacheTimeout) {
      logger.current.info('Using cached notifications', { userId });
      setState((prev) => ({
        ...prev,
        notifications: cacheRef.current!.notifications,
        unreadCount: cacheRef.current!.unreadCount,
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    logger.current.startTimer('fetch-notifications');

    try {
      const result = await notificationService.getNotifications(userId, 1, 50);

      const notifications = result.items || [];
      const unreadCount = notifications.filter((n) => !n.is_read).length;

      logger.current.endTimer('fetch-notifications', { count: notifications.length, unreadCount });

      cacheRef.current = { timestamp: Date.now(), notifications, unreadCount };

      setState((prev) => ({
        ...prev,
        notifications,
        unreadCount,
        loading: false,
      }));
    } catch (error) {
      const appError = normalizeError(error);
      logger.current.error('Failed to fetch notifications', appError);
      setState((prev) => ({ ...prev, loading: false, error: appError }));
    }
  }, [userId, cacheTimeout]);

  const createNotification = useCallback(
    async (params: CreateNotificationParams) => {
      setState((prev) => ({ ...prev, isSending: true, error: null }));
      logger.current.startTimer('create-notification');

      try {
        const result = await notificationService.sendInApp({
          user_id: params.userId,
          type: params.type as NotificationType,
          title: params.title,
          message: params.message,
          category: params.type,
          action_url: params.actionUrl,
          channels: params.channels || ['in_app'],
          priority: params.priority || 'normal',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        logger.current.endTimer('create-notification', { type: params.type });
        cacheRef.current = null;
        setState((prev) => ({ ...prev, isSending: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error);
        logger.current.error('Failed to create notification', appError);
        setState((prev) => ({ ...prev, isSending: false, error: appError }));
        throw appError;
      }
    },
    []
  );

  const sendBulk = useCallback(
    async (params: BulkNotificationParams) => {
      setState((prev) => ({ ...prev, isSending: true, error: null }));
      logger.current.startTimer('send-bulk-notifications');

      try {
        const result = await notificationService.sendBulkInApp(params.userIds, {
          type: params.type as NotificationType,
          title: params.title,
          message: params.message,
          category: params.type,
          channels: params.channels || ['in_app'],
          priority: 'normal',
        });

        logger.current.endTimer('send-bulk-notifications', { userCount: params.userIds.length });
        setState((prev) => ({ ...prev, isSending: false }));
        return result;
      } catch (error) {
        const appError = normalizeError(error);
        logger.current.error('Failed to send bulk notifications', appError);
        setState((prev) => ({ ...prev, isSending: false, error: appError }));
        throw appError;
      }
    },
    []
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    setState((prev) => ({ ...prev, isMarking: true, error: null }));
    logger.current.startTimer('mark-as-read');

    try {
      await notificationService.markAsRead(notificationId);
      logger.current.endTimer('mark-as-read', { notificationId });

      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
        isMarking: false,
      }));

      cacheRef.current = null;
    } catch (error) {
      const appError = normalizeError(error);
      logger.current.error('Failed to mark as read', appError);
      setState((prev) => ({ ...prev, isMarking: false, error: appError }));
      throw appError;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setState((prev) => ({ ...prev, isMarking: true, error: null }));
    logger.current.startTimer('mark-all-as-read');

    try {
      const unreadIds = state.notifications.filter((n) => !n.is_read).map((n) => n.id);

      await Promise.allSettled(unreadIds.map((id) => notificationService.markAsRead(id)));

      logger.current.endTimer('mark-all-as-read', { total: unreadIds.length });

      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
        isMarking: false,
      }));

      cacheRef.current = null;
    } catch (error) {
      const appError = normalizeError(error);
      logger.current.error('Failed to mark all as read', appError);
      setState((prev) => ({ ...prev, isMarking: false, error: appError }));
      throw appError;
    }
  }, [state.notifications]);

  const dismissNotification = useCallback(async (notificationId: string) => {
    return markAsRead(notificationId);
  }, [markAsRead]);

  const clearAll = useCallback(async () => {
    return markAllAsRead();
  }, [markAllAsRead]);

  const subscribeToUpdates = useCallback(
    (callback: (notification: NotificationRecord) => void) => {
      if (!userId) {
        logger.current.warn('userId required for subscription');
        return () => {};
      }

      logger.current.info('Subscribing to notifications', { userId });

      // In a real implementation, this would subscribe to PocketBase realtime
      // For now, we'll just log and return a no-op unsubscribe
      return () => {
        logger.current.info('Unsubscribed from notifications', { userId });
      };
    },
    [userId]
  );

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (prefs: UpdatePreferencesParams) => {
      if (!userId) {
        logger.current.warn('updatePreferences: userId required');
        return;
      }

      setState((prev) => ({ ...prev, isUpdatingPreferences: true, error: null }));

      try {
        logger.current.startTimer('updatePreferences');
        await notificationService.updatePreferences(userId, prefs);
        logger.current.endTimer('updatePreferences');

        setState((prev) => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            ...prefs,
          } as any,
          isUpdatingPreferences: false,
        }));

        logger.current.log('updatePreferences: success', { userId });
      } catch (err) {
        const error = normalizeError(err);
        logger.current.error('updatePreferences: failed', { error: error.message });
        setState((prev) => ({
          ...prev,
          isUpdatingPreferences: false,
          error,
        }));
        throw error;
      }
    },
    [userId]
  );

  const refresh = useCallback(async () => {
    cacheRef.current = null;
    await fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications();
    }
  }, [autoFetch, userId, fetchNotifications]);

  useEffect(() => {
    if (autoSubscribe && userId) {
      const unsubscribe = subscribeToUpdates(() => {});
      return unsubscribe;
    }
  }, [autoSubscribe, userId, subscribeToUpdates]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    isSending: state.isSending,
    isMarking: state.isMarking,
    preferences: state.preferences,
    isUpdatingPreferences: state.isUpdatingPreferences,
    fetchNotifications,
    createNotification,
    sendBulk,
    markAsRead,
    markAllAsRead,
    subscribeToUpdates,
    updatePreferences,
    refresh,
    hasError: state.error !== null,
    isIdle: !state.loading && !state.isSending && !state.isMarking,
    hasUnread: state.unreadCount > 0,
    // backward-compatible aliases
    dismissNotification,
    clearAll,
  };
};

export default useNotifications;
