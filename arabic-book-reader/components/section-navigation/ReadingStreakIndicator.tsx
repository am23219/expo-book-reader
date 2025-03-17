import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Modal, TouchableOpacity, Pressable } from 'react-native';
import { colors, fonts, spacing, radius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface ReadingStreakIndicatorProps {
  readingDays: ReadingDay[];
  currentStreak: number;
  onStreak?: boolean;
  onPress?: () => void;
}

const formatDate = (date: Date): string => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[date.getDay()];
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Get the last 7 days
const getLast7Days = (): Date[] => {
  const result: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    result.push(date);
  }
  return result;
};

const ReadingStreakIndicator: React.FC<ReadingStreakIndicatorProps> = ({ 
  readingDays, 
  currentStreak,
  onStreak = true,
  onPress
}) => {
  console.log("ReadingStreakIndicator rendered");
  
  const [modalVisible, setModalVisible] = useState(false);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get the last 7 days for display
  const last7Days = getLast7Days();

  // Animation values
  const fireAnimation = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const dayCircleScales = useRef(last7Days.map(() => new Animated.Value(1))).current;
  
  // Start animations when component mounts
  useEffect(() => {
    // Animate fire icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireAnimation, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    // Animate badge
    Animated.sequence([
      Animated.timing(badgeScale, {
        toValue: 1.1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }),
      Animated.timing(badgeScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ]).start();

    // Find completed days in the last 7 days
    const completedIndices: number[] = [];
    last7Days.forEach((date, index) => {
      // Check if this day exists in readingDays and was read
      const wasReadOn = readingDays.some(day => isSameDay(day.date, date) && day.didRead);
      if (wasReadOn) {
        completedIndices.push(index);
      }
    });

    // Animate completed day circles with a staggered delay
    completedIndices.forEach((index, i) => {
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.timing(dayCircleScales[index], {
          toValue: 1.5,
          duration: 400,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true
        }),
        Animated.timing(dayCircleScales[index], {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true
        })
      ]).start();
    });
  }, []);

  const handlePress = () => {
    setModalVisible(true);
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.streakRow}>
          <Animated.View style={[
            styles.streakBadgeContainer,
            { transform: [{ scale: badgeScale }] }
          ]}>
            <LinearGradient
              colors={onStreak ? 
                ['#2A9D6E', '#36B37E', '#4CC38A'] : 
                ['#3A3F65', '#4A5080', '#5B628C']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakBadge}
            >
              <Animated.View style={{
                transform: [{ scale: fireAnimation }],
              }}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={20} 
                  color={onStreak ? "#FFDC61" : colors.primary.white} 
                />
              </Animated.View>
              <Text style={[
                styles.streakText, 
                onStreak && styles.activeStreakText
              ]}>
                {currentStreak}
              </Text>
            </LinearGradient>
          </Animated.View>
          <Text style={styles.streakLabel}>
            {onStreak ? "day streak" : "streak ended"}
          </Text>
        </View>
        
        <View style={styles.daysContainer}>
          {last7Days.map((date, index) => {
            const isToday = isSameDay(date, today);
            
            // Check if this day exists in readingDays and was read
            const day = readingDays.find(d => isSameDay(d.date, date));
            const didRead = day ? day.didRead : false;
            
            return (
              <View key={index} style={styles.dayItem}>
                <Text style={[
                  styles.dayLabel,
                  isToday && styles.todayLabel
                ]}>
                  {formatDate(date)}
                </Text>
                <View style={styles.dayCircleContainer}>
                  {didRead && (
                    <Animated.View
                      style={[
                        styles.glowEffect,
                        {
                          transform: [{ scale: dayCircleScales[index] }],
                          opacity: 0.5
                        }
                      ]}
                    />
                  )}
                  <Animated.View style={[
                    styles.dayCircle,
                    didRead && styles.activeDay,
                    isToday && styles.todayCircle,
                    didRead && {
                      transform: [{ scale: dayCircleScales[index] }]
                    }
                  ]} />
                </View>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Reading Streak</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.streakInfoContainer}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={32} 
                  color={onStreak ? "#FFDC61" : colors.primary.white} 
                />
                <Text style={styles.streakInfoText}>
                  {onStreak
                    ? `You're on a ${currentStreak} day streak!`
                    : `Your streak ended at ${currentStreak} days`
                  }
                </Text>
              </View>
              
              <Text style={styles.streakDescription}>
                Read every day to maintain your streak and build a consistent reading habit.
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 999,
    width: '100%',
  },
  container: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    zIndex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  streakBadgeContainer: {
    borderRadius: radius.round,
    marginRight: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm / 1.2,
  },
  streakText: {
    color: colors.primary.white,
    fontWeight: 'bold',
    fontSize: fonts.size.md,
    marginLeft: 6,
    fontFamily: fonts.boldFamily,
  },
  activeStreakText: {
    color: colors.primary.white,
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: fonts.size.sm,
    fontFamily: fonts.primaryFamily,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.xs,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs / 2,
    marginHorizontal: 2,
  },
  dayLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fonts.size.xs,
    marginBottom: spacing.xs,
    fontFamily: fonts.primaryFamily,
    textAlign: 'center',
  },
  todayLabel: {
    color: colors.primary.white,
    fontWeight: 'bold',
  },
  dayCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 18,
    width: 18,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: radius.round,
    backgroundColor: colors.success,
    opacity: 0.5,
  },
  dayCircle: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  activeDay: {
    backgroundColor: colors.success,
    width: 14,
    height: 14,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary.white,
  },
  nonInteractive: {
    opacity: 0.9,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1A1E30',
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fonts.size.lg,
    fontFamily: fonts.boldFamily,
    color: colors.primary.white,
  },
  modalBody: {
    marginVertical: spacing.md,
  },
  streakInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  streakInfoText: {
    fontSize: fonts.size.md,
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
    marginLeft: spacing.sm,
  },
  streakDescription: {
    fontSize: fonts.size.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: fonts.primaryFamily,
    lineHeight: 22,
  },
});

export default ReadingStreakIndicator;