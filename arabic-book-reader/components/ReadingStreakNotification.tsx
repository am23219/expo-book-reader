import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface ReadingStreakNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  readingDays: ReadingDay[];
  currentStreak: number;
  longestStreak: number;
  onClose: () => void;
  isKhatm?: boolean;
}

const { width } = Dimensions.get('window');

const formatDate = (date: Date, format: string): string => {
  // Simple formatter that handles 'EEE' and 'd'
  if (format === 'EEE') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  if (format === 'd') {
    return date.getDate().toString();
  }
  return date.toLocaleDateString();
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const ReadingStreakNotification: React.FC<ReadingStreakNotificationProps> = ({
  visible,
  title,
  message,
  readingDays,
  currentStreak,
  longestStreak,
  onClose,
  isKhatm = false,
}) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Start exit animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const renderDayCircle = (day: ReadingDay, index: number) => {
    const dayName = formatDate(day.date, 'EEE');
    const dayDate = formatDate(day.date, 'd');
    const isToday = isSameDay(day.date, new Date());
    
    return (
      <View 
        key={index} 
        style={[
          styles.dayCircle,
          day.didRead ? styles.readDay : styles.missedDay,
          isToday && styles.todayCircle
        ]}
      >
        <Text style={[styles.dayName, day.didRead ? styles.readDayText : styles.missedDayText]}>
          {dayName}
        </Text>
        <Text style={[styles.dayDate, day.didRead ? styles.readDayText : styles.missedDayText]}>
          {dayDate}
        </Text>
        {day.didRead && (
          <Ionicons 
            name="checkmark" 
            size={14} 
            color={colors.primary.white} 
            style={styles.checkmark} 
          />
        )}
      </View>
    );
  };

  // Exit early if not visible
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View 
        style={[
          styles.notification,
          isKhatm ? styles.khatmNotification : styles.manzilNotification,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {isKhatm && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Khatm</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.streakContainer}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakInfoDivider} />
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
        
        <Text style={styles.weekText}>Past 7 Days:</Text>
        <View style={styles.daysContainer}>
          {readingDays.map(renderDayCircle)}
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, isKhatm ? styles.khatmButton : styles.manzilButton]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Continue Reading</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1000,
  },
  notification: {
    width: Math.min(400, width - 40),
    backgroundColor: colors.primary.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: 80,
    ...shadows.large,
  },
  manzilNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.deep,
  },
  khatmNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary.indigo,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: colors.primary.deep,
    fontFamily: fonts.boldFamily,
  },
  badge: {
    backgroundColor: colors.secondary.indigo,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: colors.primary.white,
    fontSize: fonts.size.xs,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
  closeButton: {
    padding: spacing.xs,
  },
  message: {
    fontSize: fonts.size.md,
    color: colors.text.muted,
    marginBottom: spacing.lg,
    lineHeight: 22,
    fontFamily: fonts.primaryFamily,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.accent,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  streakInfo: {
    flex: 1,
    alignItems: 'center',
  },
  streakInfoDivider: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  streakCount: {
    fontSize: fonts.size.xxl,
    fontWeight: 'bold',
    color: colors.primary.deep,
    marginBottom: spacing.xs,
    fontFamily: fonts.boldFamily,
  },
  streakLabel: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    fontFamily: fonts.primaryFamily,
  },
  weekText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
    color: colors.primary.deep,
    marginBottom: spacing.sm,
    fontFamily: fonts.secondaryFamily,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  readDay: {
    backgroundColor: colors.primary.deep,
  },
  missedDay: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary.sky,
  },
  dayName: {
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
  },
  dayDate: {
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    fontFamily: fonts.secondaryFamily,
  },
  readDayText: {
    color: colors.primary.white,
  },
  missedDayText: {
    color: colors.text.muted,
  },
  checkmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.success,
    borderRadius: radius.round,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.white,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  manzilButton: {
    backgroundColor: colors.primary.deep,
  },
  khatmButton: {
    backgroundColor: colors.secondary.indigo,
  },
  buttonText: {
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  }
});

export default ReadingStreakNotification; 