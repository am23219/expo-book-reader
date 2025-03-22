import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section, SECTIONS } from '../models/Section';

// Storage keys
const KEYS = {
  SECTIONS: 'arabic_book_reader_sections',
  CURRENT_PAGE: 'arabic_book_reader_current_page', // Global page fallback (if needed)
  LAST_VIEWED_PAGES: 'arabic_book_reader_last_viewed_pages',
  CURRENT_BOOK_TITLE: 'current_book_title',
  LAST_KNOWN_RELIABLE_SECTION: 'last_known_reliable_section',
  CURRENT_SECTION_ID: 'current_section_id',
  COMPLETED_SECTIONS: 'completed_sections',
  READING_STREAK: 'reading_streak',
  COMPLETED_KHATM_COUNT: 'completed_khatm_count',
  READER_PROGRESS_PREFIX: 'book_',
  CACHED_BOOK_DATA_PREFIX: 'book_'
};

// Types
export interface ReadingStreak {
  currentStreak: number;
  lastReadDate: Date | null;
  longestStreak: number;
}

export interface StorageError extends Error {
  key?: string;
  value?: any;
}

class StorageService {
  // ------------------------------
  // Section Management
  // ------------------------------
  
  /**
   * Load saved sections from AsyncStorage
   */
  async loadSections(): Promise<Section[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.SECTIONS);
      if (jsonValue !== null) {
        const parsedSections = JSON.parse(jsonValue);
        // Convert stored date strings back to Date objects
        return parsedSections.map((section: any) => ({
          ...section,
          completionDate: section.completionDate ? new Date(section.completionDate) : undefined
        }));
      }
      return SECTIONS; // Return default sections if none are saved
    } catch (error) {
      console.error('Error loading sections:', error);
      return SECTIONS; // Return default sections on error
    }
  }

  /**
   * Save sections to AsyncStorage
   */
  async saveSections(sections: Section[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(sections);
      await AsyncStorage.setItem(KEYS.SECTIONS, jsonValue);
    } catch (error) {
      console.error('Error saving sections:', error);
      throw this.createError('Failed to save sections', error, KEYS.SECTIONS, sections);
    }
  }

  /**
   * Mark a section as completed
   */
  async markSectionAsCompleted(sectionId: number): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(KEYS.COMPLETED_SECTIONS);
      const completedSections: number[] = existing ? JSON.parse(existing) : [];
      if (!completedSections.includes(sectionId)) {
        completedSections.push(sectionId);
        await AsyncStorage.setItem(KEYS.COMPLETED_SECTIONS, JSON.stringify(completedSections));
      }
    } catch (error) {
      console.error('Error saving completed section:', error);
    }
  }

  /**
   * Load completed sections
   */
  async loadCompletedSections(): Promise<number[]> {
    try {
      const existing = await AsyncStorage.getItem(KEYS.COMPLETED_SECTIONS);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Error loading completed sections:', error);
      return [];
    }
  }

  // ------------------------------
  // Current Page Management (Global fallback)
  // ------------------------------
  
  /**
   * Load current page from AsyncStorage with validation.
   * Note: The global current page is used as a fallback; section-specific pages are tracked separately.
   */
  async loadCurrentPage(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(KEYS.CURRENT_PAGE);
      if (value !== null) {
        const parsedPage = parseInt(value, 10);
        if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= 150) {
          return parsedPage;
        } else {
          console.warn(`Invalid saved page value: ${value}, defaulting to page 1`);
          await AsyncStorage.setItem(KEYS.CURRENT_PAGE, '1');
          return 1;
        }
      }
      return 1; // Return first page if none is saved
    } catch (error) {
      console.error('Error loading current page:', error);
      return 1;
    }
  }

  /**
   * Save current page to AsyncStorage.
   * Note: This is a global fallback; section-specific progress is handled by saveLastViewedPage.
   */
  async saveCurrentPage(page: number): Promise<void> {
    try {
      if (page < 1 || page > 150) {
        console.warn(`Invalid page number: ${page}, not saving`);
        return;
      }
      await AsyncStorage.setItem(KEYS.CURRENT_PAGE, page.toString());
    } catch (error) {
      console.error('Error saving current page:', error);
      throw this.createError('Failed to save current page', error, KEYS.CURRENT_PAGE, page);
    }
  }

  // ------------------------------
  // Last Viewed Pages Management (Section-specific)
  // ------------------------------
  
  /**
   * Load last viewed pages for all sections.
   */
  async loadLastViewedPages(): Promise<Record<number, number>> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.LAST_VIEWED_PAGES);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue);
      }
      return {}; // Return empty record if none is saved
    } catch (error) {
      console.error('Error loading last viewed pages:', error);
      return {};
    }
  }

  /**
   * Save last viewed page for a specific section with validation.
   * This method now always updates the current section ID.
   */
  async saveLastViewedPage(sectionId: number, page: number): Promise<void> {
    try {
      const lastViewedPages = await this.loadLastViewedPages();
      const sections = await this.loadSections();
      const section = sections.find(s => s.id === sectionId);
      
      if (section) {
        // Always update the current section ID whenever a last viewed page is saved.
        await AsyncStorage.setItem(KEYS.CURRENT_SECTION_ID, sectionId.toString());
        
        // Only save if page is within this section's range.
        if (page >= section.startPage && page <= section.endPage) {
          console.log(`Saving page ${page} as last viewed for section ${sectionId} (${section.title})`);
          lastViewedPages[sectionId] = page;
          await AsyncStorage.setItem(KEYS.LAST_VIEWED_PAGES, JSON.stringify(lastViewedPages));
        } else {
          console.warn(`Page ${page} is outside the range of section ${sectionId} (${section.startPage}-${section.endPage}). Not saving.`);
        }
      } else {
        console.warn(`Section with ID ${sectionId} not found. Cannot save last viewed page.`);
      }
    } catch (error) {
      console.error('Error saving last viewed page:', error);
      throw this.createError('Failed to save last viewed page', error, KEYS.LAST_VIEWED_PAGES, { sectionId, page });
    }
  }

  /**
   * Get last viewed page for a specific section.
   * Returns startPage of the section if no valid last viewed page is saved.
   */
  async getLastViewedPage(section: Section): Promise<number> {
    try {
      const lastViewedPages = await this.loadLastViewedPages();
      const savedPage = lastViewedPages[section.id];
      
      if (savedPage !== undefined && savedPage >= section.startPage && savedPage <= section.endPage) {
        return savedPage;
      } else if (savedPage !== undefined) {
        console.warn(`Saved page ${savedPage} for section ${section.id} is outside valid range (${section.startPage}-${section.endPage}), resetting to section start page`);
      }
      return section.startPage;
    } catch (error) {
      console.error('Error getting last viewed page:', error);
      return section.startPage;
    }
  }

  // ------------------------------
  // Section Navigation Tracking
  // ------------------------------
  
  /**
   * Save a record of the last known reliable section.
   */
  async saveLastKnownReliableSection(sectionId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_KNOWN_RELIABLE_SECTION, sectionId.toString());
    } catch (error) {
      console.error('Error saving last reliable section:', error);
    }
  }

  /**
   * Get the last known reliable section.
   */
  async getLastKnownReliableSection(): Promise<number | null> {
    try {
      const value = await AsyncStorage.getItem(KEYS.LAST_KNOWN_RELIABLE_SECTION);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error getting last reliable section:', error);
      return null;
    }
  }

  /**
   * Track the current section ID for navigation consistency checking.
   */
  async setCurrentSectionId(sectionId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CURRENT_SECTION_ID, sectionId.toString());
    } catch (error) {
      console.error('Error saving current section ID:', error);
    }
  }

  /**
   * Get the current section ID for navigation consistency checking.
   */
  async getCurrentSectionId(): Promise<number | null> {
    try {
      const value = await AsyncStorage.getItem(KEYS.CURRENT_SECTION_ID);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      console.error('Error getting current section ID:', error);
      return null;
    }
  }

  // ------------------------------
  // App Status Management
  // ------------------------------
  
  /**
   * Save the current book title (for widgets).
   */
  async saveCurrentBookTitle(title: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CURRENT_BOOK_TITLE, title);
    } catch (error) {
      console.error('Error saving current book title:', error);
    }
  }

  /**
   * Get the current book title.
   */
  async getCurrentBookTitle(): Promise<string> {
    try {
      return await AsyncStorage.getItem(KEYS.CURRENT_BOOK_TITLE) || "Barakaat Makkiyyah";
    } catch (error) {
      console.error('Error getting current book title:', error);
      return "Barakaat Makkiyyah";
    }
  }

  // ------------------------------
  // Reading Streak Management
  // ------------------------------
  
  /**
   * Load reading streak information.
   */
  async getReadingStreak(): Promise<ReadingStreak> {
    try {
      const jsonValue = await AsyncStorage.getItem(KEYS.READING_STREAK);
      if (jsonValue !== null) {
        const data = JSON.parse(jsonValue);
        return {
          ...data,
          lastReadDate: data.lastReadDate ? new Date(data.lastReadDate) : null
        };
      }
      return {
        currentStreak: 0,
        lastReadDate: null,
        longestStreak: 0
      };
    } catch (error) {
      console.error('Error loading reading streak:', error);
      return {
        currentStreak: 0,
        lastReadDate: null,
        longestStreak: 0
      };
    }
  }

  /**
   * Save reading streak information.
   */
  async saveReadingStreak(streakData: ReadingStreak): Promise<void> {
    try {
      const jsonValue = JSON.stringify(streakData);
      await AsyncStorage.setItem(KEYS.READING_STREAK, jsonValue);
    } catch (error) {
      console.error('Error saving reading streak:', error);
    }
  }

  /**
   * Get completed khatm count.
   */
  async getCompletedKhatmCount(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(KEYS.COMPLETED_KHATM_COUNT);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error getting completed khatm count:', error);
      return 0;
    }
  }

  /**
   * Save completed khatm count.
   */
  async saveCompletedKhatmCount(count: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.COMPLETED_KHATM_COUNT, count.toString());
    } catch (error) {
      console.error('Error saving completed khatm count:', error);
    }
  }

  /**
   * Increment completed khatm count.
   */
  async incrementCompletedKhatmCount(): Promise<number> {
    try {
      const currentCount = await this.getCompletedKhatmCount();
      const newCount = currentCount + 1;
      await this.saveCompletedKhatmCount(newCount);
      return newCount;
    } catch (error) {
      console.error('Error incrementing completed khatm count:', error);
      return -1;
    }
  }

  // ------------------------------
  // General Purpose Storage
  // ------------------------------
  
  /**
   * Save reading progress for a specific book.
   */
  async saveReaderProgress(bookId: string, sectionId: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(`${KEYS.READER_PROGRESS_PREFIX}${bookId}_progress`, sectionId);
      return true;
    } catch (error) {
      console.error('Failed to save reading progress:', error);
      return false;
    }
  }

  /**
   * Get reading progress for a specific book.
   */
  async getReaderProgress(bookId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${KEYS.READER_PROGRESS_PREFIX}${bookId}_progress`);
    } catch (error) {
      console.error('Failed to get reading progress:', error);
      return null;
    }
  }

  /**
   * Cache book data.
   */
  async cacheBookData(book: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(`${KEYS.CACHED_BOOK_DATA_PREFIX}${book.id}_data`, JSON.stringify(book));
      return true;
    } catch (error) {
      console.error('Failed to cache book data:', error);
      return false;
    }
  }

  /**
   * Get cached book data.
   */
  async getCachedBookData(bookId: string): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.CACHED_BOOK_DATA_PREFIX}${bookId}_data`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get cached book data:', error);
      return null;
    }
  }

  // ------------------------------
  // Data Management
  // ------------------------------
  
  /**
   * Clear all stored data (for debugging or reset functionality).
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.SECTIONS,
        KEYS.CURRENT_PAGE,
        KEYS.LAST_VIEWED_PAGES,
        KEYS.CURRENT_BOOK_TITLE,
        KEYS.LAST_KNOWN_RELIABLE_SECTION,
        KEYS.CURRENT_SECTION_ID,
        KEYS.COMPLETED_SECTIONS,
        KEYS.READING_STREAK,
        KEYS.COMPLETED_KHATM_COUNT
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw this.createError('Failed to clear all data', error);
    }
  }

  // ------------------------------
  // Error Handling
  // ------------------------------
  
  /**
   * Create a detailed error object for better debugging.
   */
  private createError(message: string, originalError?: any, key?: string, value?: any): StorageError {
    const error = new Error(message) as StorageError;
    error.key = key;
    error.value = value;
    error.stack = originalError?.stack;
    return error;
  }
}

// Export a singleton instance
export const storageService = new StorageService();

// For backward compatibility
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
