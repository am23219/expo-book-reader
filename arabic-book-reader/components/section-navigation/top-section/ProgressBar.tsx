import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';
import { colors, fonts, spacing, radius } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  percentage: number;
  completedSections: number;
  totalSections: number;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  completedSections, 
  totalSections,
  style
}) => {
  // Create animated value for progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Animate progress when the component mounts or percentage changes
  useEffect(() => {
    // Animate progress bar to the current percentage
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Can't use native driver for layout animations
    }).start();
  }, [percentage]);
  
  // Calculate width style dynamically from animated value
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  return (
    <View style={[styles.progressBarContainer, style]} pointerEvents="box-none">  
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarOuter}>
          <Animated.View 
            style={[
              styles.progressBarInnerContainer, 
              { width: progressWidth }
            ]}
          >
            <LinearGradient
              colors={percentage === 100 ? 
                ['#4EC07A', '#55D085', '#69DB7C'] : 
                ['#4A4D9E', '#72BBE1', '#89C8E9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarInner}
            />
          </Animated.View>
        </View>
      </View>
      
      <View style={styles.progressTextRow}>
        <Text style={[
          styles.progressPercentage,
          percentage === 100 && styles.completedPercentage
        ]}>
          {percentage}%
        </Text>
        <Text style={styles.progressCount}>
          {completedSections}/{totalSections} sections
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    marginVertical: spacing.xs,
  },
  progressBarWrapper: {
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  progressPercentage: {
    color: colors.primary.sky,
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
  completedPercentage: {
    color: colors.success,
  },
  progressCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
  },
});

export default ProgressBar; 