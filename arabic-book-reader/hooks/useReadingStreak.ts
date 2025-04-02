import { useState, useEffect } from 'react';
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

export interface ReadingStreak {
  currentStreak: number;
  lastReadDate: Date | null;
  longestStreak: number;
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
  }, []);

  // Load saved reading history - now just returns defaults since storage is removed
  const loadReadingData = async () => {
    const history: Date[] = [];
    setReadingHistory(history);
    setCurrentStreak(0);
    setLongestStreak(0);
    
    return {
      history,
      currentStreak: 0,
      longestStreak: 0,
      past7Days: getPast7Days(history, completedSections)
    };
  };

  // Update reading streak when a new day is recorded
  const updateReadingStreak = async (): Promise<ReadingStreakData> => {
    try {
      // Get today's date (start of day for consistent comparison)
      const today = startOfDay(new Date());
      
      let history: Date[] = readingHistory;
      let streak = currentStreak;
      let maxStreak = longestStreak;
      
      // Check if this is a new day from the most recent history entry
      const lastReadDate = history.length > 0 ? 
        startOfDay(history[history.length - 1]) : null;
      
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
        
        setCurrentStreak(streak);
        setLongestStreak(maxStreak);
      }
      
      // Get the past 7 days data
      const past7Days = getPast7Days(history, completedSections);
      
      // Update widget data
      try {
        // Find current section in the completed sections list
        const currentSectionInfo = completedSections.length > 0 ? 
          completedSections[completedSections.length - 1] : null;
        
        let currentPageInfo;
        if (currentSectionInfo) {
          currentPageInfo = {
            sectionId: currentSectionInfo.id,
            currentPage: 1,
            totalPages: currentSectionInfo.endPage - currentSectionInfo.startPage + 1,
            completed: currentSectionInfo.isCompleted
          };
        }
        
        // Update widget data
        await updateWidgetWithReadingProgress(
          "Arabic Book Reader",
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
      // Update the widget
      await updateNextUpWidget(
        sectionId,
        currentPage, 
        totalPages,
        completed,
        bookTitle || "Arabic Book Reader"
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