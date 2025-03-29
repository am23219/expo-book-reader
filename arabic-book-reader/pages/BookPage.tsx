/**
 * BookPage.tsx
 * 
 * Main reading screen of the Barakaat Makkiyyah app that displays Quran content and handles user interaction.
 * This component manages section navigation, reading progress, streak tracking, and khatm completion.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// -----------------------------
// Components
// -----------------------------
import PageViewer from '../components/PageViewer';
import SectionNavigation from '../components/SectionNavigation';
import EnhancedPdfViewer from '../components/EnhancedPdfViewer';
import ReadingStreakNotification from '../components/ReadingStreakNotification';
import ReadingManzilCompletionNotification from '../components/ReadingManzilCompletionNotification';
import Header from '../components/Header';
import AudioModal from '../components/AudioModal';

// -----------------------------
// Hooks
// -----------------------------
import { useReadingStreak } from '../hooks/useReadingStreak';
import { useKhatmCompletion } from '../hooks/useKhatmCompletion';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
// Commenting out notification hook for now
// import { useNotifications } from '../hooks/useNotifications';
import { usePdfViewer } from '../hooks/usePdfViewer';

// -----------------------------
// Models and Utils
// -----------------------------
import { SECTIONS, Section } from '../models/Section';
import { clearAllData } from '../utils/storage';
import { colors } from '../constants/theme';

// -----------------------------
// Screens
// -----------------------------
import ReminderSettingsScreen from './ReminderSettings';

export default function BookPage() {
  // -----------------------------
  // State & Hooks Initialization
  // -----------------------------
  // Reading streak and progress tracking
  const [streakData, updateReadingStreak, updateNextUpProgress] = useReadingStreak();
  const [khatmData, khatmActions] = useKhatmCompletion(streakData.currentStreak);
  // Commenting out notification functionality for now
  // const [notificationState, notificationActions] = useNotifications();
  const [pdfViewerState, pdfViewerActions] = usePdfViewer();
  
  // State for tracking which notification to show
  const [showReadingManzilCompletion, setShowReadingManzilCompletion] = useState(false);
  const [readingManzilCompletionData, setReadingManzilCompletionData] = useState({
    title: '',
    quote: ''
  });
  
  // Initialize section navigation with callback for section completion
  const [sectionData, sectionActions] = useSectionNavigation(
    SECTIONS, 
    async (section, completionMethod) => {
      // Update reading streak
      await updateReadingStreak();
      
      // Check if all sections are completed after this one
      const allSectionsCompleted = sectionData.sections.every(s => 
        (s.id === section.id || s.isCompleted)
      );
      
      console.log(`Section ${section.title} completed. All sections completed: ${allSectionsCompleted}`);
      
      // Use completionMethod or default to 'automatic'
      const method = completionMethod || 'automatic';
      
      if (allSectionsCompleted) {
        // All sections are completed - trigger khatm completion
        try {
          console.log('All sections completed! Triggering khatm completion notification');
          
          // Complete khatm and get reset sections
          const resetSections = await khatmActions.completeKhatm(sectionData.sections);
          
          // Update sections after a delay
          setTimeout(() => {
            sectionActions.setSections(resetSections);
          }, 2000);
        } catch (error) {
          console.error('Error completing khatm:', error);
          alert('An error occurred while completing khatm. Please try again.');
        }
      }
      else if (section.title.includes('Manzil')) {
        console.log(`Manzil ${section.title} completed via ${method}!`);
        
        // Extract manzil number from the title
        const manzilMatch = section.title.match(/Manzil (\d+)/);
        const manzilNumber = manzilMatch ? manzilMatch[1] : '';
        
        if (method === 'automatic') {
          // For automatic completion during reading, show the new notification
          const quote = "Whoever reads the Quran and acts on what is in it, his parents will be made to wear a crown on the Day of Resurrection, whose light is better than the light of the sun.";
          
          setReadingManzilCompletionData({
            title: `Manzil ${manzilNumber} Completed!`,
            quote
          });
          
          setShowReadingManzilCompletion(true);
        } else {
          // For manual completion in navigation, use the existing notification
          // Set notification data for manzil completion
          const message = streakData.currentStreak > 1 
            ? `Great job completing Manzil ${manzilNumber}! You're on a ${streakData.currentStreak}-day streak.` 
            : `Congratulations on completing Manzil ${manzilNumber}!`;
          
          // Update notification data
          khatmActions.setNotificationData({
            title: `Manzil ${manzilNumber} Completed!`,
            isKhatm: false,
            message
          });
          
          // Show notification
          khatmActions.setShowNotification(true);
        }
      }
    }
  );
  
  // -----------------------------
  // Effects
  // -----------------------------
  // Save the current book title for the widget and update NextUp widget
  useEffect(() => {
    const saveCurrentBookTitle = async () => {
      try {
        // Save the book title to AsyncStorage
        await AsyncStorage.setItem('current_book_title', 'Barakat Makkiyyah');
      } catch (error) {
        console.error('Error saving current book title:', error);
      }
    };
    
    saveCurrentBookTitle();
  }, []);
  
  // Update NextUp widget when current page or section changes
  useEffect(() => {
    const updateNextUpWidget = async () => {
      try {
        // Slight delay to ensure app is fully initialized
        setTimeout(async () => {
          try {
            const totalPages = sectionData.currentSection.endPage - sectionData.currentSection.startPage + 1;
            const currentPageInSection = sectionData.currentPage - sectionData.currentSection.startPage + 1;
            // Get the book title from AsyncStorage or use default
            const storedBookTitle = await AsyncStorage.getItem('current_book_title') || "Barakaat Makkiyyah";
            
            await updateNextUpProgress(
              sectionData.currentSection.id,
              currentPageInSection,
              totalPages,
              sectionData.currentSection.isCompleted,
              storedBookTitle
            );
          } catch (error) {
            // Silently handle widget errors - don't crash the app
            console.error('Error updating NextUp widget (delayed):', error);
          }
        }, 2000); // 2-second delay to avoid launch issues
      } catch (error) {
        // Silently handle any errors
        console.error('Error setting up widget update:', error);
      }
    };
    
    updateNextUpWidget();
  }, [sectionData.currentPage, sectionData.currentSection]);
  
  // Commenting out notification initialization for now
  // React.useEffect(() => {
  //   notificationActions.initializeNotifications();
  // }, []);
  
  // -----------------------------
  // Event Handlers
  // -----------------------------
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
      
      sectionActions.setSections(resetSections);
      
      // Close the section drawer
      sectionActions.toggleSectionDrawer();
      
      console.log('All data has been reset to defaults');
      
      // Show confirmation
      alert('Data has been reset to defaults');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('An error occurred while resetting data');
    }
  };
  
  // -----------------------------
  // Render UI
  // -----------------------------
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Component */}
      <Header 
        title="Barakaat Makkiyyah"
        subtitle={sectionData.currentSection.title}
        onMenuPress={sectionActions.toggleSectionDrawer}
        // Commenting out notification functionality for now
        // onReminderPress={notificationActions.toggleReminderSettings}
        currentPage={sectionData.currentPage}
        startPage={sectionData.currentSection.startPage}
        endPage={sectionData.currentSection.endPage}
        totalSections={sectionData.sections.length}
        completedSections={sectionData.sections.filter(s => s.isCompleted).length}
      />
      
      {/* Main Content */}
      <View style={styles.content}>
        {pdfViewerState.useFallbackViewer ? (
          <PageViewer 
            currentPage={sectionData.currentPage}
            onPageChange={sectionActions.handlePageChange}
            currentSection={sectionData.currentSection}
          />
        ) : (
          <EnhancedPdfViewer
            currentPage={sectionData.currentPage}
            onPageChange={sectionActions.handlePageChange}
            onError={() => pdfViewerActions.setUseFallbackViewer(true)}
            currentSection={sectionData.currentSection}
          />
        )}
      </View>
      
      {/* Navigation Drawer and Overlay */}
      {sectionData.isSectionDrawerOpen && (
        <TouchableWithoutFeedback onPress={sectionActions.toggleSectionDrawer}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
      )}
      
      <Animated.View 
        style={[
          styles.sectionDrawer,
          { transform: [{ translateX: sectionData.sectionDrawerAnim }] }
        ]}
      >
        <SectionNavigation
          sections={sectionData.sections}
          currentSectionId={sectionData.currentSection.id}
          onSectionPress={sectionActions.handleSectionPress}
          onToggleComplete={sectionActions.handleToggleComplete}
          onClose={sectionActions.toggleSectionDrawer}
          khatmCount={khatmData.khatmCount}
        />
      </Animated.View>
      
      {/* Modals */}
      <AudioModal
        visible={pdfViewerState.isAudioModalVisible}
        onClose={pdfViewerActions.toggleAudioModal}
        currentSection={sectionData.currentSection}
        sections={sectionData.sections}
      />
      
      {/* Regular Reading Streak Notification (for manual manzil completion) */}
      <ReadingStreakNotification 
        visible={khatmData.showNotification}
        title={khatmData.notificationData.title}
        message={khatmData.notificationData.message}
        readingDays={streakData.past7Days}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
        onClose={() => khatmActions.setShowNotification(false)}
        isKhatm={khatmData.notificationData.isKhatm}
        completionNumber={khatmData.notificationData.isKhatm 
          ? khatmData.khatmCount 
          : khatmData.notificationData.title.includes('Manzil') 
            ? parseInt(khatmData.notificationData.title.match(/Manzil (\d+)/)?.[1] || '1') 
            : undefined}
        rewardPoints={khatmData.notificationData.isKhatm ? 500 + (streakData.currentStreak * 20) : 50}
      />
      
      {/* Reading Manzil Completion Notification (for automatic manzil completion) */}
      <ReadingManzilCompletionNotification
        visible={showReadingManzilCompletion}
        title={readingManzilCompletionData.title}
        quote={readingManzilCompletionData.quote}
        readingDays={streakData.past7Days}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
        onClose={() => setShowReadingManzilCompletion(false)}
        level={Math.floor(streakData.currentStreak / 7) + 1}
        rankLabel={`Level ${Math.floor(streakData.currentStreak / 7) + 1} Reciter`}
      />
      
      {/* Commenting out notification screen for now
      <Modal
        visible={notificationState.showReminderSettings}
        animationType="slide"
        transparent={true}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ReminderSettingsScreen onClose={notificationActions.toggleReminderSettings} />
        </View>
      </Modal>
      */}
    </View>
  );
}

// -----------------------------
// Styles
// -----------------------------
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
    width: 320,
    backgroundColor: colors.primary.deep,
    zIndex: 100,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 90,
  },
});