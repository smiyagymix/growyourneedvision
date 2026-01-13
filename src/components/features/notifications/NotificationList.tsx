import React from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created?: string;
  data?: Record<string, any>;
}

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notificationId: string, isRead: boolean) => void;
}

/**
 * NotificationList: Displays list of notifications
 * 
 * Business Logic:
 * - Shows most recent first
 * - Visual indicators for read/unread
 * - Color-coded by type
 * - Shows formatted timestamps
 */
const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onNotificationClick,
}) => {
  const typeColors: Record<string, string> = {
    'assignment_due': 'bg-blue-100 text-blue-800',
    'grade_posted': 'bg-green-100 text-green-800',
    'message': 'bg-purple-100 text-purple-800',
    'system': 'bg-gray-100 text-gray-800',
    'announcement': 'bg-yellow-100 text-yellow-800',
    'reminder': 'bg-orange-100 text-orange-800',
    'course_update': 'bg-indigo-100 text-indigo-800',
    'payment': 'bg-red-100 text-red-800',
    'attendance': 'bg-cyan-100 text-cyan-800',
    'achievement': 'bg-pink-100 text-pink-800',
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onNotificationClick(notification.id, notification.is_read)}
          className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
            notification.is_read
              ? 'bg-gray-50 border-gray-300'
              : 'bg-blue-50 border-blue-500 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    typeColors[notification.type] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {notification.type}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
              <p className="text-xs text-gray-500">{getTimeAgo(notification.created)}</p>
            </div>

            {/* Status Indicator */}
            <div className="flex-shrink-0">
              {notification.is_read ? (
                <div className="w-8 h-8 flex items-center justify-center text-gray-400">✓</div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold">
                  !
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
