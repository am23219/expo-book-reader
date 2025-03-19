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
  currentPageInfo?: {
    sectionId: number;
    currentPage: number;
    totalPages: number;
    completed: boolean;
  };
}

/**
 * Checks if widget functionality is available
 */
const isWidgetAvailable = (): boolean => {
  return Platform.OS === 'ios' && WidgetDataSharing && !!WidgetDataSharing.updateWidgetData;
};

/**
 * Updates the widget data in the shared UserDefaults
 * This allows the widget to access the data from the app
 */
export const updateWidgetData = async (data: WidgetData): Promise<boolean> => {
  try {
    if (!isWidgetAvailable()) {
      console.log('Widget functionality not available on this device');
      return false; // Widget not supported
    }

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(data);
    
    // Save to AsyncStorage for backup
    await AsyncStorage.setItem('widget_data', jsonData);
    
    // Use the native module to save to shared UserDefaults if available
    try {
      await WidgetDataSharing.updateWidgetData(jsonData);
      console.log('Widget data updated:', data);
      return true;
    } catch (error) {
      console.log('Widget update skipped - widget may not be installed yet');
      return false;
    }
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
  longestStreak: number,
  currentPageInfo?: {
    sectionId: number;
    currentPage: number;
    totalPages: number;
    completed: boolean;
  }
): Promise<boolean> => {
  return updateWidgetData({
    bookTitle,
    readingDays,
    currentStreak,
    longestStreak,
    currentPageInfo
  });
};

/**
 * Updates the Next Up widget specifically with section progress
 */
export const updateNextUpWidget = async (
  sectionId: number,
  currentPage: number, 
  totalPages: number,
  completed: boolean,
  bookTitle: string = "Barakaat Makkiyyah"
): Promise<boolean> => {
  try {
    if (!isWidgetAvailable()) {
      console.log('NextUp widget functionality not available');
      return false;
    }
    
    // Save to local storage for backup
    await AsyncStorage.setItem('next_up_section_id', sectionId.toString());
    await AsyncStorage.setItem('next_up_current_page', currentPage.toString());
    await AsyncStorage.setItem('next_up_total_pages', totalPages.toString());
    await AsyncStorage.setItem('next_up_completed', completed.toString());
    await AsyncStorage.setItem('widget_book_title', bookTitle);
    
    // Use native module if available
    try {
      // First update the book title using updateWidgetData
      await updateWidgetData({ 
        bookTitle, 
        readingDays: [], 
        currentStreak: 0, 
        longestStreak: 0,
        currentPageInfo: {
          sectionId,
          currentPage,
          totalPages,
          completed
        }
      });
      
      // Then update the NextUp widget specific data
      await WidgetDataSharing.updateNextUpProgress(
        sectionId,
        currentPage,
        totalPages,
        completed
      );
      return true;
    } catch (error) {
      console.log('NextUp widget update skipped - widget may not be installed yet');
      return false;
    }
  } catch (error) {
    console.error('Error updating next up widget:', error);
    return false;
  }
}; 