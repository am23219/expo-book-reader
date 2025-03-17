import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, Modal, View } from 'react-native';
import { Section } from '../models/Section';
import { colors, spacing } from '../constants/theme';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import {
  SectionItem,
  ProgressBar,
  KhatmHeader,
  CompleteKhatmButton,
  NavigationHeader,
  CompletionAnimation
} from './section-navigation';
import { usePulseAnimation, useButtonPressAnimation } from '../hooks/useAnimations';
import { useReadingStreak } from '../hooks/useReadingStreak';
import ReadingStreakNotification from './ReadingStreakNotification';

// Define the ref type for CompletionAnimation
type CompletionAnimationRef = {
  play: (startFrame?: number, endFrame?: number) => void;
  reset: () => void;
};

interface SectionNavigationProps {
  sections: Section[];
  currentSectionId: number;
  onSectionPress: (section: Section) => void;
  onToggleComplete: (sectionId: number) => void;
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
  const completionAnimation = useRef<CompletionAnimationRef>(null);
  
  // Reading streak integration
  const [readingStreakData, updateStreak] = useReadingStreak();
  const [showStreakNotification, setShowStreakNotification] = useState(false);
  
  // Calculate overall progress
  const completedSections = sections.filter(section => section.isCompleted).length;
  const totalSections = sections.length;
  const progressPercentage = Math.round((completedSections / totalSections) * 100);
  
  const allSectionsCompleted = completedSections === totalSections;
  
  // Use custom animation hooks
  const completeKhatmPulse = usePulseAnimation(allSectionsCompleted);
  const { animatedValues, animatePress } = useButtonPressAnimation(sections.length);
  
  // Reset completion animation when component mounts
  useEffect(() => {
    if (completionAnimation.current) {
      completionAnimation.current.reset();
    }
  }, []);
  
  // Scroll to current section when component loads
  useEffect(() => {
    const currentIndex = sections.findIndex(section => section.id === currentSectionId);
    if (currentIndex !== -1 && scrollViewRef.current) {
      // Delay slightly to allow the view to fully render
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: currentIndex * 90, // Approximate height of each section item
          animated: true
        });
      }, 300);
    }
  }, [currentSectionId]);
  
  const handleToggleComplete = async (sectionId: number, isCompleted: boolean) => {
    // More noticeable haptic feedback for completion
    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset animation first to ensure it's not stuck
      if (completionAnimation.current) {
        completionAnimation.current.reset();
        // Use a small timeout to ensure reset is applied before playing
        setTimeout(() => {
          completionAnimation.current?.play(0, 60); // Play only the first part
        }, 10);
      }
      
      // Update reading streak when completing a section
      await updateStreak();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onToggleComplete(sectionId);
  };
  
  const handleCompleteKhatm = async () => {
    if (allSectionsCompleted && onCompleteKhatm) {
      // Strong haptic feedback for khatm completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset and play confetti animation
      if (completionAnimation.current) {
        completionAnimation.current.reset();
        setTimeout(() => {
          completionAnimation.current?.play();
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
    // Calendar functionality disabled for now
    console.log("Streak indicator tapped, but functionality is disabled");
    // No longer showing calendar modal
  };
  
  const handleStreakNotificationClose = () => {
    setShowStreakNotification(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationHeader onClose={onClose} />

      <KhatmHeader khatmCount={khatmCount} />
      
      <ProgressBar 
        percentage={progressPercentage} 
        completedSections={completedSections} 
        totalSections={totalSections}
        readingDays={readingStreakData.past7Days}
        currentStreak={readingStreakData.currentStreak}
        onStreak={readingStreakData.currentStreak > 0}
        onStreakPress={handleStreakPress}
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
            onToggleComplete={() => handleToggleComplete(section.id, section.isCompleted)}
          />
        ))}
      </ScrollView>
      
      <CompletionAnimation 
        ref={completionAnimation}
        animationSource={require('../assets/animations/confetti.json')}
      />
      
      {onCompleteKhatm && (
        <CompleteKhatmButton 
          allSectionsCompleted={allSectionsCompleted}
          completeKhatmPulse={completeKhatmPulse}
          onPress={handleCompleteKhatm}
        />
      )}
      
      {/* Reading Streak Notification Modal */}
      {showStreakNotification && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showStreakNotification}
          onRequestClose={handleStreakNotificationClose}
        >
          <View style={styles.modalOverlay}>
            <ReadingStreakNotification
              visible={showStreakNotification}
              title="Reading Streak"
              message={`You're on a ${readingStreakData.currentStreak} day streak!`}
              readingDays={readingStreakData.past7Days}
              currentStreak={readingStreakData.currentStreak}
              longestStreak={readingStreakData.longestStreak}
              onClose={handleStreakNotificationClose}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.deep,
  },
  sectionsContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xxl * 4, // Extra space for the fixed button
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SectionNavigation; 