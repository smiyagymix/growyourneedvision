export const defaultSettings = {
  theme: 'light',
  notifications: {
    email: true,
    push: true,
    sound: true,
  },
  privacy: {
    profileVisible: true,
    activityVisible: true,
  },
  accessibility: {
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
  },
  language: 'en-US',
  timezone: 'UTC',
};

export type UserSettings = typeof defaultSettings;
