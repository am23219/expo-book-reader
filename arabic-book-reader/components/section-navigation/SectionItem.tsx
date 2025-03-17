import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../../models/Section';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';
import { formatCompletionDate } from '../../utils/dateFormatters';

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
  
  // Handle the completion toggle with animation
  const handleToggleComplete = () => {
    if (!section.isCompleted) {
      // Animate when marking as complete
      Animated.sequence([
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
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
        activeOpacity={0.7}
        accessibilityLabel={`${section.title}, pages ${section.startPage} to ${section.endPage}${section.isCompleted ? ', completed' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ 
          selected: isCurrent,
          checked: section.isCompleted
        }}
      >
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
                  size={16} 
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
            <Animated.View>
              <Ionicons
                name="checkmark-circle"
                size={30}
                color={colors.success}
              />
            </Animated.View>
          ) : (
            <Ionicons
              name="ellipse-outline"
              size={28}
              color={'rgba(255, 255, 255, 0.5)'}
            />
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
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slightly increased contrast
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', // Slightly increased contrast
    marginVertical: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  completedSection: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)', // Subtle green tint for completed
    borderLeftWidth: 4, // Increased from 3
    borderLeftColor: colors.success,
    borderRadius: radius.lg,
    ...shadows.medium, // Enhanced shadow for completed items
  },
  currentSection: {
    backgroundColor: 'rgba(114, 187, 225, 0.1)', // Increased contrast
    borderLeftWidth: 4, // Increased from 3
    borderLeftColor: colors.primary.sky,
    transform: [{ scale: 1.02 }], // Slightly more noticeable
    ...shadows.medium,
  },
  sectionInfo: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.size.xl, // Increased from lg to xl
    fontWeight: 'bold',
    color: colors.primary.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.boldFamily,
  },
  currentSectionText: {
    color: colors.primary.sky,
  },
  completedSectionText: {
    color: '#8eda92', // Slightly more saturated green
  },
  pageRange: {
    fontSize: fonts.size.lg, // Increased from md to lg
    color: 'rgba(255, 255, 255, 0.8)', // Increased contrast
    fontFamily: fonts.secondaryFamily,
    marginBottom: spacing.md, // Increased from sm to md for better spacing
  },
  currentPageRange: {
    color: 'rgba(114, 187, 225, 0.95)', // Increased contrast
  },
  completedPageRange: {
    color: 'rgba(131, 221, 137, 0.9)', // Soft green text
  },
  checkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Increased contrast
    padding: spacing.sm,
    borderRadius: radius.round,
    width: 48, // Slightly larger
    height: 48, // Slightly larger
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.16)', // Increased contrast
    borderRadius: radius.round,
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.16)', // Increased contrast
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md, // Increased from sm to md
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  calendarIconWrapper: {
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  completionDateText: {
    fontSize: fonts.size.md, // Increased from sm to md
    color: colors.primary.white,
    fontFamily: fonts.primaryFamily,
    opacity: 0.95,
    fontStyle: 'italic',
  },
});

export default SectionItem; 