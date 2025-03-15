/**
 * Common utility functions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '@constants/index';
import { Book, UserPreferences } from '../types';

/**
 * Storage utilities
 */
export const storage = {
  /**
   * Save data to AsyncStorage
   */
  saveData: async <T>(key: string, data: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  /**
   * Load data from AsyncStorage
   */
  loadData: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  },

  /**
   * Save user preferences
   */
  saveUserPreferences: async (preferences: UserPreferences): Promise<void> => {
    await storage.saveData(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  /**
   * Load user preferences
   */
  loadUserPreferences: async (): Promise<UserPreferences | null> => {
    return await storage.loadData<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  },

  /**
   * Save books
   */
  saveBooks: async (books: Book[]): Promise<void> => {
    await storage.saveData(STORAGE_KEYS.BOOKS, books);
  },

  /**
   * Load books
   */
  loadBooks: async (): Promise<Book[]> => {
    return await storage.loadData<Book[]>(STORAGE_KEYS.BOOKS) || [];
  },
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Check if the device is iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if the device is Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 