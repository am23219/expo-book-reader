import React from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, fonts, spacing, radius } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import ReadingStreakIndicator from './ReadingStreakIndicator';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface ProgressBarProps {
  percentage: number;
  completedSections: number;
  totalSections: number;
  readingDays?: ReadingDay[];
  currentStreak?: number;
  onStreak?: boolean;
  onStreakPress?: () => void;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  completedSections, 
  totalSections,
  readingDays,
  currentStreak = 0,
  onStreak = true,
  onStreakPress,
  style
}) => {
  // Calculate width style based on percentage
  const progressWidth = { width: `${percentage}%` } as ViewStyle;
  
  // Determine if we should show the streak indicator
  const showStreakIndicator = readingDays && readingDays.length > 0;

  return (
    <View style={[styles.progressBarContainer, style]} pointerEvents="box-none">
      <Text style={styles.progressLabel}>Progress</Text>
      
      <View style={styles.progressBarOuter}>
        <Animated.View 
          style={[
            styles.progressBarInnerContainer, 
            progressWidth
          ]}
        >
          <LinearGradient
            colors={[colors.success, colors.primary.sky]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressBarInner}
          />
        </Animated.View>
      </View>
      
      <View style={styles.progressTextRow}>
        <Text style={styles.progressPercentage}>{percentage}%</Text>
        <Text style={styles.progressCount}>{completedSections}/{totalSections} sections</Text>
      </View>
      
      {showStreakIndicator && readingDays && (
        <View 
          pointerEvents="box-none" 
          style={{ 
            zIndex: 999, 
            position: 'relative' 
          }}
        >
          <ReadingStreakIndicator 
            readingDays={readingDays}
            currentStreak={currentStreak}
            onStreak={onStreak}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  progressLabel: {
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    color: colors.primary.white,
    marginBottom: spacing.sm,
    fontFamily: fonts.boldFamily,
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarInnerContainer: {
    height: '100%',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: radius.round,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressPercentage: {
    color: colors.success,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
  progressCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fonts.size.md,
    fontFamily: fonts.primaryFamily,
  }
});

export default ProgressBar; 