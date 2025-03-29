import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage, saveLastViewedPage, getLastViewedPage, loadLastViewedPages } from '../utils/storage';
import * as Haptics from 'expo-haptics';
import useCompletedSections from './useCompletedSections';

export interface SectionNavigationData {
  sections: Section[];
  currentPage: number;
  currentSection: Section;
  isSectionDrawerOpen: boolean;
  sectionDrawerAnim: Animated.Value;
}

export interface SectionNavigationActions {
  handlePageChange: (page: number) => void;
  handleSectionPress: (section: Section) => void;
  handleSectionCompletion: (section: Section, completionMethod?: 'automatic' | 'manual') => Promise<void>;
  handleToggleComplete: (sectionId: number) => Promise<void>;
  toggleSectionDrawer: () => void;
  findSectionByPage: (page: number) => Section;
  setSections: (sections: Section[]) => void;
}

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
  
  // Add the completed sections hook
  const [_, addCompletedSection] = useCompletedSections();
  
  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load saved sections and current page
        const savedSections = await loadSections();
        const savedPage = await loadCurrentPage();
        
        // First, let's check if we have any last viewed pages saved at all
        const lastViewedPages = await loadLastViewedPages();
        console.log('All saved last viewed pages:', lastViewedPages);
        
        // Find the section that contains the current page
        const section = findSectionByPage(savedSections, savedPage);
        
        // Check if we have a saved "last viewed page" for this section
        // This ensures we return to exactly where the user left off
        const lastPageForSection = await getLastViewedPage(section);
        
        // Use the most recent page with validation
        let pageToUse = lastPageForSection || savedPage;
        
        // Extra validation to prevent jumping to invalid pages
        // If page is out of bounds for all sections, reset to first page
        const lastSection = savedSections[savedSections.length - 1];
        const totalPages = lastSection.endPage;
        
        if (pageToUse > totalPages) {
          console.warn(`Saved page ${pageToUse} exceeds total pages ${totalPages}, resetting to page 1`);
          pageToUse = 1;
          // Also clear the corrupted value from storage
          saveCurrentPage(1);
        }
        
        // ADDITIONAL FIX: Check if we have any inconsistencies between sections
        // If the found section doesn't match what would be expected for the saved page,
        // this suggests data corruption - check for extreme jumps (e.g., from Manzil 2 to Manzil 7)
        const sectionId = section.id;
        const expectedSectionRange = [Math.max(1, sectionId - 1), Math.min(savedSections.length, sectionId + 1)];
        
        // Check if we're jumping more than one section - this suggests potential corruption
        if (Math.abs(section.id - savedSections.length) > 1 && section.id === savedSections.length) {
          console.warn(`Detected potential navigation corruption - jumping from a middle section to last section (${section.title})`);
          
          // Instead of loading the last section, reset to first section page 1
          console.log(`Resetting to first section`);
          
          setCurrentPage(1);
          setCurrentSection(savedSections[0]);
          
          // Also clear the corrupted values from storage
          await saveCurrentPage(1);
          return;
        }
        
        // Ensure the page is valid for this section
        const validPage = Math.max(
          section.startPage,
          Math.min(pageToUse, section.endPage)
        );
        
        console.log(`Loading saved state - Page: ${validPage}, Section: ${section.title} (${section.startPage}-${section.endPage})`);
        
        // Set all states at once to avoid UI inconsistency
        setSections(savedSections);
        setCurrentPage(validPage);
        setCurrentSection(section);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to defaults if there's an error
        setCurrentPage(1);
        setCurrentSection(initialSections[0]);
      }
    };
    
    loadData();
  }, [initialSections]);
  
  // Find which section contains a specific page - improved logic
  const findSectionByPage = (sectionList: Section[], page: number): Section => {
    console.log(`Finding section for page ${page}`);
    
    // Safeguard against corrupted page values
    if (!page || page < 1) {
      console.warn(`Invalid page value: ${page}, defaulting to first section`);
      return sectionList[0];
    }
    
    // Special case: If page is past the last section's endPage, return first section instead of last
    // This prevents jumping to the last section on app load with corrupted data
    const lastSection = sectionList[sectionList.length - 1];
    if (page > lastSection.endPage) {
      console.warn(`Page ${page} is beyond all section ranges (max: ${lastSection.endPage}), defaulting to first section`);
      // Return first section instead of last to prevent unexpected jumps to the end
      return sectionList[0];
    }
    
    // SPECIFIC FIX FOR MANZIL 7 ISSUE
    // If this is Manzil 7 around page 15, check if this is actually a valid navigation
    // or if it might be corruption from a previous state
    const lastSectionId = sectionList.length;
    const isLastSection = (section: Section) => section.id === lastSectionId;
    const manzil7 = sectionList.find(isLastSection);
    
    if (manzil7 && manzil7.title.includes('Manzil 7') && 
        page >= manzil7.startPage && page <= manzil7.endPage) {
      
      // Check AsyncStorage to see if we have evidence of a previous session in Manzil 2
      // This is a heuristic to detect potentially corrupted state
      AsyncStorage.getItem('last_known_reliable_section').then(lastReliableSection => {
        if (lastReliableSection && parseInt(lastReliableSection) < 7) {
          console.warn(`Potential issue detected: Jump from section ${lastReliableSection} to Manzil 7`);
          // We don't reset here, but log the issue for debugging
        }
      }).catch(err => {
        console.error('Error checking last reliable section:', err);
      });
      
      // Store current section for future reference
      AsyncStorage.setItem('last_known_reliable_section', manzil7.id.toString())
        .catch(err => console.error('Error storing last reliable section:', err));
    }
    
    // First check if we're on a boundary page that's both the end of one section and start of another
    for (let i = 0; i < sectionList.length - 1; i++) {
      const currentSection = sectionList[i];
      const nextSection = sectionList[i + 1];
      
      // If this page is both the end of current section and start of next section
      if (page === currentSection.endPage && page === nextSection.startPage) {
        // For boundary pages, ALWAYS prefer the next section
        // This ensures pages like 22 are shown as "page 1 of Manzil 2" instead of "page 22 of Manzil 1"
        console.log(`Treating page ${page} as part of ${nextSection.title}`);
        return nextSection;
      }
    }
    
    // If not a boundary page, first check if this page is the startPage of any section
    for (const section of sectionList) {
      if (page === section.startPage) {
        console.log(`Page ${page} is the start page of ${section.title}`);
        return section;
      }
    }
    
    // If not a start page, then check which section's range contains this page
    for (const section of sectionList) {
      // For the last section, include both startPage and endPage
      if (section.id === sectionList.length && page >= section.startPage && page <= section.endPage) {
        console.log(`Page ${page} is within range of last section ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      } 
      // For all other sections, include startPage but exclude endPage (since endPage is the startPage of next section)
      else if (page >= section.startPage && page < section.endPage) {
        console.log(`Page ${page} is within range of ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      }
    }
    
    // If we're past all sections, return the first section
    if (page > sectionList[sectionList.length - 1].endPage) {
      console.log(`Page ${page} is past all sections, returning first section instead`);
      // Changed behavior: return first section instead of last to avoid jumping to end
      return sectionList[0];
    }
    
    // Default to first section
    console.log(`Page ${page} defaulting to first section`);
    return sectionList[0];
  };
  
  // State for tracking page history and navigation type
  const [previousPage, setPreviousPage] = useState<number | null>(null);
  const [secondPreviousPage, setSecondPreviousPage] = useState<number | null>(null);
  
  // Handle page changes with improved section detection
  const handlePageChange = (page: number) => {
    console.log(`handlePageChange called with page: ${page}, isDirectNavigation: ${isDirectNavigation.current}`);
    
    // Validate page number to prevent invalid values
    if (page < 1 || page > 150) {
      console.warn(`Invalid page number: ${page}, ignoring change`);
      return;
    }
    
    // Find the correct section for this page
    const section = findSectionByPage(sections, page);
    console.log(`Found section for page ${page}: ${section.title} (${section.startPage}-${section.endPage})`);
    
    // IMMEDIATELY update state to ensure UI updates fast
    setCurrentPage(page);
    
    // If section changed, update it immediately too
    if (section.id !== currentSection.id) {
      console.log(`Section changed from ${currentSection.title} to ${section.title}`);
      setCurrentSection(section);
    }
    
    // Save data in the background - ensure we persist both current page and section-specific last viewed page
    Promise.all([
      saveCurrentPage(page),
      saveLastViewedPage(section.id, page)
    ]).catch(err => {
      console.error('Error saving page data:', err);
    });
    
    // Check if this is the last page of the last section
    const isLastSection = section.id === sections.length;
    const isLastPage = page === section.endPage;
    
    // If we've reached the end of the last section, check if all other sections are completed
    if (isLastSection && isLastPage) {
      console.log('Reached the last page of the last section');
      
      // Check if all other sections are already marked as completed
      const allOtherSectionsCompleted = sections.slice(0, -1).every(s => s.isCompleted);
      
      if (allOtherSectionsCompleted) {
        console.log('All sections are completed! Triggering khatm completion');
        
        // Mark the last section as completed
        if (!section.isCompleted) {
          handleSectionCompletion(section, 'automatic').then(() => {
            // Trigger the onSectionComplete callback which will show the khatm completion notification
            onSectionComplete(section, 'automatic');
          });
        }
      }
    }
    
    // Skip auto-completion logic if this is a direct navigation
    if (isDirectNavigation.current) {
      console.log('Direct navigation detected, skipping auto-completion logic');
      
      // Reset direct navigation flag after handling page change
      isDirectNavigation.current = false;
      
      // Update previous pages for next comparison
      setSecondPreviousPage(previousPage);
      setPreviousPage(page);
      return;
    }
    
    // Check for manzil completion conditions
    const isLastPageOfManzil = page === section.endPage;
    const isManzilSection = section.title.includes('Manzil');
    const isNotAlreadyCompleted = !section.isCompleted;
    
    // Check if we've reached the last page of a manzil section and it's not already completed
    if (isLastPageOfManzil && isNotAlreadyCompleted && isManzilSection) {
      console.log(`Last page of ${section.title} reached! Marking as completed.`);
      
      // Trigger addictive haptic feedback pattern for manzil completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 400);
      
      // Mark section as completed
      handleSectionCompletion(section, 'automatic');
    }
    
    // Special case: Check if user is naturally scrolling to the first page of the next manzil
    // This should mark the previous manzil as complete if it's not already
    if (previousPage !== null && !isDirectNavigation.current) {
      // Find the section for the previous page
      const previousSection = findSectionByPage(sections, previousPage);
      
      // Check if we're at the first page of a manzil and the previous page was the last page of the previous manzil
      const isFirstPageOfManzil = page === section.startPage;
      const wasPreviousPageLastOfPreviousManzil = previousPage === previousSection.endPage;
      const isPreviousManzilNotCompleted = !previousSection.isCompleted;
      const areDifferentManzils = section.id !== previousSection.id;
      const isPreviousSectionManzil = previousSection.title.includes('Manzil');
      
      // Check if this is a natural scroll (sequential page change) vs. a direct navigation
      // Natural scroll: page numbers should be consecutive (e.g., 22 after 21)
      const isNaturalScroll = Math.abs(page - previousPage) === 1;
      
      // If we're naturally scrolling from the last page of a manzil to the first page of the next manzil
      if (isFirstPageOfManzil && wasPreviousPageLastOfPreviousManzil && 
          isPreviousManzilNotCompleted && areDifferentManzils && isPreviousSectionManzil &&
          isNaturalScroll) {
        console.log(`Natural scroll from last page of ${previousSection.title} to first page of ${section.title} detected!`);
        console.log(`Marking ${previousSection.title} as completed.`);
        
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 400);
        
        // Mark previous section as completed
        handleSectionCompletion(previousSection, 'automatic');
      }
    }
    
    // Special case for natural scrolling pattern: 3rd last page -> 2nd last page -> last page of manzil
    // Example: In manzil 1, scrolling from page 20 -> 21 -> 22 (which is also the first page of manzil 2)
    if (previousPage !== null && secondPreviousPage !== null && !isDirectNavigation.current) {
      // Find the sections for the current and previous pages
      const currentSection = findSectionByPage(sections, page);
      const previousSection = findSectionByPage(sections, previousPage);
      
      // Check if we're at the first page of a new manzil
      const isFirstPageOfNewManzil = page === currentSection.startPage && currentSection.id > 1;
      
      // Check if the previous section is not completed
      const isPreviousSectionNotCompleted = !previousSection.isCompleted;
      
      // Check if this is a natural scroll sequence (consecutive page numbers)
      const isNaturalScrollFromSecondPrevious = Math.abs(secondPreviousPage - previousPage) === 1;
      const isNaturalScrollFromPrevious = Math.abs(previousPage - page) === 1;
      const isNaturalScrollSequence = isNaturalScrollFromSecondPrevious && isNaturalScrollFromPrevious;
      
      // Check if we have a natural scrolling pattern from 3rd last -> 2nd last -> last page
      const isNaturalScrollingPattern = 
        // Current page is first page of new manzil (e.g., page 22 for manzil 2)
        isFirstPageOfNewManzil &&
        // Previous page was second-to-last page of previous manzil (e.g., page 21 for manzil 1)
        previousPage === previousSection.endPage - 1 &&
        // Second previous page was third-to-last page of previous manzil (e.g., page 20 for manzil 1)
        secondPreviousPage === previousSection.endPage - 2 &&
        // Previous section is a manzil
        previousSection.title.includes('Manzil') &&
        // Previous section is not already completed
        isPreviousSectionNotCompleted &&
        // This is a natural scroll sequence (consecutive page numbers)
        isNaturalScrollSequence;
      
      if (isNaturalScrollingPattern) {
        console.log(`Natural scrolling pattern detected: ${secondPreviousPage} -> ${previousPage} -> ${page}`);
        console.log(`This completes ${previousSection.title}. Marking as completed.`);
        
        // Trigger haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 400);
        
        // Mark previous section as completed
        handleSectionCompletion(previousSection, 'automatic');
      }
    }
    
    // Update previous pages for next comparison
    setSecondPreviousPage(previousPage);
    setPreviousPage(page);
  };
  
  // Handle section selection
  const handleSectionPress = (section: Section) => {
    console.log(`Direct navigation to section: ${section.title}`);
    
    // Set direct navigation flag to prevent auto-completion of previous manzil
    isDirectNavigation.current = true;
    
    // Find the previous section if there was a previous page
    if (previousPage !== null) {
      const previousSection = findSectionByPage(sections, previousPage);
      console.log(`Previous section was: ${previousSection.title}`);
    }
    
    // Always explicitly set the current section first to ensure proper context
    setCurrentSection(section);
    
    // Check if the section is completed
    if (section.isCompleted) {
      console.log(`Section ${section.title} is completed. Navigating to start page: ${section.startPage}`);
      // For completed sections, always go to start page
      setCurrentPage(section.startPage);
      setSecondPreviousPage(null);
      setPreviousPage(section.startPage);
      // Close drawer immediately to avoid timing issues
      toggleSectionDrawer();
    } else {
      // Only get last viewed page for incomplete sections
      getLastViewedPage(section).then(lastViewedPage => {
        console.log(`Retrieved last viewed page for ${section.title}: ${lastViewedPage}`);
        
        // Validate that the retrieved page actually belongs to this section
        if (lastViewedPage < section.startPage || lastViewedPage > section.endPage) {
          console.log(`Last viewed page ${lastViewedPage} is outside section range ${section.startPage}-${section.endPage}. Using start page.`);
          lastViewedPage = section.startPage;
        }
        
        // If the last viewed page is the last page of the section, go to start page instead
        if (lastViewedPage === section.endPage) {
          console.log(`Last viewed page is the end page. Going to start page instead.`);
          setCurrentPage(section.startPage);
          setSecondPreviousPage(null);
          setPreviousPage(section.startPage);
        } else {
          // Otherwise navigate to the last viewed page
          setCurrentPage(lastViewedPage);
          setSecondPreviousPage(null);
          setPreviousPage(lastViewedPage);
        }
      });
      // Close drawer immediately to avoid timing issues
      toggleSectionDrawer();
    }
  };
  
  // Handle section completion
  const handleSectionCompletion = async (section: Section, completionMethod?: 'automatic' | 'manual') => {
    console.log(`Section ${section.title} completed! Method: ${completionMethod || 'automatic'}`);
    
    // Default to automatic if not specified
    const method = completionMethod || 'automatic';
    
    // Get current date for completion timestamp
    const completionDate = new Date();
    
    // Update sections with completion date and method
    const updatedSections = sections.map(s => 
      s.id === section.id ? { 
        ...s, 
        isCompleted: true, 
        completionDate,
        completionMethod: method
      } : s
    );
    
    // Save to storage
    setSections(updatedSections);
    saveSections(updatedSections);
    
    // Save to completed sections for calendar view
    await addCompletedSection({
      ...section,
      isCompleted: true,
      completionDate,
      completionMethod: method
    });
    
    // Call the onSectionComplete callback with the completionMethod
    await onSectionComplete(section, method);
  };
  
  // Toggle section completion status
  const handleToggleComplete = async (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    const wasCompleted = section?.isCompleted || false;
    
    if (!section) return;
    
    const now = new Date();
    
    const updatedSections = sections.map(s => 
      s.id === sectionId 
        ? { 
            ...s, 
            isCompleted: !s.isCompleted,
            // Clear completionDate if toggling from completed to incomplete
            completionDate: !s.isCompleted ? now : undefined,
            // Set completion method to manual when toggling in navigation
            completionMethod: !s.isCompleted ? 'manual' as const : undefined
          } 
        : s
    );
    
    // If toggling to completed, add to completed sections for calendar
    if (!wasCompleted) {
      await addCompletedSection({
        ...section,
        isCompleted: true,
        completionDate: now,
        completionMethod: 'manual' as const
      });
      
      // Call onSectionComplete to trigger modals for manzil completion
      if (section.title.includes('Manzil')) {
        await onSectionComplete(section, 'manual');
      }
    }
    
    setSections(updatedSections);
    saveSections(updatedSections);
  };
  
  // Toggle section drawer
  const toggleSectionDrawer = () => {
    Animated.timing(sectionDrawerAnim, {
      toValue: isSectionDrawerOpen ? -330 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsSectionDrawerOpen(!isSectionDrawerOpen);
  };
  
  // Update current section whenever current page changes
  useEffect(() => {
    // Only run this effect after initial load
    if (currentPage > 0) {
      const section = findSectionByPage(sections, currentPage);
      if (section.id !== currentSection.id) {
        console.log(`Updating section for page ${currentPage} from ${currentSection.title} to ${section.title}`);
        setCurrentSection(section);
      }
    }
  }, [currentPage, sections]);
  
  return [
    {
      sections,
      currentPage,
      currentSection,
      isSectionDrawerOpen,
      sectionDrawerAnim
    },
    {
      handlePageChange,
      handleSectionPress,
      handleSectionCompletion,
      handleToggleComplete,
      toggleSectionDrawer,
      findSectionByPage: (page: number) => findSectionByPage(sections, page),
      setSections
    }
  ];
}; 