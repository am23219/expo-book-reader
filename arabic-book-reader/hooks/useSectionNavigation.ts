import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Section } from '../models/Section';
import { storage } from '../utils/storage';
import useCompletedSections from './useCompletedSections';

// Types
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
 * Custom hook for managing section navigation with storage persistence
 */
export const useSectionNavigation = (
  initialSections: Section[],
  onSectionComplete: (section: Section, completionMethod?: 'automatic' | 'manual') => Promise<void>
): [SectionNavigationData, SectionNavigationActions] => {
  // State
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<Section>(initialSections[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  
  // Animation state
  const sectionDrawerAnim = useRef(new Animated.Value(-330)).current;
  
  // Navigation tracking
  const [prevPage, setPrevPage] = useState<number | null>(null);
  const isDirectNavigation = useRef(false);
  
  // Add the completed sections hook
  const [_, addCompletedSection] = useCompletedSections();
  
  /**
   * Find which section contains a specific page
   */
  const findSectionByPage = (page: number): Section => {
    console.log(`Finding section for page ${page}`);
    
    // Validate input
    if (!page || page < 1) {
      console.warn(`Invalid page: ${page}, defaulting to first section`);
      return sections[0];
    }
    
    // Edge case: If page is beyond all sections, return first section
    const lastSection = sections[sections.length - 1];
    if (page > lastSection.endPage) {
      console.warn(`Page ${page} is beyond all sections (max: ${lastSection.endPage})`);
      return sections[0];
    }

    // Handle boundary pages that are both end of one section and start of another
    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];
      
      if (page === currentSection.endPage && page === nextSection.startPage) {
        // For boundary pages, prefer the next section
        console.log(`Page ${page} is a boundary page, using ${nextSection.title}`);
        return nextSection;
      }
    }
    
    // Check if page is the start page of any section
    for (const section of sections) {
      if (page === section.startPage) {
        console.log(`Page ${page} is the start page of ${section.title}`);
        return section;
      }
    }
    
    // Find section that contains this page
    for (const section of sections) {
      if (page >= section.startPage && page <= section.endPage) {
        console.log(`Page ${page} is within range of ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      }
    }
    
    // Fallback to first section
    console.log(`No section contains page ${page}, defaulting to first section`);
    return sections[0];
  };
  
  /**
   * Initialize data from storage when component mounts
   */
  useEffect(() => {
    const initializeFromStorage = async () => {
      try {
        console.log('Initializing section navigation from storage...');
        
        // 1. Load sections
        const savedSections = await storage.loadSections(initialSections);
        
        // 2. Load global current page
        const savedPage = await storage.loadCurrentPage(1);
        console.log(`Loaded current page from storage: ${savedPage}`);
        
        // 3. Find which section contains this page
        const section = findSectionByPage(savedPage);
        console.log(`Current section based on global page: ${section.title}`);
        
        // 4. Load section-specific last viewed page
        const sectionPage = await storage.getLastViewedPage(section);
        console.log(`Last viewed page for ${section.title}: ${sectionPage}`);
        
        // 5. Use section-specific page if available, otherwise use global page
        const finalPage = sectionPage || savedPage;
        
        // 6. Validate the page is within valid range for the section
        const validPage = Math.max(
          section.startPage,
          Math.min(finalPage, section.endPage)
        );
        
        console.log(`Initializing with page ${validPage} in section ${section.title}`);
        
        // 7. Update all state together
        setSections(savedSections);
        setCurrentPage(validPage);
        setCurrentSection(section);
      } catch (error) {
        console.error('Error initializing from storage:', error);
        
        // Default to page 1, first section if there's an error
        setCurrentPage(1);
        setCurrentSection(initialSections[0]);
      }
    };
    
    initializeFromStorage();
  }, [initialSections]);
  
  /**
   * Handle page changes
   */
  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    
    // Validate page number
    if (page < 1) {
      console.warn(`Invalid page number: ${page}`);
      return;
    }
    
    // Find which section contains this page
    const section = findSectionByPage(page);
    
    // Update navigation tracking
    setPrevPage(currentPage);
    
    // Update state immediately for responsive UI
    setCurrentPage(page);
    
    // Update section if it changed
    if (section.id !== currentSection.id) {
      console.log(`Section changed from ${currentSection.title} to ${section.title}`);
      setCurrentSection(section);
    }
    
    // Save in background
    Promise.all([
      storage.saveCurrentPage(page),
      storage.saveLastViewedPage(section.id, page, sections)
    ]).catch(err => {
      console.error('Error saving page data:', err);
    });
    
    // Check if we're on the last page of a section to handle completion
    const isLastPage = page === section.endPage;
    
    if (isLastPage && !section.isCompleted) {
      console.log(`Reached last page of ${section.title}`);
      
      // Auto-complete after a short delay to ensure the page is viewed
      setTimeout(() => {
        handleSectionCompletion(section, 'automatic');
      }, 1000);
    }
  };
  
  /**
   * Handle section completion
   */
  const handleSectionCompletion = async (section: Section, completionMethod?: 'automatic' | 'manual') => {
    try {
      console.log(`Completing section ${section.title} (${completionMethod || 'automatic'})`);
      
      // Update section in state
      const updatedSection = {
        ...section,
        isCompleted: true,
        completionDate: new Date()
      };
      
      // Update sections array
      const updatedSections = sections.map(s => 
        s.id === section.id ? updatedSection : s
      );
      
      // Update state
      setSections(updatedSections);
      
      // Save to storage
      await storage.saveSections(updatedSections);
      
      // Save completed section for history
      await addCompletedSection({
        ...updatedSection,
        completionMethod: completionMethod || 'automatic'
      });
      
      // Record reading day
      await storage.recordReadingDay();
      
      // Call the completion callback
      await onSectionComplete(updatedSection, completionMethod);
      
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error completing section:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  /**
   * Toggle section completion status
   */
  const handleToggleComplete = async (sectionId: number) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        console.warn(`Section ${sectionId} not found`);
        return;
      }
      
      if (!section.isCompleted) {
        // Mark as complete
        await handleSectionCompletion(section, 'manual');
      } else {
        // Mark as incomplete
        const updatedSection = {
          ...section,
          isCompleted: false,
          completionDate: undefined
        };
        
        const updatedSections = sections.map(s => 
          s.id === sectionId ? updatedSection : s
        );
        
        setSections(updatedSections);
        await storage.saveSections(updatedSections);
        
        // Provide feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error toggling section completion:', error);
    }
  };
  
  /**
   * Handle section selection
   */
  const handleSectionPress = (section: Section) => {
    try {
      console.log(`Selected section: ${section.title}`);
      
      // Set navigation type
      isDirectNavigation.current = true;
      
      // Mark that we're navigating directly to a section
      if (section.isCompleted) {
        // For completed sections, always go to the start page
        setCurrentPage(section.startPage);
      } else {
        // For incomplete sections, go to the last viewed page or start page
        storage.getLastViewedPage(section).then((lastViewedPage: number) => {
          console.log(`Last viewed page for ${section.title}: ${lastViewedPage}`);
          
          // Validate the page is within this section
          if (lastViewedPage < section.startPage || lastViewedPage > section.endPage) {
            console.warn(`Last viewed page ${lastViewedPage} is outside section range`);
            lastViewedPage = section.startPage;
          }
          
          // Special case: if last viewed page is the end page, go to start
          if (lastViewedPage === section.endPage) {
            console.log(`Last viewed page is the end page, going to start page`);
            setCurrentPage(section.startPage);
          } else {
            setCurrentPage(lastViewedPage);
          }
        }).catch((error: any) => {
          console.error('Error getting last viewed page:', error);
          setCurrentPage(section.startPage);
        });
      }
      
      // Update current section
      setCurrentSection(section);
      
      // Close the drawer
      toggleSectionDrawer();
    } catch (error) {
      console.error('Error in section press:', error);
    }
  };
  
  /**
   * Toggle section drawer
   */
  const toggleSectionDrawer = () => {
    setIsSectionDrawerOpen(!isSectionDrawerOpen);
    
    Animated.timing(sectionDrawerAnim, {
      toValue: isSectionDrawerOpen ? -330 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
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
      findSectionByPage,
      setSections
    }
  ];
}; 