import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section, SECTIONS } from '../models/Section';

const SECTIONS_STORAGE_KEY = 'barakaat_makiyyah_sections';
const CURRENT_PAGE_KEY = 'barakaat_makiyyah_current_page';

// Save sections with completion status
export const saveSections = async (sections: Section[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
  } catch (error) {
    console.error('Error saving sections:', error);
  }
};

// Load sections with completion status
export const loadSections = async (): Promise<Section[]> => {
  try {
    const sectionsJson = await AsyncStorage.getItem(SECTIONS_STORAGE_KEY);
    if (sectionsJson) {
      return JSON.parse(sectionsJson);
    }
    return SECTIONS; // Return default sections if none saved
  } catch (error) {
    console.error('Error loading sections:', error);
    return SECTIONS;
  }
};

// Save current page
export const saveCurrentPage = async (page: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_PAGE_KEY, page.toString());
  } catch (error) {
    console.error('Error saving current page:', error);
  }
};

// Load current page
export const loadCurrentPage = async (): Promise<number> => {
  try {
    const page = await AsyncStorage.getItem(CURRENT_PAGE_KEY);
    return page ? parseInt(page, 10) : 1;
  } catch (error) {
    console.error('Error loading current page:', error);
    return 1;
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