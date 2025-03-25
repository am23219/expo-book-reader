import { useState, useEffect } from 'react';
import { differenceInDays, startOfDay, isSameDay } from 'date-fns';
import { updateNextUpWidget, updateWidgetData } from '../utils/widgetSharing';
import { storage, ReadingStreak } from '../utils/storage';
import { Section } from '../models/Section';

/**
 * Custom hook for managing reading streaks and history
 */
export const useReadingStreak = (): [
  {
    currentStreak: number;
    longestStreak: number;
    readingHistory: Date[];
  },
  () => Promise<ReadingStreak>,
  (sectionId: number, currentPage: number, totalPages: number, completed: boolean, bookTitle?: string) => Promise<boolean>
] => {
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [readingHistory, setReadingHistory] = useState<Date[]>([]);
  const [completedSections, setCompletedSections] = useState<Section[]>([]);
  
  // Load streak data on mount
  useEffect(() => {
    const loadStreakData = async () => {
      try {
        // Load reading streak data
        const streakData = await storage.loadReadingStreak();
        
        setCurrentStreak(streakData.currentStreak);
        setLongestStreak(streakData.longestStreak);
        
        // Load reading history
        const history = await storage.loadReadingHistory();
        setReadingHistory(history);
        
        // Load completed sections
        const completed = await storage.loadCompletedSections();
        setCompletedSections(completed);
      } catch (error) {
        console.error('Error loading streak data:', error);
      }
    };
    
    loadStreakData();
  }, []);
  
  // Update widgets with streak data
  useEffect(() => {
    const updateWidgets = async () => {
      try {
        // Try to get the current book title or use default
        const bookTitle = "Barakaat Makkiyyah";
        
        // Update widgets with current reading streak
        await updateWidgetData({
          bookTitle,
          currentStreak,
          longestStreak,
          readingDays: readingHistory
        });
      } catch (error) {
        console.error('Error updating widgets with streak data:', error);
      }
    };
    
    if (currentStreak > 0) {
      updateWidgets();
    }
  }, [currentStreak, longestStreak, readingHistory]);
  
  // Update reading streak when a new day is recorded
  const updateReadingStreak = async (): Promise<ReadingStreak> => {
    try {
      // Record today as a reading day
      await storage.recordReadingDay();
      
      // Get today's date (start of day for consistent comparison)
      const today = startOfDay(new Date());
      
      // Get current streak data
      const currentStreakData = await storage.loadReadingStreak();
      
      let streak = currentStreakData.currentStreak;
      let maxStreak = currentStreakData.longestStreak;
      
      // Get the last read date
      const lastReadDate = currentStreakData.lastReadDate ? 
        startOfDay(new Date(currentStreakData.lastReadDate)) : null;
      
      // If we haven't read today yet, update the streak
      if (!lastReadDate || !isSameDay(lastReadDate, today)) {
        // Calculate if this is consecutive with the last read day
        if (lastReadDate && differenceInDays(today, lastReadDate) === 1) {
          // Consecutive day, increment streak
          streak += 1;
        } else if (!lastReadDate || differenceInDays(today, lastReadDate) > 1) {
          // Not consecutive or first time reading, reset streak to 1
          streak = 1;
        }
        
        // Update max streak if needed
        maxStreak = Math.max(streak, maxStreak);
        
        // Save the updated streak data
        const updatedStreakData: ReadingStreak = {
          currentStreak: streak,
          lastReadDate: today,
          longestStreak: maxStreak
        };
        
        // Update state
        setCurrentStreak(streak);
        setLongestStreak(maxStreak);
        
        // Persist to storage
        await storage.saveReadingStreak(updatedStreakData);
        
        return updatedStreakData;
      }
      
      return currentStreakData;
    } catch (error) {
      console.error('Error updating reading streak:', error);
      return {
        currentStreak: 0,
        lastReadDate: null,
        longestStreak: 0
      };
    }
  };
  
  // Update the NextUp widget with section progress
  const updateNextUpProgress = async (
    sectionId: number,
    currentPage: number,
    totalPages: number,
    completed: boolean,
    bookTitle: string = "Barakaat Makkiyyah"
  ): Promise<boolean> => {
    try {
      return await updateNextUpWidget(
        sectionId,
        currentPage,
        totalPages,
        completed,
        bookTitle
      );
    } catch (error) {
      console.error('Error updating NextUp widget from hook:', error);
      return false;
    }
  };
  
  return [
    { 
      currentStreak, 
      longestStreak,
      readingHistory
    },
    updateReadingStreak,
    updateNextUpProgress
  ];
}; 