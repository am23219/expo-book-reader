import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface ReadingManzilCompletionNotificationProps {
  visible: boolean;
  title: string;              // e.g. "Manzil 1 Completed!"
  quote?: string;             // e.g. "The miser is the one in whose presence..."
  readingDays: ReadingDay[];
  currentStreak: number;
  longestStreak: number;
  onClose: () => void;
  level?: number;             // e.g. 2
  rankLabel?: string;         // e.g. "Level 2 Reciter"
}

const formatDate = (date: Date, format: string): string => {
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

const ReadingManzilCompletionNotification: React.FC<ReadingManzilCompletionNotificationProps> = ({
  visible,
  title,
  quote,
  readingDays,
  currentStreak,
  longestStreak,
  onClose,
  level = 1,
  rankLabel = 'Level 1 Reciter',
}) => {
  const { width, height } = Dimensions.get('window');

  // Slide-up + fade-in animation
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Animated container for the modal */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          {/* Header gradient with title */}
          <LinearGradient
            colors={['#2A2D74', '#2F337D', '#3840A0']}
            style={styles.headerContainer}
          >
            <Text style={styles.headerTitle}>{title}</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* If you have a quote, display it here */}
            {quote && (
              <View style={styles.quoteContainer}>
                <Text style={styles.quoteText}>{quote}</Text>
              </View>
            )}

            {/* Streak area */}
            <View style={styles.streakRow}>
              <View style={styles.streakItem}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.streakItem}>
                <Text style={styles.streakNumber}>{longestStreak}</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </View>

            {/* Rank area (optional) */}
            {level > 0 && (
              <View style={styles.rankContainer}>
                <Text style={styles.rankLabel}>Current Rank</Text>
                <Text style={styles.rankText}>
                  {rankLabel || `Level ${level} Reciter`}
                </Text>
              </View>
            )}

            {/* Past 7 days */}
            <View style={styles.daysContainer}>
              <Text style={styles.daysHeading}>Past 7 Days:</Text>
              <View style={styles.daysRow}>
                {readingDays.map((day, idx) => {
                  const dayName = formatDate(day.date, 'EEE');
                  const dayNum = formatDate(day.date, 'd');
                  const isToday = isSameDay(day.date, new Date());
                  const activeDay = day.didRead;
                  return (
                    <View key={idx} style={styles.dayItem}>
                      <View
                        style={[
                          styles.dayCircle,
                          activeDay && styles.dayCircleActive,
                          isToday && styles.dayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            activeDay && styles.dayTextActive,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </View>
                      <Text style={styles.dayName}>{dayName}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer with button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <LinearGradient
                colors={['#2A2D74', '#2F337D', '#3A48B0']}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>Continue Reading</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFF"
                  style={{ marginLeft: 6 }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ReadingManzilCompletionNotification;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  // Quote block
  quoteContainer: {
    backgroundColor: '#F4F8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Streak section
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A2D74',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#DCE0F0',
    marginHorizontal: 8,
  },
  // Rank
  rankContainer: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2D74',
  },
  // Past 7 days
  daysContainer: {
    marginBottom: 20,
  },
  daysHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2D74',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8ECF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCircleActive: {
    backgroundColor: '#2A2D74',
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: '#72BBE1',
  },
  dayText: {
    fontSize: 13,
    color: '#333',
  },
  dayTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  dayName: {
    fontSize: 10,
    color: '#666',
  },
  // Footer
  footer: {
    padding: 16,
  },
  continueButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 24,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
}); 