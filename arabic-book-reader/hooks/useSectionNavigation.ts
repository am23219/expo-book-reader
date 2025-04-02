import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Section } from '../models/Section';
import storageService from '../utils/storageService';
import * as Haptics from 'expo-haptics';

export interface SectionNavigationData {
  sections: Section[];
  currentPage: number;
  currentSection: Section;
  isSectionDrawerOpen: boolean;
  sectionDrawerAnim: Animated.Value;
}

export interface SectionNavigationActions {
  handlePageChange: (page: number) => void;
  handleSectionPress: (section: Section, toggleDrawer?: boolean) => void;
  handleSectionCompletion: (section: Section, completionMethod?: 'automatic' | 'manual') => Promise<void>;
  handleToggleComplete: (sectionId: number) => Promise<void>;
  toggleSectionDrawer: () => void;
  findSectionByPage: (page: number) => Section;
  setSections: (sections: Section[]) => void;
}

// Add debounce utility to prevent rapid save operations
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Custom hook for managing section navigation
 */
export const useSectionNavigation = (
  initialSections: Section[],
  onSectionComplete: (section: Section, completionMethod?: 'automatic' | 'manual') => Promise<void>
): [SectionNavigationData, SectionNavigationActions] => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<Section>(initialSections[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  
  const sectionDrawerAnim = useRef(new Animated.Value(-330)).current;
  const lastVisitedPages = useRef<number[]>([]);
  const isDirectNavigation = useRef(false);
  // Add a new ref to track save operations
  const pendingSaves = useRef<{sectionId: number, page: number} | null>(null);
  
  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      let pageToLoad = 1;
      let sectionToLoad: Section | undefined;
      let loadedSections: Section[] = [];
      
      try {
        console.log('Attempting to load saved state...');
        loadedSections = await storageService.loadSections();
        if (!loadedSections || loadedSections.length === 0) {
          console.warn('No valid sections loaded, using initial defaults.');
          loadedSections = initialSections; // Fallback if loading fails
        }
        
        // Get both the last section ID and the last viewed pages
        const lastSectionId = await storageService.getCurrentSectionId();
        const lastViewedPages = await storageService.loadLastViewedPages();
        
        console.log(`Loaded last section ID: ${lastSectionId}`);
        
        if (lastSectionId !== null) {
          sectionToLoad = loadedSections.find(s => s.id === lastSectionId);
          
          if (sectionToLoad) {
            console.log(`Found last section: ${sectionToLoad.title}`);
            
            // Get the actual last viewed page for this section
            pageToLoad = await storageService.getLastViewedPage(sectionToLoad);
            console.log(`Loaded last viewed page for section ${sectionToLoad.id}: ${pageToLoad}`);
            
            // Validate page is within section bounds
            if (pageToLoad < sectionToLoad.startPage || pageToLoad > sectionToLoad.endPage) {
              console.warn(`Loaded page ${pageToLoad} is outside bounds of section ${sectionToLoad.title} (${sectionToLoad.startPage}-${sectionToLoad.endPage}). Resetting to section start page.`);
              pageToLoad = sectionToLoad.startPage;
            }
          } else {
            console.warn(`Saved section ID ${lastSectionId} not found in loaded sections. Defaulting.`);
            
            // Try to find a section with saved reading progress
            const sectionWithProgress = Object.keys(lastViewedPages).find(sectionId => {
              const section = loadedSections.find(s => s.id === parseInt(sectionId));
              return section !== undefined;
            });
            
            if (sectionWithProgress) {
              const sectionId = parseInt(sectionWithProgress);
              sectionToLoad = loadedSections.find(s => s.id === sectionId);
              if (sectionToLoad) {
                pageToLoad = lastViewedPages[sectionId];
                console.log(`Using last viewed page ${pageToLoad} from section ${sectionToLoad.title} based on reading history`);
                
                // Make sure the page is valid
                if (pageToLoad < sectionToLoad.startPage || pageToLoad > sectionToLoad.endPage) {
                  pageToLoad = sectionToLoad.startPage;
                }
              }
            } else {
              sectionToLoad = loadedSections[0];
              pageToLoad = sectionToLoad.startPage;
            }
          }
        } else {
          console.log('No last section ID found. Looking for any reading progress...');
          
          // Try to find any section with reading progress
          const sectionWithProgress = Object.keys(lastViewedPages).find(sectionId => {
            const section = loadedSections.find(s => s.id === parseInt(sectionId));
            return section !== undefined;
          });
          
          if (sectionWithProgress) {
            const sectionId = parseInt(sectionWithProgress);
            sectionToLoad = loadedSections.find(s => s.id === sectionId);
            if (sectionToLoad) {
              pageToLoad = lastViewedPages[sectionId];
              console.log(`Using last viewed page ${pageToLoad} from section ${sectionToLoad.title} based on reading history`);
              
              // Make sure the page is valid
              if (pageToLoad < sectionToLoad.startPage || pageToLoad > sectionToLoad.endPage) {
                pageToLoad = sectionToLoad.startPage;
              }
            }
          } else {
            console.log('No reading progress found. Defaulting to first section, first page.');
            sectionToLoad = loadedSections[0];
            pageToLoad = sectionToLoad.startPage; // Default to start page of the first section
          }
        }
        
      } catch (error) {
        console.error('Error loading navigation data:', error);
        // Fallback to initial defaults on any error during loading
        loadedSections = initialSections;
        sectionToLoad = loadedSections[0];
        pageToLoad = sectionToLoad.startPage;
      } finally {
        // Ensure sectionToLoad is always defined before setting state
        if (!sectionToLoad && loadedSections.length > 0) {
           sectionToLoad = loadedSections[0];
           pageToLoad = sectionToLoad.startPage;
        }
        
        if (sectionToLoad) {
           console.log(`Setting initial state - Section: ${sectionToLoad.title}, Page: ${pageToLoad}`);
           setSections(loadedSections);
           setCurrentSection(sectionToLoad);
           setCurrentPage(pageToLoad);
           // Save the current section ID to ensure consistency
           storageService.setCurrentSectionId(sectionToLoad.id).catch(err => {
             console.error('Error saving initial section ID:', err);
           });
        } else {
           console.error('Could not determine a section to load. App state might be inconsistent.');
           // Potentially set some default error state or minimal default
           setSections(initialSections);
           setCurrentSection(initialSections[0]);
           setCurrentPage(initialSections[0].startPage);
        }
      }
    };
    
    loadData();
  }, [initialSections]); // Depend only on initialSections
  
  // Find which section contains a specific page - simplified logic
  const findSectionByPageInternal = (sectionList: Section[], page: number): Section => {
    // Simplified finding logic - assumes sections are sorted and contiguous
    // Important: Prioritizes the section where the page is the startPage
    console.log(`Finding section for page ${page}`);
    
    // Handle edge cases
    if (!page || page < 1 || sectionList.length === 0) {
      console.warn(`Invalid page (${page}) or empty section list, returning first section.`);
      return sectionList[0] || initialSections[0]; // Return initial if list is empty
    }
    
    // Check if page is the start page of any section (favors starting a new section)
    const startPageSection = sectionList.find(s => s.startPage === page);
    if (startPageSection) {
      console.log(`Page ${page} is the start page of ${startPageSection.title}`);
      return startPageSection;
    }
    
    // Check which section range contains the page
    const containingSection = sectionList.find(s => page >= s.startPage && page <= s.endPage);
    if (containingSection) {
       console.log(`Page ${page} is within range of ${containingSection.title}`);
       return containingSection;
    }
    
    // If page is beyond the last section, return the last section
    const lastSection = sectionList[sectionList.length - 1];
    if (page > lastSection.endPage) {
      console.warn(`Page ${page} is beyond the last section's end page (${lastSection.endPage}). Returning last section: ${lastSection.title}`);
      return lastSection;
    }
    
    // Default fallback (should ideally not be reached with contiguous sections)
    console.warn(`Could not find section for page ${page}. Defaulting to first section.`);
    return sectionList[0];
  };
  
  // State for tracking page history and navigation type
  const [previousPage, setPreviousPage] = useState<number | null>(null);
  const [secondPreviousPage, setSecondPreviousPage] = useState<number | null>(null);
  
  // Handle page changes with improved section detection
  const handlePageChange = async (page: number) => {
    console.log(`handlePageChange called with async page: ${page}`);
    
    // Validate page number against overall book bounds (assuming last section holds max page)
    const lastSection = sections[sections.length - 1];
    if (!lastSection || page < 1 || page > lastSection.endPage) {
      console.warn(`Invalid page number: ${page}, ignoring change. Max page: ${lastSection?.endPage}`);
      return;
    }
    
    // Find the correct section for this page
    const section = findSectionByPageInternal(sections, page);
    console.log(`Found section for page ${page}: ${section.title} (${section.startPage}-${section.endPage})`);
    
    const previousSectionId = currentSection.id; // Store previous ID for comparison
    
    // Update state synchronously first
    setCurrentPage(page);
    if (section.id !== previousSectionId) {
      console.log(`Section changed from ${currentSection.title} (ID: ${previousSectionId}) to ${section.title} (ID: ${section.id})`);
      setCurrentSection(section); // Update local state section
      
      // Track the latest pending save
      pendingSaves.current = {sectionId: section.id, page};
      
      // Now save the changes asynchronously, awaiting them
      try {
        console.log(`[Save State] Attempting to save Section ID: ${section.id}`);
        await storageService.setCurrentSectionId(section.id); // Await section ID save
        console.log(`[Save State] Successfully saved Section ID: ${section.id}`);
        
        // If this is still the latest pending save
        if (pendingSaves.current?.sectionId === section.id && pendingSaves.current?.page === page) {
          console.log(`[Save State] Attempting to save Page ${page} for Section ID: ${section.id}`);
          await storageService.saveLastViewedPage(section.id, page); // Await page save for this section
          console.log(`[Save State] Successfully saved Page ${page} for Section ID: ${section.id}`);
          
          // Save the global current page as well for additional fallback
          await storageService.saveCurrentPage(page);
        } else {
          console.log(`[Save State] Skipping save for Page ${page} as newer save is pending`);
        }
        
      } catch (err) {
        console.error('[Save State] Error saving navigation state after section change:', err);
        // Consider adding fallback logic or user notification here if saving fails
      }
    } else {
      // Section didn't change, just save the page
      try {
        // Track the latest pending save
        pendingSaves.current = {sectionId: section.id, page};
        
        console.log(`[Save State] Attempting to save Page ${page} for Section ID: ${section.id} (section unchanged)`);
        await storageService.saveLastViewedPage(section.id, page); // Await page save
        
        // If this is still the latest pending save
        if (pendingSaves.current?.sectionId === section.id && pendingSaves.current?.page === page) {
          console.log(`[Save State] Successfully saved Page ${page} for Section ID: ${section.id} (section unchanged)`);
          
          // Always save the global current page as well
          await storageService.saveCurrentPage(page);
        } else {
          console.log(`[Save State] Skipping global save for Page ${page} as newer save is pending`);
        }
        
      } catch (err) {
        console.error('[Save State] Error saving last viewed page data (section unchanged):', err);
      }
    }
    
    // Check for automatic section completion
    if (page === section.endPage && !section.isCompleted) {
      console.log(`Reached end of section ${section.title}, marking as complete.`);
      // Ensure handleSectionCompletion is awaited if it performs async operations
      await handleSectionCompletion(section, 'automatic');
    }
  };

  // Create a debounced version of handlePageChange
  const debouncedHandlePageChange = useRef(
    debounce(async (page: number) => {
      await handlePageChange(page);
    }, 300) // 300ms debounce period
  ).current;
  
  // Handle user manually pressing a section in the drawer
  const handleSectionPress = async (section: Section, toggleDrawer: boolean = true) => {
    console.log(`handleSectionPress: ${section.title}`);
    isDirectNavigation.current = true;
    
    try {
      // Get the last viewed page with more robust error handling
      let targetPage: number;
      
      try {
        const lastPage = await storageService.getLastViewedPage(section);
        console.log(`Retrieved last viewed page for section ${section.title}: ${lastPage}`);
        
        // Only use last page if it's valid for this section
        if (lastPage >= section.startPage && lastPage <= section.endPage && !section.isCompleted) {
          targetPage = lastPage;
          console.log(`Using saved page ${targetPage} for section ${section.title}`);
        } else {
          targetPage = section.startPage;
          console.log(`Invalid saved page ${lastPage} for section ${section.title}, using start page ${targetPage}`);
        }
      } catch (pageError) {
        // If any error occurs while getting the last page, fall back to the start page
        console.error(`Error getting last viewed page for section ${section.title}:`, pageError);
        targetPage = section.startPage;
      }
      
      console.log(`Navigating to page ${targetPage} in section ${section.title}`);
      
      // Update state first
      setCurrentPage(targetPage);
      setCurrentSection(section);
      
      // Save state with await and explicit error handling for each operation
      try {
        console.log(`[Save State] Attempting to save Section ID: ${section.id} from handleSectionPress`);
        await storageService.setCurrentSectionId(section.id);
        console.log(`[Save State] Successfully saved Section ID: ${section.id} from handleSectionPress`);
      } catch (sectionIdError) {
        console.error('[Save State] Error saving section ID:', sectionIdError);
      }
      
      try {
        console.log(`[Save State] Attempting to save Page ${targetPage} for Section ID: ${section.id} from handleSectionPress`);
        await storageService.saveLastViewedPage(section.id, targetPage);
        console.log(`[Save State] Successfully saved Page ${targetPage} for Section ID: ${section.id} from handleSectionPress`);
      } catch (pageError) {
        console.error('[Save State] Error saving last viewed page:', pageError);
      }
      
      try {
        // Save global current page as an additional fallback
        await storageService.saveCurrentPage(targetPage);
      } catch (globalPageError) {
        console.error('[Save State] Error saving global current page:', globalPageError);
      }
      
      // Close drawer after navigation, conditionally
      if (toggleDrawer) {
        toggleSectionDrawer();
      }

    } catch (error) {
      console.error('[Save State] Error handling section press:', error);
      // Fallback logic with explicit error handling
      try {
        setCurrentPage(section.startPage);
        setCurrentSection(section);
        await storageService.setCurrentSectionId(section.id);
        await storageService.saveLastViewedPage(section.id, section.startPage);
        await storageService.saveCurrentPage(section.startPage);
      } catch (saveError) {
         console.error('[Save State] Error saving fallback state in handleSectionPress:', saveError);
      }
      
      if (toggleDrawer) {
        toggleSectionDrawer();
      }
    }
  };
  
  // Handle marking section complete (automatically or manually)
  const handleSectionCompletion = async (section: Section, completionMethod: 'automatic' | 'manual' = 'automatic') => {
    console.log(`handleSectionCompletion: ${section.title} (${completionMethod})`);
    const completionDate = new Date();
    const updatedSections = sections.map((s: Section) =>
      s.id === section.id ? { ...s, isCompleted: true, completionDate } : s
    );
    setSections(updatedSections); // Update state

    const completedSection = updatedSections.find(s => s.id === section.id);

    if (!completedSection) {
      console.error(`Completed section with ID ${section.id} not found after update.`);
      return; // Avoid proceeding if the section wasn't found (should not happen)
    }

    try {
      console.log(`[Save State] Saving updated sections array after completing: ${section.title}`);
      await storageService.saveSections(updatedSections); // Save updated sections array
      console.log(`[Save State] Successfully saved updated sections array.`);

      console.log(`Calling onSectionComplete callback for ${section.title}`);
      await onSectionComplete(completedSection, completionMethod); // Call the callback passed to the hook with updated section
      console.log(`Returned from onSectionComplete callback for ${section.title}`);

    } catch (error) {
      console.error("[Save State] Error during section completion saving or callback:", error);
      // Consider reverting state if save fails?
      // setSections(sections); // Revert state on error?
    }
  };

  // Handle user toggling completion status manually (e.g., from section drawer)
  const handleToggleComplete = async (sectionId: number) => {
    console.log(`handleToggleComplete: Section ${sectionId}`);
    
    // Find the index of the section to update
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex === -1) {
      console.warn(`Section ${sectionId} not found for toggling completion.`);
      return; // Exit if section not found
    }

    const sectionToUpdate = sections[sectionIndex];
    const newCompletionStatus = !sectionToUpdate.isCompleted;

    // Create the updated section data object
    const updatedSectionData: Section = {
      ...sectionToUpdate,
      isCompleted: newCompletionStatus,
      completionDate: newCompletionStatus ? new Date() : undefined, // Use undefined instead of null
      completionMethod: newCompletionStatus ? 'manual' : undefined
    };

    // Create the new sections array with the updated section
    const updatedSections: Section[] = [
      ...sections.slice(0, sectionIndex),
      updatedSectionData,
      ...sections.slice(sectionIndex + 1)
    ];

    // Perform updates
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSections(updatedSections); // Pass the correctly typed array
    await storageService.saveSections(updatedSections); // Pass the correctly typed array

    // If marking as complete manually, trigger onSectionComplete callback
    if (updatedSectionData.isCompleted) { // Use the updated data object
      console.log(`Manually completed section ${updatedSectionData.title}`); // Use the updated data object
      await onSectionComplete(updatedSectionData, 'manual'); 
    }
  };

  // Toggle section drawer visibility
  const toggleSectionDrawer = () => {
    Animated.timing(sectionDrawerAnim, {
      toValue: isSectionDrawerOpen ? -330 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsSectionDrawerOpen(!isSectionDrawerOpen);
  };

  // Expose a version of findSectionByPage that uses the hook's current sections state
  const findSectionByPage = (page: number): Section => {
    return findSectionByPageInternal(sections, page);
  };

  return [
    { sections, currentPage, currentSection, isSectionDrawerOpen, sectionDrawerAnim },
    { 
      // Replace direct handlePageChange with the debounced version for UI events
      handlePageChange: debouncedHandlePageChange, 
      handleSectionPress, 
      handleSectionCompletion, 
      handleToggleComplete, 
      toggleSectionDrawer, 
      findSectionByPage,
      setSections
    }
  ];
}; 