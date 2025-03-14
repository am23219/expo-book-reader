import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section, SECTIONS } from '../models/Section';

// Keys for AsyncStorage
const SECTIONS_STORAGE_KEY = 'arabic_book_reader_sections';
const CURRENT_PAGE_STORAGE_KEY = 'arabic_book_reader_current_page';

/**
 * Load saved sections from AsyncStorage
 */
export const loadSections = async (): Promise<Section[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SECTIONS_STORAGE_KEY);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return SECTIONS; // Return default sections if none are saved
  } catch (error) {
    console.error('Error loading sections:', error);
    return SECTIONS; // Return default sections on error
  }
};

/**
 * Save sections to AsyncStorage
 */
export const saveSections = async (sections: Section[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(sections);
    await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving sections:', error);
  }
};

/**
 * Load current page from AsyncStorage
 */
export const loadCurrentPage = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(CURRENT_PAGE_STORAGE_KEY);
    if (value !== null) {
      return parseInt(value, 10);
    }
    return 1; // Return first page if none is saved
  } catch (error) {
    console.error('Error loading current page:', error);
    return 1; // Return first page on error
  }
};

/**
 * Save current page to AsyncStorage
 */
export const saveCurrentPage = async (page: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_PAGE_STORAGE_KEY, page.toString());
  } catch (error) {
    console.error('Error saving current page:', error);
  }
};

/**
 * Clear all stored data (for debugging or reset functionality)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      SECTIONS_STORAGE_KEY,
      CURRENT_PAGE_STORAGE_KEY
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Enhance storage with mobile-specific features
export const saveReaderProgress = async (bookId: string, sectionId: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(`book_${bookId}_progress`, sectionId);
    return true;
  } catch (error) {
    console.error('Failed to save reading progress:', error);
    return false;
  }
};

export const getReaderProgress = async (bookId: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(`book_${bookId}_progress`);
  } catch (error) {
    console.error('Failed to get reading progress:', error);
    return null;
  }
};

// Add offline capability
export const cacheBookData = async (book: any): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(`book_${book.id}_data`, JSON.stringify(book));
    return true;
  } catch (error) {
    console.error('Failed to cache book data:', error);
    return false;
  }
};

export const getCachedBookData = async (bookId: string): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(`book_${bookId}_data`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get cached book data:', error);
    return null;
  }
}; 