import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, addDays, differenceInDays, isSameDay } from '../utils/dateUtils';
import { updateWidgetWithReadingProgress } from '../utils/widgetSharing';

export interface ReadingDay {
  date: Date;
  didRead: boolean;
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
  () => Promise<ReadingStreakData>
] => {
  const [readingHistory, setReadingHistory] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Load reading history on component mount
  useEffect(() => {
    loadReadingData();
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
        past7Days: getPast7Days(readingHistory)
      };
    } catch (error) {
      console.error('Error loading reading data:', error);
      return {
        history: [],
        currentStreak: 0,
        longestStreak: 0,
        past7Days: getPast7Days([])
      };
    }
  };

  // Update reading streak when a new day is recorded
  const updateReadingStreak = async (): Promise<ReadingStreakData> => {
    try {
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
      const past7Days = getPast7Days(history);
      
      // Update widget data
      try {
        // Get the current book title from storage or use default
        const bookTitle = await AsyncStorage.getItem('current_book_title') || 'Barakat Makkiyyah';
        
        // Update widget data
        await updateWidgetWithReadingProgress(
          bookTitle,
          past7Days,
          streak,
          newLongestStreak
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
        past7Days: getPast7Days([])
      };
    }
  };

  // Helper function to generate the past 7 days data for the streak component
  const getPast7Days = (history: Date[]): ReadingDay[] => {
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
        
        result.push({ 
          date, // Ensure this is a proper Date object
          didRead 
        });
      }
      
      console.log('getPast7Days result:', result.map(d => ({
        date: d.date.toString(),
        isDate: d.date instanceof Date,
        didRead: d.didRead
      })));
      
      return result;
    } catch (error) {
      console.error('Error in getPast7Days:', error);
      // Return safe fallback with current date
      const today = new Date();
      return Array.from({ length: 7 }, (_, i) => ({
        date: addDays(today, -i),
        didRead: false
      }));
    }
  };

  return [
    {
      history: readingHistory,
      currentStreak,
      longestStreak,
      past7Days: getPast7Days(readingHistory)
    },
    updateReadingStreak
  ];
}; 