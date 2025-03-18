import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, shadows } from '../../../constants/theme';
import Last7DaysIndicator from './Last7DaysIndicator';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface ReadingDay {
  date: Date;
  didRead: boolean;
}

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
  readingDays: ReadingDay[];
  currentStreak: number;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  visible,
  onClose,
  readingDays,
  currentStreak
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    console.log("ActivityModal visibility changed:", visible);
    if (visible) {
      console.log("Showing ActivityModal with streak:", currentStreak);
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
    }
  }, [visible, currentStreak]);

  const handleClose = () => {
    console.log("Modal close button pressed");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      onShow={() => console.log("Modal onShow triggered")}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          onPress={handleClose} 
          activeOpacity={1}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(41, 44, 116, 0.95)', 'rgba(40, 45, 67, 0.95)']}
            style={styles.modalGradient}
          >
            <BlurView intensity={20} style={styles.blurView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Recent Activity</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={20} color={colors.primary.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.streakInfoContainer}>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                  <Text style={styles.streakValue}>{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.last7DaysContainer}>
                  <Text style={styles.sectionTitle}>Last 7 Days</Text>
                  <Last7DaysIndicator readingDays={readingDays} />
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 500,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  modalGradient: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(114, 187, 225, 0.2)',
  },
  blurView: {
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    paddingVertical: spacing.md,
  },
  streakInfoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: fonts.size.md,
    marginBottom: spacing.xs,
  },
  streakValue: {
    color: colors.primary.sky,
    fontSize: fonts.size.xxl,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: spacing.md,
  },
  last7DaysContainer: {
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    fontFamily: fonts.boldFamily,
  },
});

export default ActivityModal; 