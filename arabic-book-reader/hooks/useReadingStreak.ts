import { useState, useEffect } from 'react';
import { startOfDay, addDays, differenceInDays, isSameDay } from '../utils/dateUtils';
import { updateWidgetWithReadingProgress, updateNextUpWidget } from '../utils/widgetSharing';
import { Section } from '../models/Section';
import { storageService, ReadingStreak } from '../utils/storageService';

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
      // Load saved reading streak data from storageService
      const streakData = await storageService.getReadingStreak();
      
      // Get the history from AsyncStorage for backward compatibility
      const savedHistory = await storageService.loadLastViewedPages();
      const history: Date[] = [];
      
      // If we have history, convert it to an array of dates
      if (savedHistory && Object.keys(savedHistory).length > 0) {
        // This is a hack to extract dates from the last viewed pages object
        // We'll improve this in a future update
        Object.values(savedHistory).forEach(_ => {
          // Add a pseudo-date for each entry (this is not ideal but preserves backward compatibility)
          // In the future, we'll store proper reading history dates
          if (streakData.lastReadDate) {
            history.push(new Date(streakData.lastReadDate));
          }
        });
      }
      
      setReadingHistory(history);
      setCurrentStreak(streakData.currentStreak);
      setLongestStreak(streakData.longestStreak);
      
      return {
        history,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        past7Days: getPast7Days(history, completedSections)
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
      // Load sections to get all completed ones
      const allSections = await storageService.loadSections();
      const completed = allSections.filter(section => section.isCompleted);
      setCompletedSections(completed);
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
      
      // First get current streak data
      const currentStreakData = await storageService.getReadingStreak();
      
      let history: Date[] = readingHistory;
      let streak = currentStreakData.currentStreak;
      let maxStreak = currentStreakData.longestStreak;
      
      // If we haven't read today, increment the streak
      const lastReadDate = currentStreakData.lastReadDate ? 
        startOfDay(new Date(currentStreakData.lastReadDate)) : null;
      
      if (!lastReadDate || !isSameDay(lastReadDate, today)) {
        // We're reading on a new day
        
        // Check if this is consecutive with the last read day
        if (lastReadDate && differenceInDays(today, lastReadDate) === 1) {
          // Consecutive day, increment streak
          streak += 1;
        } else if (!lastReadDate || differenceInDays(today, lastReadDate) > 1) {
          // Not consecutive or first time reading, reset streak to 1
          streak = 1;
        }
        
        // Update history
        history = [...history, today];
        setReadingHistory(history);
        
        // Update max streak if needed
        maxStreak = Math.max(streak, maxStreak);
        
        // Save the updated streak data
        const updatedStreakData: ReadingStreak = {
          currentStreak: streak,
          lastReadDate: today,
          longestStreak: maxStreak
        };
        
        setCurrentStreak(streak);
        setLongestStreak(maxStreak);
        
        // Persist to storage
        await storageService.saveReadingStreak(updatedStreakData);
      }
      
      // Get the past 7 days data
      const past7Days = getPast7Days(history, completedSections);
      
      // Update widget data
      try {
        // Get the current book title
        const bookTitle = await storageService.getCurrentBookTitle();
        
        // Get current section info if available
        const currentSectionId = await storageService.getCurrentSectionId();
        const currentPage = await storageService.loadCurrentPage();
        
        // Find current section in the completed sections list
        const currentSectionInfo = currentSectionId !== null ? 
          completedSections.find(s => s.id === currentSectionId) : null;
        
        let currentPageInfo;
        if (currentSectionInfo) {
          currentPageInfo = {
            sectionId: currentSectionInfo.id,
            currentPage,
            totalPages: currentSectionInfo.endPage - currentSectionInfo.startPage + 1,
            completed: currentSectionInfo.isCompleted
          };
        }
        
        // Update widget data
        await updateWidgetWithReadingProgress(
          bookTitle,
          past7Days,
          streak,
          maxStreak,
          currentPageInfo
        );
      } catch (widgetError) {
        console.error('Error updating widget data:', widgetError);
      }
      
      return {
        history,
        currentStreak: streak,
        longestStreak: maxStreak,
        past7Days
      };
    } catch (error) {
      console.error('Error updating reading streak:', error);
      return {
        history: readingHistory,
        currentStreak,
        longestStreak,
        past7Days: getPast7Days(readingHistory, completedSections)
      };
    }
  };

  // Calculate reading statistics for the past 7 days
  const getPast7Days = (history: Date[], sections: Section[]): ReadingDay[] => {
    const past7Days: ReadingDay[] = [];
    const today = startOfDay(new Date());
    
    // Generate data for past 7 days
    for (let i = 0; i < 7; i++) {
      const date = startOfDay(addDays(today, -i));
      const didRead = history.some(readDate => isSameDay(readDate, date));
      
      // Count sections completed on this day
      const completedToday = sections.filter(section => 
        section.completionDate && isSameDay(section.completionDate, date)
      ).length;
      
      past7Days.push({
        date,
        didRead,
        completedSections: completedToday
      });
    }
    
    // Return in chronological order (oldest first)
    return past7Days.reverse();
  };

  // Update the NextUp widget with reading progress
  const updateNextUpProgress = async (
    sectionId: number,
    currentPage: number,
    totalPages: number,
    completed: boolean,
    bookTitle?: string
  ): Promise<void> => {
    try {
      // Get book title if not provided
      const title = bookTitle || await storageService.getCurrentBookTitle();
      
      // Update the widget - fix the call to match the expected parameters
      await updateNextUpWidget(
        sectionId,
        currentPage, 
        totalPages,
        completed,
        title
      );
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