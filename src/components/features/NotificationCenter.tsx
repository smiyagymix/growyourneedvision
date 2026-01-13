import React, { useState, useCallback } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Logger } from '../../utils/logging';
import NotificationList from './notifications/NotificationList';
import NotificationPreferencesPanel from './notifications/PreferencesPanel';

interface NotificationCenterProps {
  userId: string;
  tenantId: string;
  onNotificationClick?: (notificationId: string) => void;
  onError?: (error: string) => void;
}

/**
 * NotificationCenter: Smart container for notification management
 * 
 * Business Logic:
 * - Fetches and subscribes to real-time notifications
 * - Manages notification preferences
 * - Handles read/unread states
 * - Multi-channel support (email, SMS, push, in-app)
 * - Auto-subscribes to updates
 * 
 * Props:
 * - userId: User identifier
 * - tenantId: Tenant identifier
 * - onNotificationClick: Callback when notification clicked
 * - onError: Error callback
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  tenantId,
  onNotificationClick,
  onError,
}) => {
  const logger = React.useRef(new Logger({ enableConsole: true }));

  // State
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  // Custom hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isMarking,
    preferences,
    isUpdatingPreferences,
    createNotification,
    sendBulk,
    markAsRead,
    markAllAsRead,
    subscribeToUpdates,
    updatePreferences,
    refresh,
  } = useNotifications({
    userId,
    tenantId,
    autoFetch: true,
    autoSubscribe: true,
  });

  /**
   * Handle notification click
   */
  const handleNotificationClick = useCallback(
    async (notificationId: string, isRead: boolean) => {
      logger.current.startTimer('notification-click');

      try {
        if (!isRead) {
          logger.current.info('Marking notification as read', { notificationId });
          await markAsRead(notificationId);
        }

        logger.current.endTimer('notification-click', { marked: !isRead });
        onNotificationClick?.(notificationId);
      } catch (err) {
        logger.current.error('Failed to mark as read', err);
        onError?.('Failed to mark notification as read');
      }
    },
    [markAsRead, onNotificationClick, onError]
  );

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    logger.current.info('Marking all as read');

    try {
      await markAllAsRead();
      logger.current.info('All notifications marked as read');
    } catch (err) {
      logger.current.error('Failed to mark all as read', err);
      onError?.('Failed to mark all as read');
    }
  }, [markAllAsRead, onError]);

  /**
   * Handle updating preferences
   */
  const handleUpdatePreferences = useCallback(
    async (prefs: any) => {
      logger.current.startTimer('update-preferences');

      try {
        logger.current.info('Updating notification preferences');
        await updatePreferences(prefs);
        logger.current.endTimer('update-preferences', { success: true });
      } catch (err) {
        logger.current.error('Failed to update preferences', err);
        onError?.('Failed to update preferences');
      }
    },
    [updatePreferences, onError]
  );

  /**
   * Get notification type counts
   */
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n: any) => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // Filter notifications based on active tab
  const displayedNotifications = React.useMemo(() => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = filtered.filter((n: any) => !n.is_read);
    }

    if (filterType) {
      filtered = filtered.filter((n: any) => n.type === filterType);
    }

    return filtered;
  }, [notifications, activeTab, filterType]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
          <p className="mt-1 text-sm text-gray-600">
            {unreadCount > 0 ? (
              <>
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                  {unreadCount} Unread
                </span>
              </>
            ) : (
              'All notifications read'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarking}
              className="px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
            >
              {isMarking ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">Error: {(error as any).message}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 flex gap-4 overflow-x-auto">
        {['all', 'unread', 'preferences'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'all' && `All (${notifications.length})`}
            {tab === 'unread' && `Unread (${unreadCount})`}
            {tab === 'preferences' && 'Preferences'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* All & Unread Tabs */}
        {(activeTab === 'all' || activeTab === 'unread') && (
          <div className="space-y-4">
            {/* Type Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType(undefined)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Types
              </button>
              {Object.entries(typeCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type} ({count})
                </button>
              ))}
            </div>

            {/* Notification List */}
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading notifications...</div>
            ) : displayedNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </div>
            ) : (
              <NotificationList
                notifications={displayedNotifications}
                onNotificationClick={handleNotificationClick}
              />
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <NotificationPreferencesPanel
            preferences={preferences}
            onUpdate={handleUpdatePreferences}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
