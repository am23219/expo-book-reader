import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, addDays, differenceInDays, isSameDay } from '../utils/dateUtils';
import { updateWidgetWithReadingProgress, updateNextUpWidget } from '../utils/widgetSharing';
import { Section } from '../models/Section';

export interface ReadingDay {
  date: Date;
  didRead: boolean;
  completedSections: number;
}

export interface ReadingStreakData {
  history: Date[];
  currentStreak: number;
  longestStreak: number;
  past7Days: ReadingDay[];
}

/**
 * Custom hook for managing reading streaks
 */
export const useReadingStreak = (): [
  ReadingStreakData,
  () => Promise<ReadingStreakData>,
  (sectionId: number, currentPage: number, totalPages: number, completed: boolean, bookTitle?: string) => Promise<void>
] => {
  const [readingHistory, setReadingHistory] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completedSections, setCompletedSections] = useState<Section[]>([]);

  // Load reading history on component mount
  useEffect(() => {
    loadReadingData();
    loadCompletedSections();
  }, []);

  // Load saved reading history
  const loadReadingData = async () => {
    try {
      // Load saved reading history
      const savedHistory = await AsyncStorage.getItem('reading_history');
      const savedLongestStreak = await AsyncStorage.getItem('longest_streak');
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory).map((dateStr: string) => new Date(dateStr));
        setReadingHistory(history);
        
        // Calculate current streak
        const today = startOfDay(new Date());
        let streak = 0;
        let previousDate = today;
        let foundToday = false;
        
        // Check if today is already in the history
        const sortedDates = [...history].sort((a, b) => b.getTime() - a.getTime());
        
        if (sortedDates.length > 0 && isSameDay(sortedDates[0], today)) {
          foundToday = true;
          streak = 1;
          previousDate = today;
          
          // Calculate consecutive days
          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const dayDifference = differenceInDays(previousDate, currentDate);
            
            if (dayDifference === 1) {
              streak++;
            } else {
              break;
            }
            
            previousDate = currentDate;
          }
        } else if (sortedDates.length > 0) {
          // User hasn't read today yet, check if yesterday was recorded
          const yesterday = startOfDay(addDays(today, -1));
          
          if (isSameDay(sortedDates[0], yesterday)) {
            // Streak continues from yesterday
            previousDate = yesterday;
            streak = 1;
            
            // Calculate consecutive days
            for (let i = 1; i < sortedDates.length; i++) {
              const currentDate = new Date(sortedDates[i]);
              const dayDifference = differenceInDays(previousDate, currentDate);
              
              if (dayDifference === 1) {
                streak++;
              } else {
                break;
              }
              
              previousDate = currentDate;
            }
          }
        }
        
        // Set longest streak from storage or current streak
        const storedLongestStreak = savedLongestStreak ? parseInt(savedLongestStreak) : 0;
        setCurrentStreak(streak);
        setLongestStreak(Math.max(storedLongestStreak, streak));
      }
      
      return {
        history: readingHistory,
        currentStreak,
        longestStreak,
        past7Days: getPast7Days(readingHistory, completedSections)
      };
    } catch (error) {
      console.error('Error loading reading data:', error);
      return {
        history: [],
        currentStreak: 0,
        longestStreak: 0,
        past7Days: getPast7Days([], completedSections)
      };
    }
  };

  // Load completed sections for tracking daily completion counts
  const loadCompletedSections = async () => {
    try {
      const savedSections = await AsyncStorage.getItem('completed_sections');
      if (savedSections) {
        const sections = JSON.parse(savedSections).map((section: Section) => ({
          ...section,
          completionDate: section.completionDate ? new Date(section.completionDate) : undefined
        }));
        setCompletedSections(sections);
      }
    } catch (error) {
      console.error('Error loading completed sections:', error);
    }
  };

  // Update reading streak when a new day is recorded
  const updateReadingStreak = async (): Promise<ReadingStreakData> => {
    try {
      // Load the latest completed sections data
      await loadCompletedSections();
      
      // Get today's date (start of day for consistent comparison)
      const today = startOfDay(new Date());
      
      // Get saved reading history
      const savedHistory = await AsyncStorage.getItem('reading_history');
      let history: Date[] = [];
      
      if (savedHistory) {
        // Parse saved dates from JSON
        history = JSON.parse(savedHistory).map((dateStr: string) => new Date(dateStr));
        
        // Check if we already recorded today
        const alreadyRecordedToday = history.some(date => isSameDay(date, today));
        
        if (!alreadyRecordedToday) {
          // Add today to reading history
          history.push(today);
        }
      } else {
        // First time reading, initialize with today
        history = [today];
      }
      
      // Calculate current streak
      let streak = 1; // Start with today
      let maxStreak = 1;
      let previousDate = today;
      
      // Sort dates in descending order (newest first)
      const sortedDates = [...history].sort((a, b) => b.getTime() - a.getTime());
      
      // Calculate streak (consecutive days)
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = sortedDates[i];
        const dayDifference = differenceInDays(previousDate, currentDate);
        
        if (dayDifference === 1) {
          // Consecutive day
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else if (dayDifference > 1) {
          // Streak broken
          break;
        }
        
        previousDate = currentDate;
      }
      
      // Get previous longest streak
      const savedLongestStreak = await AsyncStorage.getItem('longest_streak');
      const previousLongestStreak = savedLongestStreak ? parseInt(savedLongestStreak) : 0;
      
      // Update longest streak if current is higher
      const newLongestStreak = Math.max(streak, previousLongestStreak);
      
      // Save everything to state and storage
      setReadingHistory(history);
      setCurrentStreak(streak);
      setLongestStreak(newLongestStreak);
      
      await AsyncStorage.setItem('reading_history', JSON.stringify(history.map(date => date.toISOString())));
      await AsyncStorage.setItem('longest_streak', newLongestStreak.toString());
      
      // Get the past 7 days data
      const past7Days = getPast7Days(history, completedSections);
      
      // Update widget data
      try {
        // Get the current book title from storage or use default
        const bookTitle = await AsyncStorage.getItem('current_book_title') || 'Barakat Makkiyyah';
        
        // Get current section info if available
        const currentSectionId = await AsyncStorage.getItem('current_section_id');
        const currentPageValue = await AsyncStorage.getItem('current_page');
        const currentSectionInfo = currentSectionId ? completedSections.find(s => s.id === parseInt(currentSectionId)) : null;
        
        let currentPageInfo;
        if (currentSectionInfo && currentPageValue) {
          currentPageInfo = {
            sectionId: currentSectionInfo.id,
            currentPage: parseInt(currentPageValue),
            totalPages: currentSectionInfo.endPage - currentSectionInfo.startPage + 1,
            completed: currentSectionInfo.isCompleted
          };
        }
        
        // Update widget data
        await updateWidgetWithReadingProgress(
          bookTitle,
          past7Days,
          streak,
          newLongestStreak,
          currentPageInfo
        );
      } catch (widgetError) {
        console.error('Error updating widget data:', widgetError);
      }
      
      return {
        history,
        currentStreak: streak,
        longestStreak: newLongestStreak,
        past7Days
      };
    } catch (error) {
      console.error('Error updating reading streak:', error);
      return {
        history: [],
        currentStreak: 1,
        longestStreak: 1,
        past7Days: getPast7Days([], completedSections)
      };
    }
  };

  // Helper function to generate the past 7 days data for the streak component
  const getPast7Days = (history: Date[], sections: Section[]): ReadingDay[] => {
    try {
      const today = startOfDay(new Date());
      const result: ReadingDay[] = [];
      
      // Generate an array of the past 7 days
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(addDays(today, -i));
        
        // Ensure history items are valid dates
        const safeHistory = history.filter(item => item instanceof Date || (typeof item === 'string' && !isNaN(new Date(item).getTime())));
        
        // Convert history items to Date objects if they're strings
        const normalizedHistory = safeHistory.map(item => 
          item instanceof Date ? item : new Date(item)
        );
        
        const didRead = normalizedHistory.some(readDate => 
          isSameDay(readDate, date)
        );
        
        // Count sections completed on this day
        const sectionsCompletedToday = sections.filter(section => 
          section.completionDate && isSameDay(new Date(section.completionDate), date)
        ).length;
        
        result.push({ 
          date, // Ensure this is a proper Date object
          didRead,
          completedSections: sectionsCompletedToday
        });
      }
      
      console.log('getPast7Days result:', result.map(d => ({
        date: d.date.toISOString(),
        didRead: d.didRead,
        completedSections: d.completedSections
      })));
      
      return result;
    } catch (error) {
      console.error('Error generating past 7 days data:', error);
      const today = startOfDay(new Date());
      return Array(7).fill(0).map((_, i) => ({
        date: startOfDay(addDays(today, -i)),
        didRead: false,
        completedSections: 0
      }));
    }
  };

  /**
   * Update the NextUp widget with current section progress
   */
  const updateNextUpProgress = async (
    sectionId: number,
    currentPage: number,
    totalPages: number,
    completed: boolean,
    bookTitle?: string
  ): Promise<void> => {
    try {
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem('current_section_id', sectionId.toString());
      await AsyncStorage.setItem('current_page', currentPage.toString());
      await AsyncStorage.setItem('total_pages', totalPages.toString());
      
      // Get the book title from parameters or AsyncStorage
      const storedBookTitle = bookTitle || await AsyncStorage.getItem('current_book_title') || "Barakaat Makkiyyah";
      
      // Update the NextUp widget
      await updateNextUpWidget(sectionId, currentPage, totalPages, completed, storedBookTitle);
      
      console.log('NextUp widget updated with progress:', { sectionId, currentPage, totalPages, completed, bookTitle: storedBookTitle });
    } catch (error) {
      console.error('Error updating NextUp widget:', error);
    }
  };

  return [
    {
      history: readingHistory,
      currentStreak,
      longestStreak,
      past7Days: getPast7Days(readingHistory, completedSections)
    },
    updateReadingStreak,
    updateNextUpProgress
  ];
}; 