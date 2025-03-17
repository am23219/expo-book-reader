import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Section } from '../models/Section';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Format completion date in a nice, aesthetic way
const formatCompletionDate = (date: Date | undefined): string => {
  if (!date) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const completionDate = new Date(date);
  
  // Handle special cases
  if (completionDate.getDate() === today.getDate() &&
      completionDate.getMonth() === today.getMonth() &&
      completionDate.getFullYear() === today.getFullYear()) {
    return 'Today';
  }
  
  if (completionDate.getDate() === yesterday.getDate() &&
      completionDate.getMonth() === yesterday.getMonth() &&
      completionDate.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }
  
  // For other dates, format as "Sat, Mar 15"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[completionDate.getDay()];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[completionDate.getMonth()];
  const day = completionDate.getDate();
  
  return `${dayName}, ${month} ${day}`;
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
  // Create references for animations
  const animatedValues = React.useRef(sections.map(() => new Animated.Value(1))).current;
  
  // Function to animate button press
  const animatePress = (index: number) => {
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.primary.white} />
        </TouchableOpacity>
      </View>
      
      {khatmCount > 0 && (
        <View style={styles.khatmCountContainer}>
          <Text style={styles.khatmCountLabel}>Completions</Text>
          <Text style={styles.khatmCount}>{khatmCount}</Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.sectionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {sections.map((section, index) => (
          <Animated.View 
            key={section.id}
            style={[
              { transform: [{ scale: animatedValues[index] }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.sectionItem,
                currentSectionId === section.id && styles.currentSection
              ]}
              onPress={() => {
                animatePress(index);
                onSectionPress(section);
              }}
              activeOpacity={0.7}
              accessibilityLabel={`${section.title}, pages ${section.startPage} to ${section.endPage}${section.isCompleted ? ', completed' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ 
                selected: currentSectionId === section.id,
                checked: section.isCompleted
              }}
            >
              <View style={styles.sectionInfo}>
                <Text style={[
                  styles.sectionTitle,
                  currentSectionId === section.id && styles.currentSectionText,
                  section.isCompleted && styles.completedSectionText
                ]}>
                  {section.title}
                </Text>
                <Text style={[
                  styles.pageRange,
                  section.isCompleted && styles.completedPageRange
                ]}>
                  Pages {section.startPage}-{section.endPage}
                </Text>
                
                {section.isCompleted && section.completionDate && (
                  <View style={styles.completionDateContainer}>
                    <Ionicons 
                      name="calendar-outline" 
                      size={12} 
                      color={colors.success} 
                      style={styles.calendarIcon} 
                    />
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
                onPress={() => {
                  // Add haptic feedback here if needed
                  onToggleComplete(section.id);
                }}
                accessibilityLabel={section.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: section.isCompleted }}
              >
                <Ionicons
                  name={section.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                  size={30}
                  color={section.isCompleted ? colors.success : colors.text.muted}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        {onCompleteKhatm && (
          <TouchableOpacity 
            style={styles.completeKhatmButton}
            onPress={onCompleteKhatm}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#D4AF37', '#F4C430', '#D4AF37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeKhatmGradient}
            >
              <View style={styles.completeKhatmContent}>
                <FontAwesome5 name="star" size={16} color={colors.primary.white} style={styles.completeKhatmIcon} />
                <Text style={styles.completeKhatmText}>Complete Khatm</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary.deep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
  },
  closeButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  khatmCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.md,
  },
  khatmCountLabel: {
    fontSize: fonts.size.md,
    color: colors.primary.white,
    fontFamily: fonts.primaryFamily,
  },
  khatmCount: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: colors.primary.sky,
    fontFamily: fonts.boldFamily,
  },
  sectionsContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  currentSection: {
    backgroundColor: colors.secondary.indigo,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.sky,
    ...shadows.small,
    transform: [{ translateX: -2 }],
  },
  sectionInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.size.lg,
    fontWeight: '600',
    color: colors.primary.white,
    marginBottom: spacing.xs,
    fontFamily: fonts.secondaryFamily,
  },
  currentSectionText: {
    color: colors.primary.sky,
    fontWeight: '700',
    fontSize: fonts.size.lg,
  },
  completedSectionText: {
    color: colors.success,
  },
  pageRange: {
    fontSize: fonts.size.sm,
    color: colors.primary.sky,
    opacity: 0.8,
    fontFamily: fonts.primaryFamily,
  },
  completedPageRange: {
    color: 'rgba(76, 175, 80, 0.8)',
  },
  checkButton: {
    padding: spacing.sm,
    borderRadius: radius.round,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: radius.round,
  },
  footer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  completeKhatmButton: {
    width: '90%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  completeKhatmGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.5,
  },
  completionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    borderLeftWidth: 2,
    borderLeftColor: colors.success,
  },
  calendarIcon: {
    marginRight: 4,
    opacity: 0.9,
  },
  completionDateText: {
    fontSize: fonts.size.xs,
    color: colors.success,
    fontFamily: fonts.primaryFamily,
    fontWeight: '500',
  },
});

export default SectionNavigation; 