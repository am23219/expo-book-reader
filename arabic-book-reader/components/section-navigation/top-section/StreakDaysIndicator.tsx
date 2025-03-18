import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radius, shadows } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface StreakDaysIndicatorProps {
  currentStreak: number;
  onStreak: boolean;
  compact?: boolean;
  onPress?: () => void;
}

const StreakDaysIndicator: React.FC<StreakDaysIndicatorProps> = ({
  currentStreak,
  onStreak,
  compact = false,
  onPress
}) => {
  const fireAnimation = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const [isPressed, setIsPressed] = useState(false);
  
  useEffect(() => {
    // Animate fire icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnimation, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();

    // Animate the badge with a subtle bounce
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(badgeScale, {
        toValue: 1.05,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
    
    // Animate glow effect
    if (onStreak) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false
          })
        ])
      ).start();
    }
  }, [onStreak]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(badgeScale, {
      toValue: 0.9,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(badgeScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  const handlePress = () => {
    console.log("StreakDaysIndicator pressed!");
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress();
    }
  };

  const content = (
    <View style={styles.badgeContainer}>
      {onStreak && (
        <Animated.View style={[
          styles.glowEffect,
          compact ? styles.compactGlow : null,
          { opacity: glowAnim }
        ]} />
      )}
      <LinearGradient
        colors={onStreak ? 
          ['#292C74', '#2A2D74', '#72BBE1'] :
          ['#404961', '#343B51', '#282D43']
        }
        style={[
          styles.streakBadge,
          compact ? styles.compactBadge : null,
          onStreak && styles.activeStreakBadge,
          !onStreak && styles.inactiveStreakBadge,
          onPress && styles.touchableBadge,
          isPressed && styles.pressedBadge
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Animated.View style={{
          transform: [{ scale: fireAnimation }]
        }}>
          <MaterialCommunityIcons 
            name="fire" 
            size={compact ? 12 : 16} 
            color={onStreak ? "#72BBE1" : "#A3A5B0"} 
          />
        </Animated.View>
        <Text style={[
          styles.streakText,
          compact ? styles.compactText : null,
          !onStreak && styles.inactiveStreakText
        ]}>
          {currentStreak}
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.streakContainer,
        compact ? styles.compactContainer : null,
        { transform: [{ scale: badgeScale }] }
      ]}
    >
      {onPress ? (
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.6}
          style={styles.touchable}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          delayPressIn={0}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  streakContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  compactContainer: {
    marginBottom: 0,
    alignSelf: 'auto',
  },
  badgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5, // Added padding for a larger touch target
  },
  glowEffect: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: radius.round,
    backgroundColor: 'rgba(114, 187, 225, 0.3)',
    zIndex: -1,
    ...shadows.glow,
  },
  compactGlow: {
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.round,
    ...shadows.small,
    borderWidth: 1,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeStreakBadge: {
    borderColor: 'rgba(114, 187, 225, 0.5)',
  },
  inactiveStreakBadge: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  touchableBadge: {
    borderColor: 'rgba(114, 187, 225, 0.8)',
    borderWidth: 1.5,
  },
  pressedBadge: {
    backgroundColor: 'rgba(114, 187, 225, 0.2)',
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  compactText: {
    fontSize: fonts.size.sm,
    marginLeft: 3,
  },
  inactiveStreakText: {
    color: '#C7C8CD',
    textShadowColor: 'transparent',
  }
});

export default StreakDaysIndicator; 