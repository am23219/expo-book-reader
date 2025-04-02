/**
 * Export all constants from a single file for easier imports
 */

export * from './theme';

// App constants
export const APP_NAME = 'Arabic Book Reader';
export const APP_VERSION = '1.0.0';

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'light',
  fontSize: 16,
  fontFamily: 'Avenir',
  readingReminders: false,
  reminderTime: '20:00',
};

// Animation durations
export const ANIMATION = {
  DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
  },
}; 