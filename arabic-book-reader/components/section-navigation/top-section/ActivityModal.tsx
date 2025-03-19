import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  useWindowDimensions
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
  completedSections?: number;
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
  const { width, height } = useWindowDimensions();
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

  // Calculate modal dimensions based on screen size
  const modalWidth = Math.min(width * 0.9, 500);
  const modalMaxHeight = height * 0.8;

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
              transform: [{ translateY: slideAnim }],
              width: modalWidth,
              maxHeight: modalMaxHeight
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

              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.contentContainer}>
                  <View style={styles.quoteContainer}>
                    <View style={styles.quoteBox}>
                      <Text style={styles.arabicQuote}>سَدِّدُوا وَقَارِبُوا، وَاعْلَمُوا أَنْ لَنْ يُدْخِلَ أَحَدَكُمْ عَمَلُهُ الْجَنَّةَ، وَأَنَّ أَحَبَّ الأَعْمَالِ أَدْوَمُهَا إِلَى اللَّهِ، وَإِنْ قَلَّ</Text>
                      <Text style={styles.englishQuote}>
                        "Be steadfast and strive for moderation, and know that none of you will enter Paradise by their deeds alone. And the most beloved deeds to Allah are{" "}
                        <Text style={{fontWeight: 'bold'}}>those that are consistent</Text>
                        {", even if they are few."}
                      </Text>
                      <Text style={styles.quoteSource}>
                        <Text style={styles.prophetName}>Prophet Muhammad ﷺ</Text>
                        <Text> [Bukhari]</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.last7DaysContainer}>
                    <Text style={styles.sectionTitle}>Last 7 Days</Text>
                    <Last7DaysIndicator readingDays={readingDays} />
                    <Text style={styles.legendText}>Numbers indicate sections completed each day</Text>
                  </View>
                </View>
              </ScrollView>
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
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  modalGradient: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(114, 187, 225, 0.2)',
    height: '100%',
  },
  blurView: {
    padding: spacing.lg,
    height: '100%',
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: spacing.md,
  },
  last7DaysContainer: {
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    fontFamily: fonts.boldFamily,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fonts.size.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  quoteContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.sky,
    borderRightWidth: 3,
    borderRightColor: colors.primary.sky,
    width: '100%',
  },
  arabicQuote: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  englishQuote: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: fonts.size.sm,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  quoteSource: {
    color: colors.primary.sky,
    fontSize: fonts.size.xs,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  prophetName: {
    color: '#e6c260', // Gold color for reverence
    fontWeight: 'bold',
    textShadowColor: 'rgba(230, 194, 96, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    fontSize: fonts.size.sm,
  },
});

export default ActivityModal; 