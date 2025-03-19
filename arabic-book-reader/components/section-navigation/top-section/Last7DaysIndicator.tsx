import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, fonts, radius, shadows } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ReadingDay {
  date: Date;
  didRead: boolean;
  completedSections?: number; // Added: number of sections completed that day
}

interface Last7DaysIndicatorProps {
  readingDays: ReadingDay[];
}

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Get the last 7 days using modern Array.from approach
const getLast7Days = (): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date;
  }).reverse();
};

// Format day of week as a single letter
const formatDate = (date: Date): string => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[date.getDay()];
};

const Last7DaysIndicator: React.FC<Last7DaysIndicatorProps> = ({ readingDays }) => {
  const { width } = useWindowDimensions();
  
  // Horizontal padding for the container
  const horizontalPadding = 16;
  
  // Improved responsive sizing calculation
  const containerWidth = Math.min(width - 60, 400); // Cap max width
  const circleSize = Math.min(Math.floor((containerWidth - (horizontalPadding * 2)) / 7), 32); // Account for padding
  const glowSize = circleSize * 1.2; // Reduced glow proportion
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the last 7 days for display
  const last7Days = getLast7Days();
  
  // Ensure readingDays dates are Date objects
  const formattedReadingDays = readingDays.map(day => ({
    ...day,
    date: day.date instanceof Date ? day.date : new Date(day.date),
  }));

  return (
    <View style={styles.container}>
      <View style={[
        styles.daysContainer, 
        { 
          width: containerWidth,
          paddingHorizontal: horizontalPadding 
        }
      ]}>
        {last7Days.map((date, index) => {
          const isToday = isSameDay(date, today);
          
          // Find the matching reading day
          const matchingDay = formattedReadingDays.find(day => 
            isSameDay(day.date, date)
          );
          
          const didRead = matchingDay?.didRead || false;
          const sectionsCompleted = matchingDay?.completedSections || 0;
          
          const hasActivity = didRead || sectionsCompleted > 0;
          
          return (
            <View key={index} style={styles.dayItem}>
              <Text style={[
                styles.dayLabel,
                isToday && styles.todayLabel,
              ]}>
                {formatDate(date)}
              </Text>
              
              <View style={[styles.dayCircleContainer, { width: circleSize, height: circleSize }]}>
                {hasActivity && (
                  <View
                    style={[
                      styles.glowEffect,
                      {
                        width: glowSize,
                        height: glowSize,
                        borderRadius: glowSize / 2,
                        backgroundColor: isToday ? 
                          'rgba(114, 187, 225, 0.35)' : 
                          'rgba(114, 187, 225, 0.25)',
                      }
                    ]}
                  />
                )}
                
                <View style={[
                  styles.dayCircle,
                  isToday && styles.todayCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                  }
                ]}>
                  {hasActivity ? (
                    <LinearGradient
                      colors={['#2A2D74', '#72BBE1', '#89C8E9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.activeGradient,
                        {
                          width: circleSize - 2,
                          height: circleSize - 2,
                          borderRadius: (circleSize - 2) / 2,
                        },
                      ]}
                    >
                      <Text style={styles.sectionCountText}>
                        {sectionsCompleted > 0 ? sectionsCompleted : '•'}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center', // Center the days container in the parent
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fonts.size.xs,
    marginBottom: 3,
    fontFamily: fonts.primaryFamily,
    textAlign: 'center',
  },
  todayLabel: {
    color: colors.primary.sky,
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dayCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    zIndex: 1,
    opacity: 0.4,
    shadowColor: 'rgba(114, 187, 225, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 2,
  },
  activeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  sectionCountText: {
    color: '#FFFFFF',
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  todayCircle: {
    borderColor: colors.primary.sky,
    borderWidth: 1.5,
    ...shadows.small,
  },
});

export default Last7DaysIndicator; 