import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section } from '../models/Section';

// Storage keys - centralized for easy management
export const STORAGE_KEYS = {
  SECTIONS: 'app_sections',
  CURRENT_PAGE: 'app_current_page',
  LAST_VIEWED_PAGES: 'app_last_viewed_pages',
  CURRENT_SECTION_ID: 'app_current_section_id',
  COMPLETED_SECTIONS: 'app_completed_sections',
  READING_STREAK: 'app_reading_streak',
  COMPLETED_KHATM_COUNT: 'app_completed_khatm_count',
  BOOK_TITLE: 'app_book_title',
  READING_HISTORY: 'app_reading_history'
};

// Types
export interface ReadingStreak {
  currentStreak: number;
  lastReadDate: Date | null;
  longestStreak: number;
}

// Error handling helper
const handleStorageError = (operation: string, error: any): void => {
  console.error(`Storage error during ${operation}:`, error);
};

/**
 * Storage service for managing app data persistence
 */
class Storage {
  // ==== Core storage operations ====
  
  /**
   * Save data to AsyncStorage
   */
  async save<T>(key: string, data: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      handleStorageError(`saving ${key}`, error);
      return false;
    }
  }
  
  /**
   * Load data from AsyncStorage
   */
  async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data === null) return defaultValue;
      return JSON.parse(data);
    } catch (error) {
      handleStorageError(`loading ${key}`, error);
      return defaultValue;
    }
  }
  
  // ==== Section management ====
  
  /**
   * Load sections with data validation
   */
  async loadSections(defaultSections: Section[]): Promise<Section[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SECTIONS);
      if (data === null) return defaultSections;
      
      const parsedSections = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return parsedSections.map((section: any) => ({
        ...section,
        completionDate: section.completionDate ? new Date(section.completionDate) : undefined
      }));
    } catch (error) {
      handleStorageError('loading sections', error);
      return defaultSections;
    }
  }
  
  /**
   * Save sections
   */
  async saveSections(sections: Section[]): Promise<boolean> {
    return this.save(STORAGE_KEYS.SECTIONS, sections);
  }
  
  // ==== Page management ====
  
  /**
   * Load current page with validation
   */
  async loadCurrentPage(defaultPage: number = 1): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
      if (data === null) return defaultPage;
      
      const page = parseInt(data, 10);
      // Validate page is within reasonable bounds
      if (isNaN(page) || page < 1 || page > 1000) {
        console.warn(`Invalid saved page: ${data}, using default page ${defaultPage}`);
        return defaultPage;
      }
      
      return page;
    } catch (error) {
      handleStorageError('loading current page', error);
      return defaultPage;
    }
  }
  
  /**
   * Save current page
   */
  async saveCurrentPage(page: number): Promise<boolean> {
    // Validate page
    if (isNaN(page) || page < 1) {
      console.warn(`Invalid page number: ${page}, not saving`);
      return false;
    }
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, page.toString());
      return true;
    } catch (error) {
      handleStorageError('saving current page', error);
      return false;
    }
  }
  
  // ==== Last viewed pages management ====
  
  /**
   * Load all last viewed pages
   */
  async loadLastViewedPages(): Promise<Record<number, number>> {
    return this.load<Record<number, number>>(STORAGE_KEYS.LAST_VIEWED_PAGES, {});
  }
  
  /**
   * Save last viewed page for a section
   */
  async saveLastViewedPage(sectionId: number, page: number, sections: Section[]): Promise<boolean> {
    try {
      // Validate section exists
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        console.warn(`Section ${sectionId} not found, not saving page`);
        return false;
      }
      
      // Validate page is within section bounds
      if (page < section.startPage || page > section.endPage) {
        console.warn(`Page ${page} outside valid range for section ${sectionId} (${section.startPage}-${section.endPage})`);
        return false;
      }
      
      // Load current data
      const lastViewedPages = await this.loadLastViewedPages();
      
      // Update with new data
      lastViewedPages[sectionId] = page;
      
      // Save updated data
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_VIEWED_PAGES, JSON.stringify(lastViewedPages));
      
      // Also update current section ID for consistency
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SECTION_ID, sectionId.toString());
      
      return true;
    } catch (error) {
      handleStorageError('saving last viewed page', error);
      return false;
    }
  }
  
  /**
   * Get last viewed page for a specific section
   */
  async getLastViewedPage(section: Section): Promise<number> {
    try {
      const lastViewedPages = await this.loadLastViewedPages();
      const savedPage = lastViewedPages[section.id];
      
      // Validate the saved page is within section bounds
      if (savedPage !== undefined && 
          savedPage >= section.startPage && 
          savedPage <= section.endPage) {
        return savedPage;
      }
      
      // Log warning if the saved page is invalid
      if (savedPage !== undefined) {
        console.warn(`Saved page ${savedPage} for section ${section.id} is outside valid range (${section.startPage}-${section.endPage})`);
      }
      
      // Default to section start page
      return section.startPage;
    } catch (error) {
      handleStorageError('getting last viewed page', error);
      return section.startPage;
    }
  }
  
  // ==== Reading streak management ====
  
  /**
   * Load reading streak data
   */
  async loadReadingStreak(): Promise<ReadingStreak> {
    const defaultStreak: ReadingStreak = {
      currentStreak: 0,
      lastReadDate: null,
      longestStreak: 0
    };
    
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.READING_STREAK);
      if (data === null) return defaultStreak;
      
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        lastReadDate: parsed.lastReadDate ? new Date(parsed.lastReadDate) : null
      };
    } catch (error) {
      handleStorageError('loading reading streak', error);
      return defaultStreak;
    }
  }
  
  /**
   * Save reading streak data
   */
  async saveReadingStreak(streak: ReadingStreak): Promise<boolean> {
    return this.save(STORAGE_KEYS.READING_STREAK, streak);
  }
  
  // ==== Completed sections management ====
  
  /**
   * Load completed sections
   */
  async loadCompletedSections(): Promise<Section[]> {
    return this.load<Section[]>(STORAGE_KEYS.COMPLETED_SECTIONS, []);
  }
  
  /**
   * Save completed section
   */
  async saveCompletedSection(section: Section): Promise<boolean> {
    try {
      // Load current completed sections
      const completedSections = await this.loadCompletedSections();
      
      // Check if already exists
      const existingIndex = completedSections.findIndex(s => s.id === section.id);
      
      if (existingIndex >= 0) {
        // Update existing entry
        completedSections[existingIndex] = section;
      } else {
        // Add new entry
        completedSections.push(section);
      }
      
      // Save updated list
      return this.save(STORAGE_KEYS.COMPLETED_SECTIONS, completedSections);
    } catch (error) {
      handleStorageError('saving completed section', error);
      return false;
    }
  }
  
  // ==== Reading history management ====
  
  /**
   * Load reading history (dates when user read)
   */
  async loadReadingHistory(): Promise<Date[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.READING_HISTORY);
      if (data === null) return [];
      
      // Convert string dates to Date objects
      return JSON.parse(data).map((dateStr: string) => new Date(dateStr));
    } catch (error) {
      handleStorageError('loading reading history', error);
      return [];
    }
  }
  
  /**
   * Save reading history
   */
  async saveReadingHistory(history: Date[]): Promise<boolean> {
    return this.save(STORAGE_KEYS.READING_HISTORY, history);
  }
  
  /**
   * Add today to reading history if not already present
   */
  async recordReadingDay(): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const history = await this.loadReadingHistory();
      
      // Check if today is already recorded
      const todayExists = history.some(date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      
      if (!todayExists) {
        history.push(today);
        return this.saveReadingHistory(history);
      }
      
      return true;
    } catch (error) {
      handleStorageError('recording reading day', error);
      return false;
    }
  }
  
  // ==== Utility operations ====
  
  /**
   * Clear all app data
   */
  async clearAllData(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      handleStorageError('clearing all data', error);
      return false;
    }
  }
}

// Export a singleton instance
export const storage = new Storage(); 