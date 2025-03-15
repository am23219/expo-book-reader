// This file is now just a re-export of the modular notifications system
// All functionality has been moved to the utils/notifications/ directory

// Export types
export * from './types';

// Export setup functions
export {
  registerForPushNotificationsAsync,
  setNotificationHandler,
  cleanupNotifications,
  areNotificationsEnabled,
  isPushNotificationsAvailable,
  cancelAllNotifications
} from './setup';

// Export scheduling functions
export {
  saveReminderSettings,
  getReminderSettings,
  scheduleReminderNotifications,
  scheduleOneTimeNotification
} from './scheduling'; 