// Format completion date in a nice, aesthetic way
export const formatCompletionDate = (date: Date | undefined): string => {
  if (!date) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const completionDate = new Date(date);
  
  // Handle special cases
  if (completionDate.getDate() === today.getDate() &&
      completionDate.getMonth() === today.getMonth() &&
      completionDate.getFullYear() === today.getFullYear()) {
    return 'Today';
  }
  
  if (completionDate.getDate() === yesterday.getDate() &&
      completionDate.getMonth() === yesterday.getMonth() &&
      completionDate.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }
  
  // For other dates, format as "Wed. 3/15"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[completionDate.getDay()];
  const month = completionDate.getMonth() + 1; // JavaScript months are 0-indexed
  const day = completionDate.getDate();
  
  return `${dayName}. ${month}/${day}`;
}; 