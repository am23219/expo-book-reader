/**
 * Common utility functions
 */
import { Platform } from 'react-native';

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