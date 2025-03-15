import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NOTIFICATION_TOKEN_KEY, DEVICE_IDENTIFIER_KEY, NotificationSubscriptions } from './types';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        // Get project ID from app.json or app.config.js
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          console.warn('No project ID found in Constants.expoConfig.extra.eas.projectId');
        }
        
        try {
          // Try to get the push token using the new method
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId || 'your-project-id',
          })).data;
        } catch (tokenError) {
          // If ExpoPushTokenManager is not available, use a device identifier as a fallback
          console.warn('ExpoPushTokenManager not available:', tokenError);
          
          // Generate a unique device identifier as a fallback
          const deviceId = await generateDeviceIdentifier();
          token = `FALLBACK_TOKEN_${deviceId}`;
          console.log('Using fallback token mechanism');
        }
        
        // Save token to AsyncStorage
        if (token) {
          await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
          console.log('Push token:', token);
        }
      } catch (error) {
        console.error('Error getting push token:', error);
        console.log('Continuing without push token - local notifications will still work');
      }
    } else {
      console.log('Must use physical device for push notifications');
    }
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    console.log('Push notifications may not be available in this environment');
  }

  return token;
}

// Generate a unique device identifier as a fallback when push tokens aren't available
async function generateDeviceIdentifier(): Promise<string> {
  try {
    // Try to get a stored identifier first
    const storedId = await AsyncStorage.getItem(DEVICE_IDENTIFIER_KEY);
    if (storedId) {
      return storedId;
    }
    
    // Generate a new identifier if none exists
    const deviceName = Device.deviceName || 'unknown';
    const deviceType = Device.deviceType || 'unknown';
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substring(2, 10);
    
    const deviceId = `${deviceName}_${deviceType}_${timestamp}_${randomPart}`.replace(/\s+/g, '_');
    
    // Store for future use
    await AsyncStorage.setItem(DEVICE_IDENTIFIER_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Error generating device identifier:', error);
    return Date.now().toString() + Math.random().toString(36).substring(2, 10);
  }
}

// Check if notifications are enabled
export async function areNotificationsEnabled() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

// Check if ExpoPushTokenManager is available
export async function isPushNotificationsAvailable(): Promise<boolean> {
  try {
    // Try to get a token with a minimal configuration
    await Notifications.getExpoPushTokenAsync({
      projectId: 'test-project-id',
    });
    return true;
  } catch (error) {
    // Check if the error is specifically about ExpoPushTokenManager
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ExpoPushTokenManager')) {
      console.log('ExpoPushTokenManager is not available');
      return false;
    }
    
    // If it's some other error, permissions might just not be granted
    return await areNotificationsEnabled();
  }
}

// Add a function to handle notification responses
export function setNotificationHandler() {
  try {
    // This sets up a listener for when a notification is received while the app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });
    
    // This sets up a listener for when a user taps on or interacts with a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Here you can handle the notification tap, e.g., navigate to a specific screen
    });
    
    // Return the subscriptions so they can be cleaned up if needed
    return { foregroundSubscription, responseSubscription };
  } catch (error) {
    console.error('Error setting up notification handlers:', error);
    return {};
  }
}

// Function to clean up notification subscriptions
export function cleanupNotifications(subscriptions: NotificationSubscriptions) {
  try {
    if (subscriptions.foregroundSubscription) {
      Notifications.removeNotificationSubscription(subscriptions.foregroundSubscription);
    }
    
    if (subscriptions.responseSubscription) {
      Notifications.removeNotificationSubscription(subscriptions.responseSubscription);
    }
  } catch (error) {
    console.error('Error cleaning up notification subscriptions:', error);
  }
}

// Function to cancel all notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications have been canceled');
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
} 