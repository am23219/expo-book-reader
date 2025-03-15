import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
            color="#fff" 
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
            <Ionicons name="close" size={22} color="#6c757d" />
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  manzilNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#5A9EBF',
  },
  khatmNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#0D8A4E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
  },
  badge: {
    backgroundColor: '#0D8A4E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 22,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#F9F5EB',
    borderRadius: 12,
    padding: 12,
  },
  streakInfo: {
    alignItems: 'center',
    padding: 8,
  },
  streakInfoDivider: {
    width: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 10,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D8A4E',
  },
  streakLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  weekText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  readDay: {
    backgroundColor: '#0D8A4E',
  },
  missedDay: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: '#0D8A4E',
  },
  dayName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dayDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  readDayText: {
    color: '#FFF',
  },
  missedDayText: {
    color: '#6c757d',
  },
  checkmark: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#0D8A4E',
    borderRadius: 10,
    width: 16,
    height: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  manzilButton: {
    backgroundColor: '#5A9EBF',
  },
  khatmButton: {
    backgroundColor: '#0D8A4E',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReadingStreakNotification; 