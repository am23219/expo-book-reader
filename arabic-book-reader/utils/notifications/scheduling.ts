import * as Notifications from 'expo-notifications';
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS } from './types';
import { Platform } from 'react-native';

// Schedule reminder notifications based on settings
export async function scheduleReminderNotifications(settings: ReminderSettings) {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // If reminders are disabled, just return
    if (!settings.enabled) {
      return;
    }
    
    console.log(`Scheduling daily notification at ${settings.time.hour}:${settings.time.minute}`);
    
    // Calculate the next occurrence of the notification time
    const nextDate = getNextOccurrence(settings.time.hour, settings.time.minute);
    const now = new Date();
    
    // Check if the next occurrence is very soon (within 1 minute)
    // This prevents immediate notifications when toggling on after the set time
    const isImmediate = (nextDate.getTime() - now.getTime()) < 60000; // 60000ms = 1 minute
    
    if (isImmediate) {
      console.log('Next occurrence is immediate, scheduling for tomorrow instead');
      // Add a day to push it to tomorrow
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    // Schedule a one-time notification for the next occurrence
    // This ensures we don't get an immediate notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for your daily reading",
        body: "Don't forget to continue your reading streak today!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: nextDate,
        channelId: 'default',
      },
    });
    
    console.log(`Scheduled notification with ID: ${notificationId}`);
    console.log(`First occurrence will be at ${nextDate.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('Error scheduling reminder notifications:', error);
    return false;
  }
}

// Helper function to get the next occurrence of a specific time
function getNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date();
  
  // Set the time
  result.setHours(hour, minute, 0, 0);
  
  // If the time has already passed today, set it for tomorrow
  if (now > result) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

// Function to schedule a one-time notification
export async function scheduleOneTimeNotification(title: string, body: string, seconds: number = 5) {
  try {
    // Calculate the trigger time
    const triggerTime = new Date();
    triggerTime.setSeconds(triggerTime.getSeconds() + seconds);
    
    let identifier;
    try {
      // Try with date trigger
      identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          date: triggerTime,
          channelId: 'default',
        },
      });
    } catch (triggerError) {
      console.warn('Error with date trigger, trying with seconds:', triggerError);
      
      // Fall back to seconds-based trigger
      identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          seconds,
          channelId: 'default',
        },
      });
    }
    
    console.log(`Scheduled one-time notification with ID: ${identifier} for ${triggerTime.toLocaleString()}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling one-time notification:', error);
    
    // Last resort: try with no trigger (immediate notification)
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
      console.log(`Scheduled immediate notification with ID: ${identifier}`);
      return identifier;
    } catch (fallbackError) {
      console.error('Failed to schedule even immediate notification:', fallbackError);
      return null;
    }
  }
} 