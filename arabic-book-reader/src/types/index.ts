/**
 * Common type definitions for the application
 */

// Book related types
export interface Book {
  id: string;
  title: string;
  author?: string;
  coverImage?: string;
  filePath: string;
  lastReadPage?: number;
  totalPages?: number;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily?: string;
  readingReminders: boolean;
  reminderTime?: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  BookReader: { bookId: string };
  Settings: undefined;
  ReminderSettings: undefined;
};

// Component prop types
export interface ThemedProps {
  theme?: 'light' | 'dark';
}

// Audio player types
export interface AudioTrack {
  id: string;
  title: string;
  uri: string;
  duration?: number;
} 