// BookPage.tsx

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PageViewer from '../components/PageViewer';
import SectionNavigation from '../components/SectionNavigation';
import EnhancedPdfViewer from '../components/EnhancedPdfViewer';
import ReadingStreakNotification from '../components/ReadingStreakNotification';
import ReadingManzilCompletionNotification from '../components/ReadingManzilCompletionNotification';
import Header from '../components/Header';
import AudioModal from '../components/AudioModal';

import { useReadingStreak } from '../hooks/useReadingStreak';
import { useKhatmCompletion } from '../hooks/useKhatmCompletion';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
import { usePdfViewer } from '../hooks/usePdfViewer';

import { SECTIONS } from '../models/Section';
import { clearAllData } from '../utils/storageService';
import { colors } from '../constants/theme';

export default function BookPage() {
  // Reading streak and khatm tracking
  const [streakData, updateReadingStreak] = useReadingStreak();
  const [khatmData, khatmActions] = useKhatmCompletion(streakData.currentStreak);
  const [pdfViewerState, pdfViewerActions] = usePdfViewer();
  
  // Local state for the automatic Manzil completion notification
  const [showReadingManzilCompletion, setShowReadingManzilCompletion] = useState(false);
  const [readingManzilCompletionData, setReadingManzilCompletionData] = useState({
    title: '',
    quote: ''
  });
  
  /* 
   * Updated useSectionNavigation hook: 
   * Now it loads a single global page from storage and uses that to
   * determine the current section. For manual section selection, we default
   * to the section's start page.
   */
  const [sectionData, sectionActions] = useSectionNavigation(SECTIONS, async (section, method) => {
    // When a section is completed, update the reading streak
    await updateReadingStreak();
    
    // For Manzil sections, show a completion notification
    if (section.title.includes('Manzil')) {
      const quote = "Whoever reads the Quran and acts on what is in it, his parents will be made to wear a crown on the Day of Resurrection.";
      setReadingManzilCompletionData({ title: `${section.title} Completed!`, quote });
      setShowReadingManzilCompletion(true);
    }
  });
  
  // Save current book title for widget use
  useEffect(() => {
    AsyncStorage.setItem('current_book_title', 'Barakat Makkiyyah');
  }, []);
  
  // Update widget progress after page or section changes
  useEffect(() => {
    const updateWidget = async () => {
      try {
        const totalPages = sectionData.currentSection.endPage - sectionData.currentSection.startPage + 1;
        const currentPageInSection = sectionData.currentPage - sectionData.currentSection.startPage + 1;
        const storedBookTitle = (await AsyncStorage.getItem('current_book_title')) || 'Barakat Makkiyyah';
        await updateReadingStreak();
      } catch (error) {
        console.error('Error updating widget:', error);
      }
    };
    const timer = setTimeout(updateWidget, 2000);
    return () => clearTimeout(timer);
  }, [sectionData.currentPage, sectionData.currentSection]);
  
  // Handle reset of all data (for debugging or user-triggered reset)
  const handleReset = async () => {
    try {
      await clearAllData();
      const resetSections = SECTIONS.map(section => ({
        ...section,
        isCompleted: false,
        completionDate: undefined
      }));
      sectionActions.setSections(resetSections);
      sectionActions.toggleSectionDrawer();
      alert('Data has been reset to defaults');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('An error occurred while resetting data');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Header 
        title="Barakaat Makkiyyah"
        subtitle={sectionData.currentSection.title}
        onMenuPress={sectionActions.toggleSectionDrawer}
        currentPage={sectionData.currentPage}
        startPage={sectionData.currentSection.startPage}
        endPage={sectionData.currentSection.endPage}
        totalSections={sectionData.sections.length}
        completedSections={sectionData.sections.filter(s => s.isCompleted).length}
      />
      
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
      
      <AudioModal
        visible={pdfViewerState.isAudioModalVisible}
        onClose={pdfViewerActions.toggleAudioModal}
        currentSection={sectionData.currentSection}
        sections={sectionData.sections}
      />
      
      <ReadingStreakNotification 
        visible={khatmData.showNotification}
        title={khatmData.notificationData.title}
        message={khatmData.notificationData.message}
        readingDays={streakData.past7Days}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
        onClose={() => khatmActions.setShowNotification(false)}
        isKhatm={khatmData.notificationData.isKhatm}
        completionNumber={khatmData.notificationData.isKhatm ? khatmData.khatmCount : undefined}
        rewardPoints={khatmData.notificationData.isKhatm ? 500 + (streakData.currentStreak * 20) : 50}
      />
      
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


