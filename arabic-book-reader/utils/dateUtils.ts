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