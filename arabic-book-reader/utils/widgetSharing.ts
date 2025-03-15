import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { ReadingDay } from '../hooks/useReadingStreak';

// Get the native module
const { WidgetDataSharing } = NativeModules;

// Interface for widget data
interface WidgetData {
  bookTitle: string;
  readingDays: ReadingDay[];
  currentStreak: number;
  longestStreak: number;
}

/**
 * Updates the widget data in the shared UserDefaults
 * This allows the widget to access the data from the app
 */
export const updateWidgetData = async (data: WidgetData): Promise<boolean> => {
  try {
    if (Platform.OS !== 'ios') {
      return false; // Only supported on iOS
    }

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(data);
    
    // Save to AsyncStorage for backup
    await AsyncStorage.setItem('widget_data', jsonData);
    
    // Use the native module to save to shared UserDefaults if available
    if (WidgetDataSharing && WidgetDataSharing.updateWidgetData) {
      await WidgetDataSharing.updateWidgetData(jsonData);
    }
    
    console.log('Widget data updated:', data);
    return true;
  } catch (error) {
    console.error('Error updating widget data:', error);
    return false;
  }
};

/**
 * Updates the widget with the current reading progress
 */
export const updateWidgetWithReadingProgress = async (
  bookTitle: string,
  readingDays: ReadingDay[],
  currentStreak: number,
  longestStreak: number
): Promise<boolean> => {
  return updateWidgetData({
    bookTitle,
    readingDays,
    currentStreak,
    longestStreak
  });
}; 