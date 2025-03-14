import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Animated, Dimensions, Text, Platform, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PageViewer from '../components/PageViewer';
import SectionNavigation from '../components/SectionNavigation';
import { Section, SECTIONS } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage } from '../utils/storage';
import EnhancedPdfViewer from '../components/EnhancedPdfViewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import SimpleAudioPlayer from '../components/SimpleAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShakeView from '../components/ShakeView';
import { LinearGradient } from 'expo-linear-gradient';
import ReadingStreakNotification from '../components/ReadingStreakNotification';
import Confetti from '../components/Confetti';

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

export default function BookPage() {
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSection, setCurrentSection] = useState<Section>(SECTIONS[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [khatmCount, setKhatmCount] = useState(0);
  const [showKhatmModal, setShowKhatmModal] = useState(false);
  const [showManzilConfetti, setShowManzilConfetti] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
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
  const [loadingAttempts, setLoadingAttempts] = useState(0);
  const [appLoading, setAppLoading] = useState(true);
  
  const sectionDrawerAnim = useRef(new Animated.Value(-280)).current;
  const { height, width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  // Estimate bottom insets based on device dimensions and platform
  const estimatedBottomInset = Platform.OS === 'ios' && height > 800 ? 34 : 0;
  
  // Responsive sizing calculations
  const isLargeScreen = useMemo(() => width > 380, [width]);
  const isExtraLargeScreen = useMemo(() => width > 428, [width]);
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
        setAppLoading(true);
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
        setAppLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to defaults if there's an error
        setCurrentPage(1);
        setCurrentSection(SECTIONS[0]);
        setAppLoading(false);
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
  
  // Clean up sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);
  
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
    
    // Update sections
    const updatedSections = sections.map(s => 
      s.id === section.id ? { ...s, isCompleted: true } : s
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
      
      // Reset all sections for next khatm
      const resetSections = updatedSections.map(section => ({
        ...section,
        isCompleted: false,
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
        ? { ...section, isCompleted: !section.isCompleted } 
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
  
  const handlePdfError = () => {
    console.log(`PDF loading error occurred - attempts: ${loadingAttempts + 1}`);
    
    // If we've tried multiple times with the enhanced viewer, switch to fallback
    if (loadingAttempts >= 2) {
      console.log('Multiple PDF loading attempts failed, switching to fallback viewer');
      setUseFallbackViewer(true);
    } else {
      setLoadingAttempts(prev => prev + 1);
    }
  };
  
  const resetPdfViewer = () => {
    setLoadingAttempts(0);
    setUseFallbackViewer(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* Decorative Background for larger screens */}
      {isLargeScreen && (
        <View style={styles.decorativeBackground}>
          <View style={styles.patternContainer}>
            {/* Top pattern */}
            <View style={[styles.geometricPattern, styles.topPattern]} />
            {/* Bottom pattern */}
            <View style={[styles.geometricPattern, styles.bottomPattern]} />
          </View>
          
          {/* Side gradients to soften the edges */}
          <LinearGradient
            colors={['rgba(249, 245, 235, 0.98)', 'rgba(249, 245, 235, 0.75)', 'rgba(249, 245, 235, 0.75)', 'rgba(249, 245, 235, 0.98)']}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={styles.sideGradient}
          />
        </View>
      )}
      
      {/* Enhanced Header with improved design for larger screens */}
      <View style={[
        styles.header, 
        { 
          paddingTop: headerTopPadding,
          paddingBottom: headerPadding,
          height: 'auto', // Allow height to adjust based on content
          minHeight: headerHeight,
        }
      ]}>
        <TouchableOpacity 
          style={[styles.menuButton, { transform: [{ scale: menuScale }] }]} 
          onPress={toggleSectionDrawer}
        >
          <Ionicons name="menu" size={iconSize} color="#5A9EBF" />
        </TouchableOpacity>
        
        <View style={[
          styles.pageIndicator, 
          { 
            marginHorizontal: 10 * menuScale,
            paddingVertical: isLargeScreen ? 12 : 6,
          }
        ]}>
          <View style={styles.titleProgressContainer}>
            <Text style={[
              styles.pageIndicatorText, 
              { fontSize: titleFontSize }
            ]}>
              {currentSection.title}
            </Text>
            <Text style={[
              styles.progressText, 
              { fontSize: progressTextSize }
            ]}>
              {currentPage - currentSection.startPage + 1}/{currentSection.endPage - currentSection.startPage + 1}
            </Text>
          </View>
          <View style={[
            styles.progressContainer,
            isLargeScreen && { marginTop: 10 }
          ]}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${Math.max(0, Math.min(100, ((currentPage - currentSection.startPage + 1) / 
                    (currentSection.endPage - currentSection.startPage + 1)) * 100))}%`,
                  height: progressBarHeight
                }
              ]} 
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.audioButton, { transform: [{ scale: menuScale }] }]} 
          onPress={toggleAudioModal}
        >
          <Ionicons name="musical-notes" size={iconSize - 2} color="#5A9EBF" />
        </TouchableOpacity>
      </View>
      
      {/* PDF Viewer with improved container for larger screens */}
      <View style={[
        styles.content, 
        isLargeScreen && { 
          flex: 1, // Ensure it takes remaining space
        }
      ]}>
        {appLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5A9EBF" />
            <Text style={styles.loadingText}>تحميل الكتاب...</Text>
          </View>
        ) : (
          <>
            <View style={[
              styles.pdfContainer, 
              isLargeScreen && styles.pdfContainerLarge
            ]}>
              {!useFallbackViewer ? (
                <EnhancedPdfViewer 
                  currentPage={currentPage} 
                  onPageChange={handlePageChange}
                  onError={handlePdfError}
                  currentSection={currentSection}
                />
              ) : (
                <View style={styles.fallbackContainer}>
                  <PageViewer 
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    currentSection={currentSection}
                  />
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={resetPdfViewer}
                  >
                    <Text style={styles.resetButtonText}>Try Enhanced Viewer Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </View>
      
      {/* Section Navigation Drawer */}
      <Animated.View 
        style={[
          styles.sectionDrawer, 
          { 
            transform: [{ translateX: sectionDrawerAnim }],
            paddingTop: insets.top
          }
        ]}
      >
        <SectionNavigation 
          sections={sections}
          currentSectionId={currentSection.id}
          onSectionPress={handleSectionPress}
          onToggleComplete={handleToggleComplete}
          onClose={toggleSectionDrawer}
          khatmCount={khatmCount}
        />
      </Animated.View>
      
      {/* Standalone Audio Player Modal */}
      <SimpleAudioPlayer 
        currentSection={currentSection}
        sections={sections}
        onClose={toggleAudioModal}
        visible={isAudioModalVisible}
      />
      
      {/* Khatm Completion Modal with Shake Animation */}
      {showKhatmModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1} 
            onPress={() => {
              setShowKhatmModal(false);
            }}
          />
          <ShakeView shake={shakeKhatmModal} intensity={10} count={5} style={styles.modal}>
            <Text style={styles.modalTitle}>Khatm Completed!</Text>
            <Text style={styles.modalText}>
              Congratulations! You have completed a full reading of Barakaat Makiyyah.
            </Text>
            <Text style={styles.modalSubText}>
              May Allah accept your efforts and bless you.
            </Text>
            
            <View style={styles.khatmBadge}>
              <Text style={styles.khatmBadgeText}>{khatmCount}</Text>
              <Text style={styles.khatmBadgeLabel}>Completions</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowKhatmModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>Continue Reading</Text>
            </TouchableOpacity>
          </ShakeView>
        </View>
      )}
      
      {/* Enhanced Confetti Effects */}
      {showManzilConfetti && 
        <Confetti 
          count={50} 
          duration={3000} 
          colors={manzilCompletionColors}
          size={{ min: 5, max: 12 }}
        />
      }
      
      {showStreakNotification && (
        <ReadingStreakNotification
          visible={showStreakNotification}
          title={notificationData.title}
          message={notificationData.message}
          readingDays={getPast7Days()}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          onClose={() => setShowStreakNotification(false)}
          isKhatm={notificationData.isKhatm}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EB',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9F5EB',
    justifyContent: 'center',
    zIndex: 1,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(249, 245, 235, 0.92)',
    borderBottomWidth: 0,
    justifyContent: 'space-between',
    zIndex: 5, // Ensure header is above content
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  pageIndicator: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: 'rgba(245, 241, 230, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageIndicatorText: {
    color: '#4A6E8A',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: 'rgba(200, 225, 235, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#5A9EBF',
    borderRadius: 3,
  },
  progressText: {
    color: '#607D8B',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  audioButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  sectionDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#F9F5EB',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 50,
  },
  audioModal: {
    position: 'absolute',
    top: '50%',
    left: '5%',
    right: '5%',
    transform: [{ translateY: -150 }],
    backgroundColor: '#F9F5EB',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  audioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  audioModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  audioPlayerContent: {
    flex: 1,
    padding: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#F9F5EB',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D8A4E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: '#343a40',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalSubText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  khatmBadge: {
    backgroundColor: '#F5F1E0',
    borderRadius: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#0D8A4E',
  },
  khatmBadgeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0D8A4E',
  },
  khatmBadgeLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  modalButton: {
    backgroundColor: '#0D8A4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  decorativeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  geometricPattern: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    opacity: 0.05,
  },
  topPattern: {
    top: 0,
    backgroundColor: '#5A9EBF',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  bottomPattern: {
    bottom: 0,
    backgroundColor: '#5A9EBF',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  sideGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  pdfContainerLarge: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f5eb', 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#5A9EBF',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'Roboto',
  },
  fallbackContainer: {
    flex: 1,
    position: 'relative',
  },
  resetButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#5A9EBF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
