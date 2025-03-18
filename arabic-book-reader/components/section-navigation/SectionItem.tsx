import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../../models/Section';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';
import { formatCompletionDate } from '../../utils/dateFormatters';
import { LinearGradient } from 'expo-linear-gradient';

interface SectionItemProps {
  section: Section;
  index: number;
  isLast: boolean;
  isCurrent: boolean;
  animatedValue: Animated.Value;
  onPress: () => void;
  onToggleComplete: () => void;
}

const SectionItem: React.FC<SectionItemProps> = ({
  section,
  index,
  isLast,
  isCurrent,
  animatedValue,
  onPress,
  onToggleComplete
}) => {
  // Animation reference for completion effect
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  
  // Handle the completion toggle with animation
  const handleToggleComplete = () => {
    if (!section.isCompleted) {
      // Animate when marking as complete
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
    onToggleComplete();
  };

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: animatedValue }] }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.sectionItem,
          section.isCompleted && styles.completedSection,
          isCurrent && styles.currentSection
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`${section.title}, pages ${section.startPage} to ${section.endPage}${section.isCompleted ? ', completed' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ 
          selected: isCurrent,
          checked: section.isCompleted
        }}
      >
        {/* Background gradient for current and completed sections */}
        {(isCurrent || section.isCompleted) && (
          <LinearGradient
            colors={section.isCompleted ? 
              ['rgba(105, 219, 124, 0.08)', 'rgba(105, 219, 124, 0.15)'] : 
              ['rgba(114, 187, 225, 0.08)', 'rgba(114, 187, 225, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionGradient}
          />
        )}
        
        <View style={styles.sectionInfo}>
          <Text style={[
            styles.sectionTitle,
            isCurrent && styles.currentSectionText,
            section.isCompleted && styles.completedSectionText
          ]}>
            {section.title}
          </Text>
          <Text style={[
            styles.pageRange,
            isCurrent && styles.currentPageRange,
            section.isCompleted && styles.completedPageRange
          ]}>
            Pages {section.startPage}-{section.endPage}
          </Text>
          
          {section.isCompleted && section.completionDate && (
            <View style={styles.completionDateContainer}>
              <View style={styles.calendarIconWrapper}>
                <Ionicons 
                  name="checkmark" 
                  size={12} 
                  color={colors.primary.white} 
                />
              </View>
              <Text style={styles.completionDateText}>
                Completed: {formatCompletionDate(section.completionDate)}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.checkButton,
            section.isCompleted && styles.checkedButton
          ]}
          onPress={handleToggleComplete}
          accessibilityLabel={section.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: section.isCompleted }}
        >
          {section.isCompleted ? (
            <Animated.View style={{
              transform: [{ scale: checkScale }]
            }}>
              <LinearGradient
                colors={['#4EC07A', '#55D085', '#69DB7C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkButtonGradient}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={colors.primary.white}
                />
              </LinearGradient>
            </Animated.View>
          ) : (
            <View style={styles.emptyCheckButton}>
              <View style={styles.emptyCheckInner} />
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* Add a subtle divider between each section */}
      {!isLast && (
        <View style={styles.sectionDivider} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(42, 45, 116, 0.1)',
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(114, 187, 225, 0.1)',
    ...shadows.small,
  },
  sectionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(114, 187, 225, 0.05)',
    marginVertical: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  completedSection: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderRadius: radius.xl,
    ...shadows.success,
  },
  currentSection: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.sky,
    transform: [{ scale: 1.02 }],
    ...shadows.glow,
  },
  sectionInfo: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    color: colors.primary.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.boldFamily,
  },
  currentSectionText: {
    color: colors.primary.sky,
    textShadowColor: 'rgba(114, 187, 225, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  completedSectionText: {
    color: colors.success,
  },
  pageRange: {
    fontSize: fonts.size.md,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fonts.secondaryFamily,
    marginBottom: spacing.md,
  },
  currentPageRange: {
    color: 'rgba(114, 187, 225, 0.95)',
  },
  completedPageRange: {
    color: 'rgba(105, 219, 124, 0.9)',
  },
  checkButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  checkButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  emptyCheckButton: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: 'rgba(114, 187, 225, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 45, 116, 0.2)',
  },
  emptyCheckInner: {
    width: 16,
    height: 16,
    borderRadius: radius.round,
    backgroundColor: 'rgba(114, 187, 225, 0.2)',
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(105, 219, 124, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    alignSelf: 'flex-start',
  },
  calendarIconWrapper: {
    width: 16,
    height: 16,
    borderRadius: radius.round,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  completionDateText: {
    color: colors.success,
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
  },
  checkedButton: {
    backgroundColor: 'transparent',
  },
});

export default SectionItem; 