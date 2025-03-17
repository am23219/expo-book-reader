import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface CompleteKhatmButtonProps {
  allSectionsCompleted: boolean;
  completeKhatmPulse: Animated.Value;
  onPress: () => void;
}

const CompleteKhatmButton: React.FC<CompleteKhatmButtonProps> = ({
  allSectionsCompleted,
  completeKhatmPulse,
  onPress
}) => {
  return (
    <Animated.View 
      style={[
        styles.completeKhatmWrapper,
        { transform: [{ scale: allSectionsCompleted ? completeKhatmPulse : 1 }] }
      ]}
    >
      {!allSectionsCompleted && (
        <Text style={styles.completeKhatmDescription}>
          Finish all Manzils to complete your Khatm
        </Text>
      )}
      
      <TouchableOpacity 
        style={[
          styles.completeKhatmButton,
          !allSectionsCompleted && styles.completeKhatmButtonDisabled
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!allSectionsCompleted}
        accessibilityLabel="Complete your Khatm and record this achievement"
        accessibilityRole="button"
        accessibilityState={{ disabled: !allSectionsCompleted }}
      >
        <LinearGradient
          colors={
            allSectionsCompleted 
            ? ['#72BBE1', '#3795D5'] 
            : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.completeKhatmGradient}
        >
          <View style={styles.completeKhatmContent}>
            <FontAwesome5 
              name="award" 
              size={20} 
              color={colors.primary.white} 
              style={styles.completeKhatmIcon} 
            />
            <Text style={styles.completeKhatmText}>Complete Khatm</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {allSectionsCompleted && (
        <View style={styles.completeBadge}>
          <Text style={styles.completeBadgeText}>Ready!</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  completeKhatmWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(42, 45, 116, 0.95)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.large,
  },
  completeKhatmDescription: {
    fontSize: fonts.size.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: fonts.primaryFamily,
    marginBottom: spacing.md,
  },
  completeKhatmButton: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 56,
    ...shadows.small,
  },
  completeKhatmButtonDisabled: {
    opacity: 0.5,
  },
  completeKhatmGradient: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  completeKhatmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeKhatmIcon: {
    marginRight: spacing.sm,
  },
  completeKhatmText: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.5,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  completeBadgeText: {
    color: colors.primary.white,
    fontSize: fonts.size.xs,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
});

export default CompleteKhatmButton; 