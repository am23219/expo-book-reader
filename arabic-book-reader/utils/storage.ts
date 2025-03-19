import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section, SECTIONS } from '../models/Section';

// Keys for AsyncStorage
const SECTIONS_STORAGE_KEY = 'arabic_book_reader_sections';
const CURRENT_PAGE_STORAGE_KEY = 'arabic_book_reader_current_page';
const LAST_VIEWED_PAGES_KEY = 'arabic_book_reader_last_viewed_pages';

/**
 * Load saved sections from AsyncStorage
 */
export const loadSections = async (): Promise<Section[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SECTIONS_STORAGE_KEY);
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
      const parsedPage = parseInt(value, 10);
      
      // Validate page number is in a reasonable range
      // This prevents corrupted values from causing navigation issues
      if (!isNaN(parsedPage) && parsedPage >= 1 && parsedPage <= 150) {
        return parsedPage;
      } else {
        console.warn(`Invalid saved page value: ${value}, defaulting to page 1`);
        return 1;
      }
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
 * Load last viewed pages for all sections
 */
export const loadLastViewedPages = async (): Promise<Record<number, number>> => {
  try {
    const jsonValue = await AsyncStorage.getItem(LAST_VIEWED_PAGES_KEY);
    if (jsonValue !== null) {
      return JSON.parse(jsonValue);
    }
    return {}; // Return empty record if none is saved
  } catch (error) {
    console.error('Error loading last viewed pages:', error);
    return {}; // Return empty record on error
  }
};

/**
 * Save last viewed page for a specific section
 */
export const saveLastViewedPage = async (sectionId: number, page: number): Promise<void> => {
  try {
    // First load current data
    const lastViewedPages = await loadLastViewedPages();
    
    // Load sections to validate page is within section range
    const sections = await loadSections();
    const section = sections.find(s => s.id === sectionId);
    
    if (section) {
      // Additional validation for extreme jumps in section navigation
      // If we're jumping to Manzil 7 from a lower section, log it for debugging
      if (section.title.includes('Manzil 7')) {
        console.log(`Saving page ${page} as last viewed for Manzil 7`);
        
        // Check if we're seeing a large jump in section navigation
        const currentSectionId = await AsyncStorage.getItem('current_section_id');
        if (currentSectionId && parseInt(currentSectionId) < 6) {
          console.warn(`Unusual section navigation detected: Jump from section ${currentSectionId} to Manzil 7`);
        }
        
        // Update tracking of current section
        await AsyncStorage.setItem('current_section_id', sectionId.toString());
      }
      
      // Only save if page is within this section's range
      if (page >= section.startPage && page <= section.endPage) {
        console.log(`Saving page ${page} as last viewed for section ${sectionId} (${section.title})`);
        // Update with new value
        lastViewedPages[sectionId] = page;
        
        // Save back to storage
        await AsyncStorage.setItem(LAST_VIEWED_PAGES_KEY, JSON.stringify(lastViewedPages));
      } else {
        console.warn(`Page ${page} is outside the range of section ${sectionId} (${section.startPage}-${section.endPage}). Not saving.`);
      }
    } else {
      console.warn(`Section with ID ${sectionId} not found. Cannot save last viewed page.`);
    }
  } catch (error) {
    console.error('Error saving last viewed page:', error);
  }
};

/**
 * Get last viewed page for a specific section
 * Returns startPage of the section if no last viewed page is saved
 */
export const getLastViewedPage = async (section: Section): Promise<number> => {
  try {
    const lastViewedPages = await loadLastViewedPages();
    const savedPage = lastViewedPages[section.id];
    
    // Validate the saved page is within this section's range
    if (savedPage !== undefined && 
        savedPage >= section.startPage && 
        savedPage <= section.endPage) {
      return savedPage;
    } else if (savedPage !== undefined) {
      console.warn(`Saved page ${savedPage} for section ${section.id} is outside valid range (${section.startPage}-${section.endPage}), resetting to section start page`);
    }
    
    return section.startPage;
  } catch (error) {
    console.error('Error getting last viewed page:', error);
    return section.startPage; // Return section start page on error
  }
};

/**
 * Clear all stored data (for debugging or reset functionality)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      SECTIONS_STORAGE_KEY,
      CURRENT_PAGE_STORAGE_KEY,
      LAST_VIEWED_PAGES_KEY
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