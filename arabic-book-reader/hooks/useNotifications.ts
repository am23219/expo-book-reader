import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  registerForPushNotificationsAsync, 
  setNotificationHandler, 
  cleanupNotifications, 
  getReminderSettings, 
  scheduleReminderNotifications 
} from '../utils/notifications';

export interface NotificationState {
  notificationSubscriptions: {
    foregroundSubscription?: Notifications.Subscription;
    responseSubscription?: Notifications.Subscription;
  };
  showReminderSettings: boolean;
}

export interface NotificationActions {
  toggleReminderSettings: () => void;
  initializeNotifications: () => Promise<void>;
}

/**
 * Custom hook for managing notifications
 */
export const useNotifications = (): [NotificationState, NotificationActions] => {
  const [notificationSubscriptions, setNotificationSubscriptions] = useState<{
    foregroundSubscription?: Notifications.Subscription;
    responseSubscription?: Notifications.Subscription;
  }>({});
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Initialize push notifications and set up handlers
  const initializeNotifications = async () => {
    try {
      // Request permission to show notifications first
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return; // Exit early if permissions not granted
      }
      
      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Successfully registered for push notifications with token:', token);
      } else {
        console.log('Push notifications registration did not return a token, but local notifications should still work');
      }
      
      // Set up notification handlers
      const subscriptions = setNotificationHandler();
      setNotificationSubscriptions(subscriptions);
      
      // We're not automatically scheduling notifications when the app starts
      // This prevents notifications from appearing when launching the app
      
      // The following code is commented out to prevent auto-scheduling
      // const savedSettings = await getReminderSettings();
      // if (savedSettings.enabled) {
      //   await scheduleReminderNotifications(savedSettings);
      // }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Even if there's an error, we'll continue with the app
      // Local notifications might still work
    }
  };

  // Clean up notification subscriptions when component unmounts
  useEffect(() => {
    return () => {
      cleanupNotifications(notificationSubscriptions);
    };
  }, [notificationSubscriptions]);

  // Toggle reminder settings modal
  const toggleReminderSettings = () => {
    console.log('Toggling reminder settings modal. Current state:', showReminderSettings);
    setShowReminderSettings(prevState => !prevState);
  };

  return [
    {
      notificationSubscriptions,
      showReminderSettings
    },
    {
      toggleReminderSettings,
      initializeNotifications
    }
  ];
}; 