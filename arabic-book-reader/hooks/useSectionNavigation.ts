import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage } from '../utils/storage';
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
  handleSectionCompletion: (section: Section) => Promise<void>;
  handleToggleComplete: (sectionId: number) => void;
  toggleSectionDrawer: () => void;
  findSectionByPage: (page: number) => Section;
  setSections: (sections: Section[]) => void;
}

/**
 * Custom hook for managing section navigation
 */
export const useSectionNavigation = (
  initialSections: Section[],
  onSectionComplete: (section: Section) => Promise<void>
): [SectionNavigationData, SectionNavigationActions] => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<Section>(initialSections[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  
  const sectionDrawerAnim = useRef(new Animated.Value(-280)).current;
  const lastVisitedPages = useRef<number[]>([]);
  const isDirectNavigation = useRef(false);
  
  // Add the completed sections hook
  const [_, addCompletedSection] = useCompletedSections();
  
  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSections = await loadSections();
        const savedPage = await loadCurrentPage();
        
        // Find the section that contains the current page BEFORE setting state
        const section = findSectionByPage(savedSections, savedPage);
        
        // Set all states at once to avoid UI inconsistency
        setSections(savedSections);
        setCurrentPage(savedPage);
        setCurrentSection(section); // Set the correct section
        
        console.log(`Initial load - Page: ${savedPage}, Section: ${section.title} (${section.startPage}-${section.endPage})`);
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
    
    // Special case for boundary pages (like page 22 which is both end of Manzil 1 and start of Manzil 2)
    // If we're coming from a lower page number, we want to consider it part of the previous manzil
    // If we're coming from a higher page number, we want to consider it part of the next manzil
    if (previousPage !== null) {
      // Check if this page is a boundary page (both end of one section and start of another)
      const isBoundaryPage = sectionList.some((section, index) => {
        // Skip the last section as it can't be a boundary with a next section
        if (index === sectionList.length - 1) return false;
        
        // Check if this page is the end of current section and start of next section
        const nextSection = sectionList[index + 1];
        return page === section.endPage && page === nextSection.startPage;
      });
      
      if (isBoundaryPage) {
        console.log(`Page ${page} is a boundary page between two manzils`);
        
        // If we're scrolling forward (from a lower page number)
        if (previousPage < page) {
          // Find the section where this page is the end page
          const section = sectionList.find(s => s.endPage === page);
          if (section) {
            console.log(`Coming from lower page ${previousPage}, treating page ${page} as part of ${section.title}`);
            return section;
          }
        } 
        // If we're scrolling backward (from a higher page number)
        else if (previousPage > page) {
          // Find the section where this page is the start page
          const section = sectionList.find(s => s.startPage === page);
          if (section) {
            console.log(`Coming from higher page ${previousPage}, treating page ${page} as part of ${section.title}`);
            return section;
          }
        }
      }
    }
    
    // First check if this page is the startPage of any section
    // If it is, prioritize the section that's starting
    for (const section of sectionList) {
      if (page === section.startPage) {
        console.log(`Page ${page} is the start page of ${section.title}`);
        return section;
      }
    }
    
    // If not a start page, then check which section's range contains this page
    for (const section of sectionList) {
      // Check if page is within this section's range (inclusive of start, exclusive of end except for the last section)
      if (section.id === sectionList.length && page >= section.startPage && page <= section.endPage) {
        // Special case for the last section - include the end page
        console.log(`Page ${page} is within range of last section ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      } else if (page >= section.startPage && page < section.endPage) {
        console.log(`Page ${page} is within range of ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      }
    }
    
    // If we're past all sections, return the last section
    if (page > sectionList[sectionList.length - 1].endPage) {
      console.log(`Page ${page} is past all sections, returning last section`);
      return sectionList[sectionList.length - 1];
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
    
    // Update state and save to storage
    setCurrentPage(page);
    saveCurrentPage(page);
    
    // Always update the section if it's different
    if (section.id !== currentSection.id) {
      console.log(`Section changed from ${currentSection.title} to ${section.title}`);
      setCurrentSection(section);
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
      handleSectionCompletion(section);
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
        handleSectionCompletion(previousSection);
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
        handleSectionCompletion(previousSection);
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
    
    // Update state
    setCurrentSection(section);
    setCurrentPage(section.startPage);
    
    // Update previous page tracking to avoid false "natural scrolling" detection
    // This ensures we don't trigger the auto-completion logic when directly navigating
    setSecondPreviousPage(null);
    setPreviousPage(section.startPage);
    
    toggleSectionDrawer(); // Close drawer after selection
  };
  
  // Handle section completion
  const handleSectionCompletion = async (section: Section) => {
    console.log(`Section ${section.title} completed!`);
    
    // Get current date for completion timestamp
    const completionDate = new Date();
    
    // Update sections with completion date
    const updatedSections = sections.map(s => 
      s.id === section.id ? { ...s, isCompleted: true, completionDate } : s
    );
    
    // Save to storage
    setSections(updatedSections);
    saveSections(updatedSections);
    
    // Save to completed sections for calendar view
    await addCompletedSection({
      ...section,
      isCompleted: true,
      completionDate
    });
    
    // Call the onSectionComplete callback
    await onSectionComplete(section);
  };
  
  // Toggle section completion status
  const handleToggleComplete = (sectionId: number) => {
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
            completionDate: !s.isCompleted ? now : undefined
          } 
        : s
    );
    
    // If toggling to completed, add to completed sections for calendar
    if (!wasCompleted) {
      addCompletedSection({
        ...section,
        isCompleted: true,
        completionDate: now
      });
    }
    
    setSections(updatedSections);
    saveSections(updatedSections);
  };
  
  // Toggle section drawer
  const toggleSectionDrawer = () => {
    Animated.timing(sectionDrawerAnim, {
      toValue: isSectionDrawerOpen ? -280 : 0,
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