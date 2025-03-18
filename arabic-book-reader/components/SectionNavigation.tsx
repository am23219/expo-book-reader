import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, Modal, View, Text, Animated } from 'react-native';
import { Section } from '../models/Section';
import { colors, spacing, radius, fonts } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import {
  SectionItem,
  ProgressBar,
  NavigationHeader,
  CompletionAnimation,
  TopSection
} from './section-navigation';
import { usePulseAnimation, useButtonPressAnimation } from '../hooks/useAnimations';
import { useReadingStreak } from '../hooks/useReadingStreak';
import ReadingStreakNotification from './ReadingStreakNotification';
import ReadingCalendarModal from './ReadingCalendarModal';
import { ActivityModal } from './section-navigation';

// Define the ref type for CompletionAnimation
type CompletionAnimationRef = {
  play: (startFrame?: number, endFrame?: number) => void;
  reset: () => void;
};

interface SectionNavigationProps {
  sections: Section[];
  currentSectionId: number;
  onSectionPress: (section: Section) => void;
  onToggleComplete: (sectionId: number) => Promise<void>;
  onClose: () => void;
  khatmCount: number;
  onReset?: () => Promise<void>;
  onCompleteKhatm?: () => void;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  currentSectionId,
  onSectionPress,
  onToggleComplete,
  onClose,
  khatmCount,
  onCompleteKhatm
}) => {
  // Create references
  const scrollViewRef = useRef<ScrollView>(null);
  const completionAnimationRef = useRef<CompletionAnimationRef>(null);
  
  // Reading streak integration
  const [readingStreakData, updateStreak] = useReadingStreak();
  const [showStreakNotification, setShowStreakNotification] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  
  // Ensure readingDays is properly formatted
  console.log('Reading Streak Data:', JSON.stringify(readingStreakData, null, 2));
  
  // Ensure past7Days isn't null or undefined with default value
  const formattedReadingDays = readingStreakData?.past7Days?.map(day => ({
    ...day,
    date: day.date instanceof Date ? day.date : new Date(day.date),
  })) || [];
  
  // Calculate overall progress
  const completedSections = sections.filter(section => section.isCompleted).length;
  const totalSections = sections.length;
  const progressPercentage = Math.round((completedSections / totalSections) * 100);
  
  const allSectionsCompleted = completedSections === totalSections;
  
  // Use custom animation hooks
  const completeKhatmPulse = usePulseAnimation(allSectionsCompleted);
  const { animatedValues, animatePress } = useButtonPressAnimation(sections.length);
  
  // Animation values for section transitions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  
  // Fade in animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Reset completion animation when component mounts
  useEffect(() => {
    if (completionAnimationRef.current) {
      completionAnimationRef.current.reset();
    }
  }, []);
  
  // Scroll to current section when component loads
  useEffect(() => {
    const currentIndex = sections.findIndex(section => section.id === currentSectionId);
    if (currentIndex !== -1 && scrollViewRef.current) {
      // Delay slightly to allow the view to fully render
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: currentIndex * 100, // Adjusted for new section item height
          animated: true
        });
      }, 400);
    }
  }, [currentSectionId]);
  
  // Add state for calendar modal
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  
  const handleToggleComplete = async (sectionId: number, isCompleted: boolean) => {
    // More noticeable haptic feedback for completion
    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset animation first to ensure it's not stuck
      if (completionAnimationRef.current) {
        completionAnimationRef.current.reset();
        // Use a small timeout to ensure reset is applied before playing
        setTimeout(() => {
          completionAnimationRef.current?.play(0, 60); // Play only the first part
        }, 10);
      }
      
      // Update reading streak when completing a section
      await updateStreak();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    await onToggleComplete(sectionId);
  };
  
  const handleCompleteKhatm = async () => {
    if (allSectionsCompleted && onCompleteKhatm) {
      // Strong haptic feedback for khatm completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset and play confetti animation
      if (completionAnimationRef.current) {
        completionAnimationRef.current.reset();
        setTimeout(() => {
          completionAnimationRef.current?.play();
        }, 10);
      }
      
      // Update reading streak for khatm completion
      await updateStreak();
      
      onCompleteKhatm();
    }
  };

  const handlePress = (index: number, section: Section) => {
    animatePress(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSectionPress(section);
  };
  
  const handleStreakPress = () => {
    console.log("handleStreakPress in SectionNavigation called");
    // Enable activity modal functionality
    setActivityModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleCloseActivityModal = () => {
    console.log("Closing activity modal");
    setActivityModalVisible(false);
  };

  const handleStreakNotificationClose = () => {
    setShowStreakNotification(false);
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <SafeAreaView style={styles.safeArea}>
        <TopSection 
          onClose={onClose}
          percentage={progressPercentage}
          completedSections={completedSections}
          totalSections={totalSections}
          readingDays={formattedReadingDays}
          currentStreak={readingStreakData?.currentStreak || 0}
          onStreak={(readingStreakData?.currentStreak || 0) > 0}
        />
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.sectionsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {sections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index}
              isLast={index === sections.length - 1}
              isCurrent={currentSectionId === section.id}
              animatedValue={animatedValues[index]}
              onPress={() => handlePress(index, section)}
              onToggleComplete={async () => await handleToggleComplete(section.id, section.isCompleted)}
            />
          ))}
          
          {/* Add space at the bottom for better scrolling experience */}
          <View style={styles.bottomPadding} />
        </ScrollView>
        
        <CompletionAnimation 
          ref={completionAnimationRef}
          animationSource={require('../assets/animations/confetti.json')}
        />
        
        {/* Reading Streak Notification Modal */}
        {showStreakNotification && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={showStreakNotification}
            onRequestClose={handleStreakNotificationClose}
          >
            <ReadingStreakNotification 
              visible={showStreakNotification}
              title="Reading Streak"
              message={`You're on a ${readingStreakData?.currentStreak || 0} day streak!`}
              readingDays={formattedReadingDays}
              currentStreak={readingStreakData?.currentStreak || 0}
              longestStreak={readingStreakData?.longestStreak || 0}
              onClose={handleStreakNotificationClose}
            />
          </Modal>
        )}
        
        {/* Calendar Modal */}
        {calendarModalVisible && (
          <ReadingCalendarModal
            visible={calendarModalVisible}
            onClose={() => setCalendarModalVisible(false)}
          />
        )}
        
        {/* Activity Modal */}
        <ActivityModal
          visible={activityModalVisible}
          onClose={handleCloseActivityModal}
          readingDays={formattedReadingDays}
          currentStreak={readingStreakData?.currentStreak || 0}
        />
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(42, 45, 116, 0.95)',
  },
  safeArea: {
    flex: 1,
  },
  sectionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.sm,
  },
  bottomPadding: {
    height: 100, // Space for the complete khatm button
  },
});

export default SectionNavigation; 