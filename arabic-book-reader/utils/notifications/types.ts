import * as Notifications from 'expo-notifications';

// Keys for AsyncStorage
export const NOTIFICATION_TOKEN_KEY = 'notification_token';
export const REMINDER_SETTINGS_KEY = 'reminder_settings';
export const DEVICE_IDENTIFIER_KEY = 'device_identifier';

// Default reminder time (8:00 PM)
export const DEFAULT_REMINDER_TIME = {
  hour: 20,
  minute: 0,
};

// Interface for reminder settings
export interface ReminderSettings {
  enabled: boolean;
  time: {
    hour: number;
    minute: number;
  };
}

// Default reminder settings
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  time: DEFAULT_REMINDER_TIME,
};

// Type for notification subscriptions
export interface NotificationSubscriptions {
  foregroundSubscription?: Notifications.Subscription;
  responseSubscription?: Notifications.Subscription;
} 