// Date utility functions for the app

/**
 * Returns a new Date object set to the start of the day (midnight)
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Adds the specified number of days to a date and returns a new Date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculates the difference in days between two dates
 */
export const differenceInDays = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Checks if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Formats a date according to the specified format
 */
export const formatDate = (date: Date, format: string): string => {
  if (format === 'EEE') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  if (format === 'd') {
    return date.getDate().toString();
  }
  return date.toLocaleDateString();
};

/**
 * Format completion date in a nice, aesthetic way
 */
export const formatCompletionDate = (date: Date | undefined): string => {
  if (!date) return '';
  
  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));
  const completionDate = new Date(date);
  
  // Handle special cases
  if (isSameDay(completionDate, today)) {
    return 'Today';
  }
  
  if (isSameDay(completionDate, yesterday)) {
    return 'Yesterday';
  }
  
  // For other dates, format as "Sat, Mar 15"
  const dayName = formatDate(completionDate, 'EEE');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[completionDate.getMonth()];
  const day = completionDate.getDate();
  
  return `${dayName}, ${month} ${day}`;
};

/**
 * Returns the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export const getOrdinalSuffix = (n: number): string => {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Calculates reading streak based on history
 * @param history Array of dates when reading occurred
 * @returns Object containing current streak and longest streak
 */
export const calculateStreak = (history: Date[]): { currentStreak: number, longestStreak: number } => {
  if (!history || history.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize all dates to start of day and sort
  const sortedDates = history
    .map(date => startOfDay(new Date(date)))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));

  // Initialize counters
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  // Check if most recent date is today or yesterday (streak is active)
  const mostRecentDate = sortedDates[0];
  const isActive = isSameDay(mostRecentDate, today) || isSameDay(mostRecentDate, yesterday);

  if (!isActive) {
    // No active streak
    return { currentStreak: 0, longestStreak: calculateLongestConsecutiveDays(sortedDates) };
  }

  // Calculate current streak
  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    
    // First iteration
    if (i === 0) {
      currentStreak = 1;
      lastDate = currentDate;
      continue;
    }

    // Check if dates are consecutive (diff should be 1 day)
    if (lastDate) {
      const diffDays = Math.round(Math.abs(lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break; // Streak broken
      }
    }
  }

  // Calculate longest streak
  longestStreak = Math.max(currentStreak, calculateLongestConsecutiveDays(sortedDates));

  return { currentStreak, longestStreak };
};

/**
 * Helper function to calculate longest streak of consecutive days
 */
const calculateLongestConsecutiveDays = (sortedDates: Date[]): number => {
  if (!sortedDates || sortedDates.length === 0) return 0;
  
  let maxStreak = 1;
  let currentStreak = 1;
  let prevDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    const diffDays = Math.round(Math.abs(prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    
    prevDate = currentDate;
  }

  return maxStreak;
};

/**
 * Gets data for the past 7 days of reading
 * @param history Array of reading history dates
 * @param completedSections Optional array of completed sections with dates
 * @returns Array of booleans representing reading status for past 7 days
 */
export const getPast7Days = (
  history: Date[], 
  completedSections: { completionDate?: Date }[] = []
): boolean[] => {
  const result: boolean[] = Array(7).fill(false);
  const today = startOfDay(new Date());
  
  // Check regular reading days from history
  for (let i = 0; i < 7; i++) {
    const dayToCheck = startOfDay(addDays(today, -i));
    
    // Check if the user read on this day
    const readOnThisDay = history.some(date => 
      isSameDay(startOfDay(new Date(date)), dayToCheck)
    );
    
    // Check if any section was completed on this day
    const completedOnThisDay = completedSections.some(section => 
      section.completionDate && isSameDay(startOfDay(new Date(section.completionDate)), dayToCheck)
    );
    
    result[i] = readOnThisDay || completedOnThisDay;
  }
  
  return result;
};

/**
 * Calculates reading level based on streak count
 * @param currentStreak Current reading streak
 * @returns Reading level (1-10)
 */
export const calculateReadingLevel = (currentStreak: number): number => {
  if (currentStreak <= 0) return 1;
  
  // Level calculation: each 7 days is a new level, max level 10
  const level = Math.floor(currentStreak / 7) + 1;
  return Math.min(level, 10);
}; 