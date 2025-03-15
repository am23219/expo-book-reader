import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Animated, Dimensions, Text, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PageViewer from '../components/PageViewer';
import SectionNavigation from '../components/SectionNavigation';
import { Section, SECTIONS } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage, clearAllData } from '../utils/storage';
import EnhancedPdfViewer from '../components/EnhancedPdfViewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import SimpleAudioPlayer from '../components/SimpleAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShakeView from '../components/ShakeView';
import { LinearGradient } from 'expo-linear-gradient';
import ReadingStreakNotification from '../components/ReadingStreakNotification';
import Header from '../components/Header';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const differenceInDays = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const formatDate = (date: Date, format: string): string => {
  if (format === 'EEE') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  if (format === 'd') {
    return date.getDate().toString();
  }
  return date.toLocaleDateString();
};

// Format completion date in a nice, aesthetic way
const formatCompletionDate = (date: Date | undefined): string => {
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

export default function BookPage() {
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSection, setCurrentSection] = useState<Section>(SECTIONS[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [khatmCount, setKhatmCount] = useState(0);
  const [showKhatmModal, setShowKhatmModal] = useState(false);
  const [shakeKhatmModal, setShakeKhatmModal] = useState(false);
  const [manzilCompletionColors, setManzilCompletionColors] = useState<string[]>([
    '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'
  ]);
  const [khatmCompletionColors, setKhatmCompletionColors] = useState<string[]>([
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', 
    '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
  ]);
  const [readingHistory, setReadingHistory] = useState<Date[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [showStreakNotification, setShowStreakNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    isKhatm: false
  });
  
  const sectionDrawerAnim = useRef(new Animated.Value(-280)).current;
  const { height, width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  // Estimate bottom insets based on device dimensions and platform
  const estimatedBottomInset = Platform.OS === 'ios' && height > 800 ? 34 : 0;
  
  // Responsive sizing calculations
  const isLargeScreen = useMemo(() => width > 380, [width]);
  const isExtraLargeScreen = useMemo(() => width > 428, [width]);
  const patternOpacity = useMemo(() => isLargeScreen ? 0.035 : 0, [isLargeScreen]);
  const menuScale = useMemo(() => isLargeScreen ? (isExtraLargeScreen ? 1.15 : 1.1) : 1, [isLargeScreen, isExtraLargeScreen]);
  const headerPadding = useMemo(() => isLargeScreen ? (isExtraLargeScreen ? 14 : 12) : 8, [isLargeScreen, isExtraLargeScreen]);
  
  // Enhanced responsive sizing for larger screens
  const headerHeight = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 90 : 80) : 60, 
    [isLargeScreen, isExtraLargeScreen]
  );
  const headerTopPadding = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 16 : 12) : 8, 
    [isLargeScreen, isExtraLargeScreen]
  );
  const progressBarHeight = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 6 : 5) : 3, 
    [isLargeScreen, isExtraLargeScreen]
  );
  const titleFontSize = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 24 : 20) : 14, 
    [isLargeScreen, isExtraLargeScreen]
  );
  const progressTextSize = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 18 : 16) : 12, 
    [isLargeScreen, isExtraLargeScreen]
  );
  const iconSize = useMemo(() => 
    isLargeScreen ? (isExtraLargeScreen ? 30 : 26) : 22, 
    [isLargeScreen, isExtraLargeScreen]
  );
  
  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSections = await loadSections();
        const savedPage = await loadCurrentPage();
        const savedKhatmCount = await AsyncStorage.getItem('khatm_count');
        
        // Find the section that contains the current page BEFORE setting state
        const section = findSectionByPage(savedSections, savedPage);
        
        // Set all states at once to avoid UI inconsistency
        setSections(savedSections);
        setCurrentPage(savedPage);
        setCurrentSection(section); // Set the correct section
        setKhatmCount(savedKhatmCount ? parseInt(savedKhatmCount) : 0);
        
        console.log(`Initial load - Page: ${savedPage}, Section: ${section.title} (${section.startPage}-${section.endPage})`);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to defaults if there's an error
        setCurrentPage(1);
        setCurrentSection(SECTIONS[0]);
      }
    };
    
    loadData();
  }, []);
  
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
  
  // Add debug logging to help track issues
  useEffect(() => {
    console.log(`Current page: ${currentPage}`);
    console.log(`Current section: ${currentSection.title} (${currentSection.startPage}-${currentSection.endPage})`);
  }, [currentPage, currentSection]);
  
  // Handle section selection
  const handleSectionPress = (section: Section) => {
    setCurrentSection(section);
    setCurrentPage(section.startPage);
    toggleSectionDrawer(); // Close drawer after selection
  };
  
  // Add this function to manage the reading history and streaks
  const updateReadingStreak = async () => {
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
      
      return {
        history,
        currentStreak: streak,
        longestStreak: newLongestStreak
      };
    } catch (error) {
      console.error('Error updating reading streak:', error);
      return {
        history: [],
        currentStreak: 1,
        longestStreak: 1
      };
    }
  };
  
  // Load reading history on component mount
  useEffect(() => {
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
      } catch (error) {
        console.error('Error loading reading data:', error);
      }
    };
    
    loadReadingData();
  }, []);
  
  // Modify handleSectionCompletion to update the streak and show the notification
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
    
    // Update reading streak
    const { history, currentStreak, longestStreak } = await updateReadingStreak();
    
    // Check if this completes a manzil
    if (section.title.includes('Manzil')) {
      console.log(`Manzil ${section.title} completed!`);
      
      // Vibrate to give feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Calculate reading streak message
      let streakMessage = '';
      if (currentStreak > 1) {
        streakMessage = `You're on a ${currentStreak}-day reading streak! Keep it up!`;
      } else {
        streakMessage = `Great job completing this manzil! Read tomorrow to start a streak.`;
      }
      
      // Set notification data
      setNotificationData({
        title: `${section.title} Completed!`,
        message: streakMessage,
        isKhatm: false
      });
      
      // Show notification
      setShowStreakNotification(true);
    }
    
    // Check for Khatm completion
    checkKhatmCompletion(updatedSections);
  };
  
  // Modify the checkKhatmCompletion function
  const checkKhatmCompletion = async (updatedSections: Section[]) => {
    // Check if all sections are completed
    const allCompleted = updatedSections.every(section => section.isCompleted);
    
    if (allCompleted) {
      console.log('Khatm completed!');
      
      // Update reading streak
      const { currentStreak, longestStreak } = await updateReadingStreak();
      
      // Increment khatm count
      const newKhatmCount = khatmCount + 1;
      setKhatmCount(newKhatmCount);
      
      // Save to storage
      AsyncStorage.setItem('khatm_count', newKhatmCount.toString());
      
      // Reset all sections for next khatm - explicitly clear completionDate
      const resetSections = updatedSections.map(section => ({
        ...section,
        isCompleted: false,
        completionDate: undefined
      }));
      
      // Stronger vibration pattern for khatm
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
      
      // Set notification data for khatm completion
      let message = '';
      if (currentStreak > 1) {
        message = `Congratulations on your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} completion! You're on a ${currentStreak}-day streak. May Allah bless your dedication.`;
      } else {
        message = `Congratulations on completing your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} read-through! May Allah accept your efforts.`;
      }
      
      setNotificationData({
        title: `Khatm #${newKhatmCount} Completed!`,
        message,
        isKhatm: true
      });
      
      // Show notification
      setShowStreakNotification(true);
      
      // Reset sections after notification is shown
      setSections(resetSections);
      saveSections(resetSections);
    }
  };
  
  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (n: number): string => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // Helper function to generate the past 7 days data for the streak component
  const getPast7Days = (): { date: Date; didRead: boolean }[] => {
    const today = startOfDay(new Date());
    const result = [];
    
    // Generate an array of the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(addDays(today, -i));
      const didRead = readingHistory.some(readDate => 
        isSameDay(new Date(readDate), date)
      );
      
      result.push({ date, didRead });
    }
    
    return result;
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
    
    // Check if all sections are completed
    checkKhatmCompletion(updatedSections);
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
  
  // Toggle audio modal
  const toggleAudioModal = () => {
    setIsAudioModalVisible(!isAudioModalVisible);
  };
  
  // Handle complete khatm button press
  const handleCompleteKhatm = () => {
    // Show confirmation dialog
    Alert.alert(
      "Complete Khatm",
      "This will mark all manzils as complete and count as a full khatm completion. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Complete",
          onPress: async () => {
            try {
              // Mark all sections as complete with the current date
              const now = new Date();
              const completedSections = sections.map(section => ({
                ...section,
                isCompleted: true,
                completionDate: now
              }));
              
              // Update state
              setSections(completedSections);
              saveSections(completedSections);
              
              // Update reading streak
              const { currentStreak, longestStreak } = await updateReadingStreak();
              
              // Increment khatm count
              const newKhatmCount = khatmCount + 1;
              setKhatmCount(newKhatmCount);
              
              // Save to storage
              AsyncStorage.setItem('khatm_count', newKhatmCount.toString());
              
              // Calculate reward points - more points for consistent users
              const rewardPoints = 500 + (currentStreak * 20);
              
              // Trigger stronger haptic feedback for completion
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }, 300);
              
              // Close the section drawer
              toggleSectionDrawer();
              
              // Set notification data for khatm completion
              let message = '';
              if (currentStreak > 1) {
                message = `Congratulations on your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} completion! You're on a ${currentStreak}-day streak. May Allah bless your dedication.`;
              } else {
                message = `Congratulations on completing your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} read-through! May Allah accept your efforts.`;
              }
              
              setNotificationData({
                title: `Khatm #${newKhatmCount} Completed!`,
                message,
                isKhatm: true
              });
              
              // Show notification after a short delay to ensure state is updated
              setTimeout(() => {
                setShowStreakNotification(true);
              }, 300);
              
              // Reset sections after a delay
              setTimeout(() => {
                const resetSections = completedSections.map(section => ({
                  ...section,
                  isCompleted: false,
                  completionDate: undefined
                }));
                
                setSections(resetSections);
                saveSections(resetSections);
              }, 2000);
            } catch (error) {
              console.error('Error completing khatm:', error);
              alert('An error occurred while completing khatm. Please try again.');
            }
          }
        }
      ]
    );
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
  
  // Handle data reset and app refresh
  const handleReset = async () => {
    try {
      // Clear all stored data
      await clearAllData();
      
      // Reset state to defaults - ensure completionDate is cleared too
      const resetSections = SECTIONS.map(section => ({
        ...section,
        isCompleted: false,
        completionDate: undefined
      }));
      
      setSections(resetSections);
      setCurrentPage(1);
      setCurrentSection(resetSections[0]);
      setKhatmCount(0);
      
      // Close the section drawer
      toggleSectionDrawer();
      
      console.log('All data has been reset to defaults');
      
      // Show confirmation
      alert('Data has been reset to defaults');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('An error occurred while resetting data');
    }
  };
  
  // Calculated progress value
  const progress = useMemo(() => {
    if (!sections || sections.length === 0) return 0;
    const completedCount = sections.filter(s => s.isCompleted).length;
    return completedCount / sections.length;
  }, [sections]);
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Updated Header Component with manzil-specific progress */}
      <Header 
        title="Barakaat Makkiyyah"
        subtitle={currentSection.title}
        onMenuPress={toggleSectionDrawer}
        currentPage={currentPage}
        startPage={currentSection.startPage}
        endPage={currentSection.endPage}
        totalSections={sections.length}
        completedSections={sections.filter(s => s.isCompleted).length}
      />
      
      {/* Main Content */}
      <View style={styles.content}>
        {useFallbackViewer ? (
          <PageViewer 
            currentPage={currentPage}
            onPageChange={handlePageChange}
            currentSection={currentSection}
          />
        ) : (
          <EnhancedPdfViewer
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onError={() => setUseFallbackViewer(true)}
            currentSection={currentSection}
          />
        )}
      </View>
      
      {/* Drawer Navigation with improved styling */}
      <Animated.View 
        style={[
          styles.sectionDrawer,
          { transform: [{ translateX: sectionDrawerAnim }] }
        ]}
      >
        <SectionNavigation
          sections={sections}
          currentSectionId={currentSection.id}
          onSectionPress={handleSectionPress}
          onToggleComplete={handleToggleComplete}
          onClose={toggleSectionDrawer}
          khatmCount={khatmCount}
          onCompleteKhatm={handleCompleteKhatm}
        />
      </Animated.View>
      
      {/* Audio Modal */}
      {isAudioModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.audioModalContainer}>
            <SimpleAudioPlayer 
              onClose={toggleAudioModal}
              currentSection={currentSection}
              sections={sections}
              visible={isAudioModalVisible}
            />
          </View>
        </View>
      )}
      
      {/* Reading Streak Notification */}
      <ReadingStreakNotification 
        visible={showStreakNotification}
        title={notificationData.title}
        message={notificationData.message}
        readingDays={getPast7Days()}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        onClose={() => setShowStreakNotification(false)}
        isKhatm={notificationData.isKhatm}
        completionNumber={notificationData.isKhatm ? khatmCount : undefined}
        rewardPoints={notificationData.isKhatm ? 500 + (currentStreak * 20) : 50}
        totalPoints={5000} // This should be replaced with actual total points from state
        level={Math.min(Math.floor(khatmCount / 3) + 1, 5)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sectionDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.primary.deep,
    zIndex: 100,
    ...shadows.large,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  audioModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.primary.white,
    borderRadius: radius.lg,
    ...shadows.large,
    overflow: 'hidden',
  },
});