import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../../models/Section';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';
import { formatCompletionDate } from '../../utils/dateFormatters';
import { LinearGradient } from 'expo-linear-gradient';
import { loadLastViewedPages } from '../../utils/storage';

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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [hasSavedPage, setHasSavedPage] = useState(false);
  
  // Load saved page data on component mount
  useEffect(() => {
    const checkSavedPage = async () => {
      try {
        const lastViewedPages = await loadLastViewedPages();
        const savedPage = lastViewedPages[section.id];
        // Set flag if this section has a saved page that's not page 1 and the section is not complete
        setHasSavedPage(savedPage !== undefined && savedPage > section.startPage && !section.isCompleted);
      } catch (error) {
        console.error('Error checking saved page:', error);
      }
    };
    
    checkSavedPage();
  }, [section]);
  
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

  // Pulse animation for current section
  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      // Reset animation when not current
      pulseAnim.setValue(1);
    }
    
    // Clean up animation on unmount
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isCurrent]);

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: animatedValue }] }
      ]}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          isCurrent && { transform: [{ scale: pulseAnim }] }
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
                ['rgba(105, 219, 124, 0.08)', 'rgba(105, 219, 124, 0.15)'] as const : 
                ['rgba(114, 187, 225, 0.08)', 'rgba(114, 187, 225, 0.15)'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionGradient}
            />
          )}
          
          {/* Left highlight bar indicator */}
          {isCurrent && (
            <View style={styles.currentSectionIndicator} />
          )}
          
          {/* Current section icon */}
          {isCurrent && (
            <View style={styles.currentSectionIconContainer}>
              <Ionicons 
                name="book-outline" 
                size={16} 
                color={colors.primary.sky} 
              />
            </View>
          )}
          
          {/* Bookmark icon for sections with saved pages */}
          {hasSavedPage && !isCurrent && (
            <View style={styles.bookmarkIconContainer}>
              <Ionicons 
                name="bookmark" 
                size={16} 
                color={colors.warning} 
              />
            </View>
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
                  colors={['#4EC07A', '#55D085', '#69DB7C'] as const}
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
      </Animated.View>
      
      {/* Add a subtle divider between each section */}
      {!isLast && (
        <View style={styles.sectionDivider} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  animatedContainer: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(42, 45, 116, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(114, 187, 225, 0.1)',
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
    borderRadius: radius.xl,
    backgroundColor: 'rgba(42, 45, 116, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary.sky,
    ...shadows.glow,
  },
  currentSectionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.primary.sky,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    shadowColor: colors.primary.sky,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  currentSectionIconContainer: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.sm,
    backgroundColor: 'rgba(42, 45, 116, 0.7)',
    borderRadius: radius.round,
    padding: spacing.xs,
    shadowColor: colors.primary.sky,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
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
    fontWeight: 'bold',
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
  },
  checkedButton: {
    
  },
  emptyCheckButton: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: 'rgba(114, 187, 225, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCheckInner: {
    width: 18,
    height: 18,
    borderRadius: radius.round,
    backgroundColor: 'rgba(114, 187, 225, 0.2)',
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconWrapper: {
    width: 18,
    height: 18,
    borderRadius: radius.round,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  completionDateText: {
    fontSize: fonts.size.xs,
    color: colors.success,
    fontFamily: fonts.secondaryFamily,
  },
  bookmarkIconContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    zIndex: 2,
  },
});

export default SectionItem; 