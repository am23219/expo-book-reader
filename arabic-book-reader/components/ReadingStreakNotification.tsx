import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const ReadingStreakNotification: React.FC<ReadingStreakNotificationProps> = ({
  visible,
  title,
  message,
  readingDays,
  currentStreak,
  longestStreak,
  onClose,
  isKhatm = false
}) => {
  const slideAnim = useRef(new Animated.Value(-400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -400,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);
  
  const formatDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <LinearGradient
            colors={isKhatm 
              ? ['#0D8A4E', '#1A9E64', '#27B37A'] 
              : ['#5A9EBF', '#6BAAD0', '#7CB6E0']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.streakContainer}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakValue}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              
              <View style={styles.streakDivider} />
              
              <View style={styles.streakInfo}>
                <Text style={styles.streakValue}>{longestStreak}</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </View>
            
            <View style={styles.calendarContainer}>
              <Text style={styles.calendarTitle}>Last 7 Days</Text>
              <View style={styles.calendar}>
                {readingDays.map((day, index) => (
                  <View key={index} style={styles.calendarDay}>
                    <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
                    <View style={[
                      styles.dayIndicator,
                      day.didRead ? styles.dayRead : styles.dayMissed
                    ]}>
                      {day.didRead && (
                        <Ionicons 
                          name="checkmark" 
                          size={16} 
                          color="#fff" 
                        />
                      )}
                    </View>
                    <Text style={styles.dateLabel}>{day.date.getDate()}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.button,
                { backgroundColor: isKhatm ? '#0D8A4E' : '#5A9EBF' }
              ]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Continue Reading</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#F9F5EB',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: '#4A6E8A',
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 16,
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A6E8A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  streakLabel: {
    fontSize: 14,
    color: '#8A7E6A',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  streakDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#D8D2C3',
  },
  calendarContainer: {
    marginVertical: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6E8A',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    padding: 12,
  },
  calendarDay: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#8A7E6A',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  dayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayRead: {
    backgroundColor: '#4CAF50',
  },
  dayMissed: {
    backgroundColor: '#E8E2D3',
  },
  dateLabel: {
    fontSize: 12,
    color: '#8A7E6A',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
});

export default ReadingStreakNotification; 