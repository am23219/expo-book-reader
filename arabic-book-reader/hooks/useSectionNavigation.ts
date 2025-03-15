import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Section } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage } from '../utils/storage';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSection, setCurrentSection] = useState<Section>(initialSections[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  
  const sectionDrawerAnim = useRef(new Animated.Value(-280)).current;
  
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
  
  // Handle page changes with improved section detection
  const handlePageChange = (page: number) => {
    console.log(`handlePageChange called with page: ${page}`);
    
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
      
      // Check if we've completed a section
      if (page === section.endPage && !section.isCompleted) {
        handleSectionCompletion(section);
      }
    }
  };
  
  // Handle section selection
  const handleSectionPress = (section: Section) => {
    setCurrentSection(section);
    setCurrentPage(section.startPage);
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
    
    // Call the onSectionComplete callback
    await onSectionComplete(section);
  };
  
  // Toggle section completion status
  const handleToggleComplete = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    const wasCompleted = section?.isCompleted || false;
    
    const updatedSections = sections.map(section => 
      section.id === sectionId 
        ? { 
            ...section, 
            isCompleted: !section.isCompleted,
            // Clear completionDate if toggling from completed to incomplete
            completionDate: !section.isCompleted ? new Date() : undefined
          } 
        : section
    );
    
    setSections(updatedSections);
    saveSections(updatedSections);
    
    // If section was just completed (not uncompleted)
    if (!wasCompleted && section) {
      // Celebrate manzil completion
      handleSectionCompletion(section);
    }
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