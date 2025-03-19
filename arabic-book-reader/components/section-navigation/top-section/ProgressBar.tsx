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
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Animate progress when the component mounts or percentage changes
  useEffect(() => {
    // Animate progress bar to the current percentage
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false // Can't use native driver for layout animations
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true
      })
    ]).start();
  }, [percentage]);
  
  // Calculate width style dynamically from animated value
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  // Select gradient colors based on completion percentage
  const getGradientColors = () => {
    if (percentage === 100) {
      return ['#4EC07A', '#55D085', '#69DB7C'] as const;
    } else if (percentage >= 75) {
      return ['#4A6DA7', '#55A9D0', '#72BBE1'] as const;
    } else if (percentage >= 50) {
      return ['#3A85C9', '#55A9D0', '#72BBE1'] as const;
    } else if (percentage >= 25) {
      return ['#3A78B4', '#4A99C9', '#55A9D0'] as const;
    } else {
      return ['#3A6DA7', '#55A9D0', '#72BBE1'] as const;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.progressBarContainer, 
        style,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }
      ]} 
      pointerEvents="box-none"
    >  
      <View style={styles.progressBarWrapper}>
        <View style={styles.progressBarOuter}>
          {/* Progress bar background dots for texture */}
          <View style={styles.dotPattern}>
            {Array.from({ length: 25 }).map((_, i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
          
          <Animated.View 
            style={[
              styles.progressBarInnerContainer, 
              { width: progressWidth }
            ]}
          >
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarInner}
            >
              {percentage === 100 && (
                <View style={styles.completionStar}>
                  <Text style={styles.starText}>✦</Text>
                </View>
              )}
            </LinearGradient>
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
        
        <View style={styles.progressInfoContainer}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressInfoGradient}
          >
            <Text style={styles.progressCount}>
              {completedSections}/{totalSections} sections
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    marginVertical: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(42, 45, 116, 0.15)',
    borderRadius: radius.lg,
    shadowColor: colors.primary.sky,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  progressBarWrapper: {
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  progressBarOuter: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.round,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarInnerContainer: {
    height: '100%',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: radius.round,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dotPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    opacity: 0.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  progressPercentage: {
    color: colors.primary.sky,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
  completedPercentage: {
    color: colors.success,
  },
  progressInfoContainer: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  progressInfoGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  progressCount: {
    color: colors.primary.white,
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
    fontWeight: 'bold',
  },
  completionStar: {
    marginRight: spacing.xs,
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    color: '#55D085',
    fontSize: fonts.size.xs,
    fontWeight: 'bold',
  },
});

export default ProgressBar; 