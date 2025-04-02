import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Animated,
  Easing,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, addDays, isSameDay } from '../utils/dateUtils';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Section } from '../models/Section';
import { loadSections } from '../utils/storageService';

interface DayActivity {
  date: Date;
  manzilsRead: number;
}

interface ReadingCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

// Date utility functions that are missing from dateUtils.ts
const startOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfMonth = (date: Date): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

const format = (date: Date, formatStr: string): string => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (formatStr === 'MMMM yyyy') {
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }
  
  return date.toLocaleDateString();
};

const ReadingCalendarModal: React.FC<ReadingCalendarModalProps> = ({ visible, onClose }) => {
  console.log("ReadingCalendarModal render with visible =", visible);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [readingActivity, setReadingActivity] = useState<DayActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSections, setCompletedSections] = useState<Section[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      console.log("ReadingCalendarModal visibility changed to visible");
      // Reset animations when modal becomes visible
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
      
      loadReadingData();
    } else {
      console.log("ReadingCalendarModal visibility changed to hidden");
    }
  }, [visible, selectedMonth]);

  const loadReadingData = async () => {
    setIsLoading(true);
    try {
      console.log("Loading reading data...");
      // Load all sections, which include completion status and dates
      const allSections = await loadSections(); 
      console.log(`Loaded ${allSections.length} sections from storage.`);
      
      // Filter for completed sections to be used in calendar logic
      const completed = allSections.filter((section: Section) => section.isCompleted && section.completionDate);
      console.log(`Found ${completed.length} completed sections with dates.`);
      setCompletedSections(completed); // Store the filtered completed sections
      
      // OPTIONAL: Load reading history if still needed for other calendar features
      // const savedHistory = await AsyncStorage.getItem('reading_history');
      // let history: Date[] = [];
      // if (savedHistory) {
      //   history = JSON.parse(savedHistory).map((dateStr: string) => new Date(dateStr));
      // }
      
      // Process data to get manzils read per day using the filtered completed sections
      const activityData: DayActivity[] = [];
      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(selectedMonth),
        end: endOfMonth(selectedMonth)
      });
      
      daysInMonth.forEach((day: Date) => {
        const formattedDay = new Date(day);
        formattedDay.setHours(0, 0, 0, 0);
        
        // Count manzils read on this day using the completedSections state
        const manzilsRead = completedSections.filter((section: Section) => {
          const completionDate = new Date(section.completionDate!);
          return isSameDay(completionDate, formattedDay);
        }).length;
        
        activityData.push({
          date: formattedDay,
          manzilsRead
        });
      });
      
      console.log(`Generated activity data for ${activityData.length} days in the month.`);
      console.log(`Days with activity: ${activityData.filter(day => day.manzilsRead > 0).length}`);
      
      setReadingActivity(activityData);
    } catch (error: any) { // Added type
      console.error('Error loading reading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthDays = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  };

  const changeMonth = (increment: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setSelectedMonth(newMonth);
    
    // Provide haptic feedback on month change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getDayColor = (date: Date) => {
    const day = readingActivity.find((day: DayActivity) => 
      day.date.getFullYear() === date.getFullYear() &&
      day.date.getMonth() === date.getMonth() &&
      day.date.getDate() === date.getDate()
    );
    
    if (!day || day.manzilsRead === 0) {
      return 'rgba(255, 255, 255, 0.1)';
    }
    
    // Darker green for more manzils read
    switch (day.manzilsRead) {
      case 1: return 'rgba(54, 179, 126, 0.4)';
      case 2: return 'rgba(54, 179, 126, 0.6)';
      case 3: return 'rgba(54, 179, 126, 0.8)';
      case 4: return 'rgba(54, 179, 126, 0.9)';
      case 5: return 'rgba(54, 179, 126, 1.0)';
      case 6: return 'rgba(38, 149, 96, 1.0)';
      case 7: return 'rgba(20, 122, 70, 1.0)';
      default: return 'rgba(10, 100, 50, 1.0)'; // More than 7 (very rare)
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDayDetails = (date: Date) => {
    const dayActivity = readingActivity.find((day: DayActivity) => isSameDay(day.date, date));
    
    if (!dayActivity || dayActivity.manzilsRead === 0) {
      return null;
    }
    
    // Get the manzils completed on this specific day from the pre-filtered state
    const manzilsCompletedOnDay = completedSections
      .filter((section: Section) => section.completionDate && isSameDay(new Date(section.completionDate), date))
      .map((section: Section) => section.manzilNumber)
      .filter((num: number | undefined): num is number => num !== undefined) // Explicitly type num
      .sort((a: number, b: number) => a - b); // Explicitly type a and b
    
    return {
      manzilsRead: dayActivity.manzilsRead,
      manzilNumbers: manzilsCompletedOnDay
    };
  };

  const handleDayPress = (date: Date) => {
    const details = getDayDetails(date);
    if (details) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const days = getMonthDays();
  const currentMonthName = format(selectedMonth, 'MMMM yyyy');
  const windowWidth = Dimensions.get('window').width;
  const DAY_SIZE = Math.min((windowWidth - 60) / 7, 45);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContainer,
            { 
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <LinearGradient
            colors={['#232840', '#1A1E30']}
            style={[styles.modalContent, { borderWidth: 4, borderColor: '#36B37E' }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: '#FFFFFF', fontSize: 22 }]}>Reading Calendar</Text>
              <TouchableOpacity 
                style={[styles.closeButton, { padding: 12 }]} 
                onPress={() => {
                  console.log('Close button pressed');
                  onClose();
                }}
                accessibilityLabel="Close calendar"
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => changeMonth(-1)}
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary.white} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{currentMonthName}</Text>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => changeMonth(1)}
                accessibilityLabel="Next month"
              >
                <Ionicons name="chevron-forward" size={24} color={colors.primary.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.daysOfWeek}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
              ))}
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.calendarContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.calendarGrid}>
                {/* First row spacers for proper day alignment */}
                {Array.from({ length: days[0].getDay() }).map((_, index) => (
                  <View key={`empty-${index}`} style={[styles.dayCell, { width: DAY_SIZE, height: DAY_SIZE }]} />
                ))}
                
                {/* Actual days */}
                {days.map((date: Date, index: number) => {
                  const details = getDayDetails(date);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        { width: DAY_SIZE, height: DAY_SIZE }
                      ]}
                      onPress={() => handleDayPress(date)}
                      activeOpacity={details ? 0.7 : 1}
                    >
                      <View 
                        style={[
                          styles.dayCircle,
                          { backgroundColor: getDayColor(date) },
                          isToday(date) && styles.todayCircle
                        ]}
                      >
                        <Text style={[
                          styles.dayText,
                          isToday(date) && styles.todayText,
                          details && styles.activeDayText
                        ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      {details && (
                        <View style={styles.dayBadge}>
                          <Text style={styles.dayBadgeText}>
                            {details.manzilsRead}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Activity Level:</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
                  <Text style={styles.legendText}>None</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(54, 179, 126, 0.4)' }]} />
                  <Text style={styles.legendText}>1</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(54, 179, 126, 0.8)' }]} />
                  <Text style={styles.legendText}>3</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: 'rgba(20, 122, 70, 1.0)' }]} />
                  <Text style={styles.legendText}>7+</Text>
                </View>
              </View>
              <Text style={styles.legendSubtitle}>
                Darker color = more manzils read
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10000,
  },
  modalContent: {
    padding: spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontFamily: fonts.boldFamily,
  },
  closeButton: {
    padding: spacing.xs,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  monthButton: {
    padding: spacing.xs,
  },
  monthText: {
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontFamily: fonts.boldFamily,
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs / 2,
  },
  dayOfWeekText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
    textAlign: 'center',
    width: '14.28%',
  },
  calendarContainer: {
    flexGrow: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayCircle: {
    width: '80%',
    height: '80%',
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: colors.primary.white,
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary.white,
  },
  todayText: {
    fontFamily: fonts.boldFamily,
  },
  activeDayText: {
    fontFamily: fonts.boldFamily,
  },
  dayBadge: {
    position: 'absolute',
    top: '10%',
    right: '15%',
    backgroundColor: colors.info,
    borderRadius: radius.round,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    color: colors.primary.white,
    fontSize: 10,
    fontFamily: fonts.boldFamily,
  },
  legend: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendTitle: {
    color: colors.primary.white,
    fontSize: fonts.size.sm,
    fontFamily: fonts.boldFamily,
    marginBottom: spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: radius.round,
    marginRight: 4,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
  },
  legendSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
    fontStyle: 'italic',
  },
});

export default ReadingCalendarModal; 