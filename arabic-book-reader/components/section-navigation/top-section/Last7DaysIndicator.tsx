import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radius, shadows } from '../../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ReadingDay {
  date: Date;
  didRead: boolean;
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
  
  // More compact sizing for better responsiveness
  const maximumSpace = width - 60; // Allow space for margins
  const circleSize = Math.min(Math.floor(maximumSpace / 10), 22); // Reduced size
  const glowSize = circleSize * 1.5; // Increased glow proportionally
  
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
      <View style={styles.daysContainer}>
        {last7Days.map((date, index) => {
          const isToday = isSameDay(date, today);
          
          // Check if this day exists in readingDays and was read
          const didRead = formattedReadingDays.some(day => 
            isSameDay(day.date, date) && day.didRead
          );
          
          // Circle rendering
          return (
            <View key={index} style={[styles.dayItem, { width: circleSize * 1.2 }]}>
              <Text style={[
                styles.dayLabel,
                isToday && styles.todayLabel,
              ]}>
                {formatDate(date)}
              </Text>
              <View style={[styles.dayCircleContainer, { width: circleSize, height: circleSize }]}>
                {didRead && (
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
                {didRead ? (
                  <View style={[
                    styles.activeDayCircleContainer,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                    }
                  ]}>
                    <LinearGradient
                      colors={['#2A2D74', '#72BBE1', '#89C8E9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.activeGradient,
                        {
                          width: circleSize,
                          height: circleSize,
                          borderRadius: circleSize / 2,
                        },
                      ]}
                    >
                      <View style={styles.checkCircle}>
                        <MaterialCommunityIcons
                          name="check"
                          size={circleSize * 0.4}
                          color="#FFFFFF"
                        />
                      </View>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={[
                    styles.dayCircle,
                    isToday && styles.todayCircle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                    }
                  ]} />
                )}
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
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    // Lower overall opacity from 0.8 => 0.3 or 0.4
    opacity: 0.4,
    // Remove or reduce the “glow” shadow
    // ...shadows.glow,
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
  activeDayCircleContainer: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  checkCircle: {
    width: '70%',
    height: '70%',
    borderRadius: 100,
    backgroundColor: 'rgba(114, 187, 225, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderColor: colors.primary.sky,
    borderWidth: 1.5,
    ...shadows.small,
  },
});

export default Last7DaysIndicator; 