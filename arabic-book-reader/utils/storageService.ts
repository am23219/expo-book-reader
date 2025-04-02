// Storage service for Barakaat Makkiyyah app
// Manages all persistent storage operations

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section } from '../models/Section';

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_SECTION_ID: 'current_section_id',
  CURRENT_PAGE: 'current_page',
  SECTIONS: 'sections',
  LAST_VIEWED_PAGES: 'last_viewed_pages',
  READING_HISTORY: 'reading_history',
  READING_STREAK: 'reading_streak',
  LONGEST_STREAK: 'longest_streak',
  KHATM_COUNT: 'khatm_count',
  BOOK_DATA_PREFIX: 'book_data_',
  READING_LEVEL: 'reading_level'
};

/**
 * StorageService class for managing app persistence
 */
class StorageService {
  // Section Management
  
  /**
   * Load all sections with completion status
   */
  async loadSections(): Promise<Section[]> {
    try {
      const sectionsJSON = await AsyncStorage.getItem(STORAGE_KEYS.SECTIONS);
      if (sectionsJSON) {
        return JSON.parse(sectionsJSON) as Section[];
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
    return [];
  }
  
  /**
   * Save sections with their completion status
   */
  async saveSections(sections: Section[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    } catch (error) {
      console.error('Error saving sections:', error);
    }
  }
  
  // Current Section and Page Management
  
  /**
   * Get current section ID
   */
  async getCurrentSectionId(): Promise<number | null> {
    try {
      const sectionIdStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SECTION_ID);
      if (sectionIdStr) {
        const sectionId = parseInt(sectionIdStr, 10);
        return isNaN(sectionId) ? null : sectionId;
      }
    } catch (error) {
      console.error('Error getting current section ID:', error);
    }
    return null;
  }
  
  /**
   * Set current section ID
   */
  async setCurrentSectionId(sectionId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SECTION_ID, sectionId.toString());
    } catch (error) {
      console.error('Error setting current section ID:', error);
    }
  }
  
  /**
   * Load current global page
   */
  async loadCurrentPage(): Promise<number> {
    try {
      const pageStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
      if (pageStr) {
        const page = parseInt(pageStr, 10);
        return isNaN(page) ? 1 : page;
      }
    } catch (error) {
      console.error('Error loading current page:', error);
    }
    return 1; // Default to first page
  }
  
  /**
   * Save current global page
   */
  async saveCurrentPage(page: number): Promise<void> {
    try {
      if (page >= 1) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, page.toString());
      }
    } catch (error) {
      console.error('Error saving current page:', error);
    }
  }
  
  // Section-specific Page Management
  
  /**
   * Load all last viewed pages for each section
   */
  async loadLastViewedPages(): Promise<Record<number, number>> {
    try {
      const pagesJSON = await AsyncStorage.getItem(STORAGE_KEYS.LAST_VIEWED_PAGES);
      if (pagesJSON) {
        return JSON.parse(pagesJSON) as Record<number, number>;
      }
    } catch (error) {
      console.error('Error loading last viewed pages:', error);
    }
    return {}; // Empty record if no data
  }
  
  /**
   * Save last viewed page for a specific section
   */
  async saveLastViewedPage(sectionId: number, page: number): Promise<void> {
    try {
      const pages = await this.loadLastViewedPages();
      pages[sectionId] = page;
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_VIEWED_PAGES, JSON.stringify(pages));
    } catch (error) {
      console.error('Error saving last viewed page:', error);
    }
  }
  
  /**
   * Get last viewed page for a specific section
   */
  async getLastViewedPage(section: Section): Promise<number> {
    try {
      const pages = await this.loadLastViewedPages();
      const page = pages[section.id];
      if (page && page >= section.startPage && page <= section.endPage) {
        return page;
      }
    } catch (error) {
      console.error('Error getting last viewed page:', error);
    }
    return section.startPage; // Default to section start page
  }
  
  // Reading Progress Management
  
  /**
   * Save reader progress including streak, level, and khatms
   */
  async saveReaderProgress(progress: {
    currentStreak: number;
    longestStreak: number;
    level: number;
    khatmCount: number;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READING_STREAK, progress.currentStreak.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, progress.longestStreak.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.READING_LEVEL, progress.level.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.KHATM_COUNT, progress.khatmCount.toString());
    } catch (error) {
      console.error('Error saving reader progress:', error);
    }
  }
  
  /**
   * Get reader progress
   */
  async getReaderProgress(): Promise<{
    currentStreak: number;
    longestStreak: number;
    level: number;
    khatmCount: number;
  }> {
    try {
      const streakStr = await AsyncStorage.getItem(STORAGE_KEYS.READING_STREAK);
      const longestStreakStr = await AsyncStorage.getItem(STORAGE_KEYS.LONGEST_STREAK);
      const levelStr = await AsyncStorage.getItem(STORAGE_KEYS.READING_LEVEL);
      const khatmCountStr = await AsyncStorage.getItem(STORAGE_KEYS.KHATM_COUNT);
      
      const currentStreak = streakStr ? parseInt(streakStr, 10) : 0;
      const longestStreak = longestStreakStr ? parseInt(longestStreakStr, 10) : 0;
      const level = levelStr ? parseInt(levelStr, 10) : 1;
      const khatmCount = khatmCountStr ? parseInt(khatmCountStr, 10) : 0;
      
      return {
        currentStreak: isNaN(currentStreak) ? 0 : currentStreak,
        longestStreak: isNaN(longestStreak) ? 0 : longestStreak,
        level: isNaN(level) ? 1 : level,
        khatmCount: isNaN(khatmCount) ? 0 : khatmCount
      };
    } catch (error) {
      console.error('Error getting reader progress:', error);
      return { currentStreak: 0, longestStreak: 0, level: 1, khatmCount: 0 };
    }
  }
  
  // Reading History Management
  
  /**
   * Save reading history dates
   */
  async saveReadingHistory(dates: Date[]): Promise<void> {
    try {
      const dateStrings = dates.map(date => date.toISOString());
      await AsyncStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(dateStrings));
    } catch (error) {
      console.error('Error saving reading history:', error);
    }
  }
  
  /**
   * Load reading history dates
   */
  async loadReadingHistory(): Promise<Date[]> {
    try {
      const historyJSON = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
      if (historyJSON) {
        const dateStrings = JSON.parse(historyJSON) as string[];
        return dateStrings.map(dateStr => new Date(dateStr));
      }
    } catch (error) {
      console.error('Error loading reading history:', error);
    }
    return [];
  }
  
  // Book Data Caching
  
  /**
   * Cache book data for faster loading
   */
  async cacheBookData(bookId: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.BOOK_DATA_PREFIX}${bookId}`,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Error caching book data:', error);
    }
  }
  
  /**
   * Get cached book data
   */
  async getCachedBookData(bookId: string): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.BOOK_DATA_PREFIX}${bookId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting cached book data:', error);
    }
    return null;
  }
  
  // Clear All Data
  
  /**
   * Clear all stored data (for reset functionality)
   */
  async clearAllData(): Promise<void> {
    try {
      // Clear only the app-specific keys, not all AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        Object.values(STORAGE_KEYS).some(storageKey => 
          key === storageKey || key.startsWith(STORAGE_KEYS.BOOK_DATA_PREFIX)
        )
      );
      
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

// Create a singleton instance
const storageService = new StorageService();

// Export for backward compatibility
export const {
  loadSections,
  saveSections,
  loadCurrentPage,
  saveCurrentPage,
  loadLastViewedPages,
  saveLastViewedPage,
  getLastViewedPage,
  clearAllData,
  saveReaderProgress,
  getReaderProgress,
  cacheBookData,
  getCachedBookData
} = storageService;

// Export default instance
export default storageService; 