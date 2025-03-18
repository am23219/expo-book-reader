import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, fonts } from '../../../constants/theme';
import { NavigationHeader } from '..';
import { ProgressBar } from '..';
import Last7DaysIndicator from './Last7DaysIndicator';
import ActivityModal from './ActivityModal';
import * as Haptics from 'expo-haptics';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface TopSectionProps {
  onClose: () => void;
  percentage: number;
  completedSections: number;
  totalSections: number;
  readingDays: ReadingDay[];
  currentStreak: number;
  onStreak: boolean;
  onStreakPress?: () => void;
}

const TopSection: React.FC<TopSectionProps> = ({
  onClose,
  percentage,
  completedSections,
  totalSections,
  readingDays,
  currentStreak,
  onStreak,
  onStreakPress: externalOnStreakPress,
}) => {
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  const handleStreakPress = () => {
    console.log("handleStreakPress called in TopSection", { currentStreak });
    
    if (externalOnStreakPress) {
      // If there's an external handler, use it
      console.log("Using external onStreakPress handler");
      externalOnStreakPress();
    } else {
      // Otherwise, use internal state to show modal
      console.log("Using internal modal state");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActivityModalVisible(true);
      console.log("Activity modal visible set to true");
    }
  };

  const handleCloseModal = () => {
    console.log("handleCloseModal called");
    setActivityModalVisible(false);
  };

  return (
    <>
      <NavigationHeader 
        onClose={onClose} 
        currentStreak={currentStreak}
        onStreak={onStreak}
        onStreakPress={handleStreakPress}
      />

      {/* A simple wrapper for spacing, no boxy backgrounds */}
      <View style={styles.topWrapper}>
        <ProgressBar 
          percentage={percentage} 
          completedSections={completedSections} 
          totalSections={totalSections}
          style={styles.progressBarOverride}
        />
      </View>

      {/* Subtle divider before manzil sections */}
      <View style={styles.manzilHeaderContainer}>
        <Text style={styles.manzilHeader}>Manzil Sections</Text>
        <View style={styles.manzilHeaderDivider} />
      </View>

      {/* Activity Modal */}
      <ActivityModal
        visible={activityModalVisible}
        onClose={handleCloseModal}
        readingDays={readingDays}
        currentStreak={currentStreak}
      />
    </>
  );
};

const styles = StyleSheet.create({
  topWrapper: {
    // Light padding without heavy borders or backgrounds
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  progressBarOverride: {
    // Provide minimal overrides if you want to remove
    // any extra border or boxy look from the ProgressBar
    marginTop: spacing.sm,
  },
  manzilHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  manzilHeader: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
    // Remove or soften textShadow if it feels too strong
    textShadowColor: 'rgba(114, 187, 225, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  manzilHeaderDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: spacing.md,
    marginTop: 2,
  },
});

export default TopSection;
