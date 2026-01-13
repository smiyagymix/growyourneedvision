import React, { useState, useCallback } from 'react';

interface Preferences {
  channels?: Record<string, boolean>;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  muteKeywords?: string[];
}

interface NotificationPreferencesPanelProps {
  preferences: Preferences | null;
  onUpdate: (prefs: Preferences) => Promise<void>;
}

/**
 * NotificationPreferencesPanel: Manage notification preferences
 * 
 * Business Logic:
 * - Toggle notification channels
 * - Set quiet hours
 * - Manage muted keywords
 * - Save preferences
 */
const NotificationPreferencesPanel: React.FC<NotificationPreferencesPanelProps> = ({
  preferences,
  onUpdate,
}) => {
  const [channels, setChannels] = useState({
    email: preferences?.channels?.email ?? true,
    SMS: preferences?.channels?.SMS ?? true,
    push: preferences?.channels?.push ?? true,
    in_app: preferences?.channels?.in_app ?? true,
  });

  const [quietHours, setQuietHours] = useState({
    enabled: preferences?.quietHours?.enabled ?? false,
    start: preferences?.quietHours?.start ?? '22:00',
    end: preferences?.quietHours?.end ?? '08:00',
  });

  const [muteKeywords, setMuteKeywords] = useState(
    preferences?.muteKeywords?.join(', ') ?? ''
  );

  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle save preferences
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      await onUpdate({
        channels,
        quietHours,
        muteKeywords: muteKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
    } finally {
      setIsSaving(false);
    }
  }, [channels, quietHours, muteKeywords, onUpdate]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Notification Channels */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email Notifications', icon: '✉' },
            { key: 'SMS', label: 'SMS/Text Messages', icon: '📱' },
            { key: 'push', label: 'Push Notifications', icon: '🔔' },
            { key: 'in_app', label: 'In-App Notifications', icon: '💬' },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={channels[key as keyof typeof channels]}
                onChange={(e) =>
                  setChannels((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-xl">{icon}</span>
              <span className="font-medium text-gray-900">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={quietHours.enabled}
              onChange={(e) =>
                setQuietHours((prev) => ({
                  ...prev,
                  enabled: e.target.checked,
                }))
              }
              className="w-4 h-4 cursor-pointer"
            />
            <span className="font-medium text-gray-900">Enable Quiet Hours</span>
          </label>

          {quietHours.enabled && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) =>
                    setQuietHours((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) =>
                    setQuietHours((prev) => ({
                      ...prev,
                      end: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Muted Keywords */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mute Keywords</h3>
        <p className="text-sm text-gray-600 mb-2">
          Notifications containing these keywords will be silenced (comma-separated)
        </p>
        <textarea
          value={muteKeywords}
          onChange={(e) => setMuteKeywords(e.target.value)}
          placeholder="e.g., spam, promotional, offer"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default NotificationPreferencesPanel;
