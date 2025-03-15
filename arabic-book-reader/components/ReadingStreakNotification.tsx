import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Dimensions, Vibration, Platform, Image, ScaledSize, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// Note: You'll need to install the lottie-react-native package if not already installed
// npm install lottie-react-native
// Add a placeholder animation JSON file in assets/animations/confetti.json
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

// Fix LottieView import to prevent errors
let LottieView: any = null;
try {
  const lottieModule = require('lottie-react-native');
  LottieView = lottieModule.default || lottieModule;
} catch (e) {
  // Create a mock component if the module isn't available
  LottieView = ({ style, source, autoPlay, loop }: any) => <View style={style} />;
}

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
  completionNumber?: number; // New prop for tracking how many completions (khatms or manzils)
  level?: number; // New prop for user's reading level
  newAchievement?: string; // New prop for any new achievement unlocked
  rewardPoints?: number; // New prop for points earned for this completion
  totalPoints?: number; // New prop for total points accumulated
}

// Constants for animation
const CONFETTI_DURATION = 3000;
const BADGE_SCALE_DURATION = 800;

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

// Islamic wisdom quotes for motivation
const wisdomQuotes = [
  "Whoever sends blessings on me once, Allah will send blessings on him tenfold. - Prophet Muhammad ﷺ",
  "The closest of people to me on the Day of Resurrection will be those who send the most blessings upon me. - Prophet Muhammad ﷺ",
  "Sending blessings upon me will be a light on the bridge (Sirat). - Prophet Muhammad ﷺ",
  "Do not make your houses graves, and do not make my grave a place of celebration. Send blessings upon me, for your blessings reach me wherever you are. - Prophet Muhammad ﷺ",
  "The miser is the one in whose presence I am mentioned, and he does not send blessings upon me. - Prophet Muhammad ﷺ",
  "Send abundant blessings on me on Friday, for it is witnessed (by the angels). - Prophet Muhammad ﷺ",
  "The supplication is suspended between heaven and earth and none of it is taken up until you send blessings upon your Prophet. - Prophet Muhammad ﷺ",
  "When you hear the Mu'adhdhin, repeat what he says, then send blessings on me. - Prophet Muhammad ﷺ",
  "Send blessings upon me, for indeed your blessings will reach me from wherever you are. - Prophet Muhammad ﷺ",
];

// Khatm-specific congratulatory messages
const khatmMessages = [
  "SubhanAllah! You've completed your goal of sending blessings on the Prophet ﷺ. May Allah accept this noble deed from you.",
  "Allahu Akbar! Your dedication to sending salawat has led you to this achievement. May Allah bless you.",
  "Alhamdulillah for this blessed completion! May the Prophet ﷺ intercede for you on the Day of Judgment.",
  "MashaAllah! You've journeyed through sending countless blessings. May this completion be a light for you in this world and the next.",
];

// Achievement badges with levels
const achievementLevels = {
  streaks: ["Consistent Reciter", "Dedicated Reciter", "Steadfast Companion", "Exemplary Follower", "Lover of Salawat"],
  completions: ["Beginner", "Explorer", "Devoted", "Master", "Muhammadi"],
  khatms: ["First Completion", "Devoted Follower", "Salawat Companion", "Lover of the Prophet ﷺ", "Distinguished Reciter"]
};

// Badge icons for different achievement types
const getBadgeIcon = (type: 'khatm' | 'streak' | 'manzil', level = 0): string => {
  const badges = {
    khatm: ["🌙", "✨", "🏆", "👑", "🌟"],
    streak: ["🔥", "⚡", "🌊", "🏔️", "⭐"],
    manzil: ["📖", "📚", "🧠", "💫", "🌈"],
  };
  return badges[type][Math.min(level, 4)];
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
  completionNumber = 1,
  level = 1,
  newAchievement = '',
  rewardPoints = 0,
  totalPoints = 0,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isSmallScreen = windowWidth < 375;
  const modalWidth = windowWidth * 0.9;
  const responsiveSpacing = (size: number) => isSmallScreen ? size * 0.8 : size;
  const responsiveFontSize = (size: number) => isSmallScreen ? size * 0.9 : size;

  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rewardScaleAnim = useRef(new Animated.Value(0.5)).current;
  
  // State for random wisdom quote
  const [wisdomQuote, setWisdomQuote] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiAnimation = useRef<any>(null);
  
  // Function to handle haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      switch(type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };
  
  useEffect(() => {
    // Select either a random wisdom quote or a khatm-specific message
    if (isKhatm) {
      const khatmIndex = Math.floor(Math.random() * khatmMessages.length);
      setWisdomQuote(khatmMessages[khatmIndex]);
    } else {
      const quoteIndex = Math.floor(Math.random() * wisdomQuotes.length);
      setWisdomQuote(wisdomQuotes[quoteIndex]);
    }
    
    if (visible) {
      // Trigger haptic feedback when notification appears
      triggerHaptic(isKhatm ? 'success' : 'medium');
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
      
      // Start pulse animation for today circle
      startPulseAnimation();
      
      // Start badge animation if it's a khatm or has an achievement
      if (isKhatm || newAchievement) {
        startBadgeAnimation();
      }
      
      // Show confetti for khatm completions
      if (isKhatm) {
        setTimeout(() => {
          setShowConfetti(true);
          // Check if LottieView and confettiAnimation are available
          if (confettiAnimation.current && LottieView && typeof confettiAnimation.current.play === 'function') {
            try {
              confettiAnimation.current.play();
            } catch (error) {
              console.log('Error playing confetti animation:', error);
            }
          }
        }, 300);
        
        // Hide confetti after a few seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, CONFETTI_DURATION);
      }
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
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Start pulse animation loop for today's circle
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  };
  
  // Animation for achievement badge
  const startBadgeAnimation = () => {
    Animated.sequence([
      Animated.delay(800),
      Animated.spring(badgeScaleAnim, {
        toValue: 1.3,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();
    
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.quad),
    }).start();
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const renderDayCircle = (day: ReadingDay, index: number) => {
    const dayName = formatDate(day.date, 'EEE');
    const dayDate = formatDate(day.date, 'd');
    const isToday = isSameDay(day.date, new Date());
    
    const circleStyle = [
      styles.dayCircle,
      day.didRead ? styles.readDay : styles.missedDay,
      isToday && styles.todayCircle,
      isKhatm && day.didRead && styles.khatmReadDay
    ];
    
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.dayCircleContainer}
        onPress={() => day.didRead && triggerHaptic()}
        activeOpacity={0.8}
      >
        {isToday ? (
          <Animated.View 
            style={[
              ...circleStyle,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={[styles.dayName, day.didRead ? styles.readDayText : styles.missedDayText]}>
              {dayName}
            </Text>
            <Text style={[styles.dayDate, day.didRead ? styles.readDayText : styles.missedDayText]}>
              {dayDate}
            </Text>
            {day.didRead && (
              <View style={[styles.checkmarkContainer, isKhatm && styles.khatmCheckmark]}>
                <Ionicons 
                  name="checkmark" 
                  size={12} 
                  color={colors.primary.white} 
                />
              </View>
            )}
          </Animated.View>
        ) : (
          <View style={circleStyle}>
            <Text style={[styles.dayName, day.didRead ? styles.readDayText : styles.missedDayText]}>
              {dayName}
            </Text>
            <Text style={[styles.dayDate, day.didRead ? styles.readDayText : styles.missedDayText]}>
              {dayDate}
            </Text>
            {day.didRead && (
              <View style={[styles.checkmarkContainer, isKhatm && styles.khatmCheckmark]}>
                <Ionicons 
                  name="checkmark" 
                  size={12} 
                  color={colors.primary.white} 
                />
              </View>
            )}
          </View>
        )}
        {isToday && <Text style={styles.todayLabel}>Today</Text>}
      </TouchableOpacity>
    );
  };

  // Function to handle continue reading with haptic feedback
  const handleContinueReading = () => {
    triggerHaptic('medium');
    onClose();
  };

  // Exit early if not visible
  if (!visible) return null;

  // Update the renderConfetti function to add smoother animation
  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    // If LottieView is not available, use a basic confetti fallback
    if (!LottieView) {
      return (
        <View style={styles.confettiFallback}>
          <Text style={styles.confettiFallbackText}>🎉✨🎊</Text>
        </View>
      );
    }
    
    try {
      // Try to use the animation file
      let animationSource;
      try {
        animationSource = require('../assets/animations/confetti.json');
      } catch (e) {
        console.log('Animation file not found, using fallback:', e);
        return (
          <View style={styles.confettiFallback}>
            <Text style={styles.confettiFallbackText}>🎉✨🎊</Text>
          </View>
        );
      }
      
      return (
        <View style={styles.confettiContainer}>
          <LottieView
            ref={confettiAnimation}
            source={animationSource}
            style={styles.confetti}
            autoPlay
            loop={false}
            speed={0.8}
          />
        </View>
      );
    } catch (error) {
      console.log('Error rendering confetti:', error);
      return (
        <View style={styles.confettiFallback}>
          <Text style={styles.confettiFallbackText}>🎉✨🎊</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {renderConfetti()}
      
      <Animated.View 
        style={[
          styles.notification,
          isKhatm && styles.khatmNotification,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
            opacity: opacityAnim,
            width: modalWidth,
            maxWidth: 500,
            maxHeight: windowHeight * 0.85,
          }
        ]}
      >
        <LinearGradient
          colors={isKhatm ? 
            ['#D4AF37', '#F4C430', '#D4AF37'] : 
            ['#2A2D74', '#3A3D84', '#4A4D94']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.notificationBorder}
        />
        
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isKhatm && styles.khatmTitle]}>{title}</Text>
            {isKhatm && (
              <LinearGradient 
                colors={['#D4AF37', '#F4C430']} 
                style={styles.badge}
              >
                <Text style={styles.badgeText}>Salawat</Text>
              </LinearGradient>
            )}
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          >
            <Ionicons name="close" size={22} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.message}>{message}</Text>
          
          {isKhatm && (
            <Animated.View style={[styles.achievementBadge, { transform: [{ scale: badgeScaleAnim }, { rotate: spin }] }]}>
              <LinearGradient
                colors={['#D4AF37', '#F4C430', '#D4AF37']}
                style={styles.achievementBadgeInner}
              >
                <Text style={styles.achievementIcon}>{getBadgeIcon('khatm', Math.min(completionNumber - 1, 4))}</Text>
                <Text style={styles.achievementCount}>#{completionNumber}</Text>
              </LinearGradient>
            </Animated.View>
          )}
          
          <View style={[styles.streakSection, isKhatm && styles.khatmStreakSection]}>
            <LinearGradient 
              colors={isKhatm ? 
                ['#FFF8E1', '#FFFDE7'] : 
                ['#E8F4FD', '#E0F1FF']}
              style={styles.streakContainer}
            >
              <View style={styles.streakInfo}>
                <Text style={[styles.streakCount, isKhatm && styles.khatmStreakCount]}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              <View style={[styles.streakInfoDivider, isKhatm && styles.khatmDivider]} />
              <View style={styles.streakInfo}>
                <Text style={[styles.streakCount, isKhatm && styles.khatmStreakCount]}>{longestStreak}</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </LinearGradient>
          </View>
          
          {level > 0 && (
            <View style={styles.levelContainer}>
              <LinearGradient
                colors={isKhatm ? 
                  ['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)'] : 
                  ['rgba(42, 45, 116, 0.2)', 'rgba(42, 45, 116, 0.1)']}
                style={styles.levelGradient}
              >
                <FontAwesome5 
                  name="user-graduate" 
                  size={16} 
                  color={isKhatm ? "#D4AF37" : colors.primary.deep} 
                />
                <Text style={[styles.levelText, isKhatm && styles.khatmLevelText]}>
                  Level {level} Reciter
                </Text>
              </LinearGradient>
            </View>
          )}
          
          <View style={[styles.weeklyProgressContainer, { marginHorizontal: responsiveSpacing(spacing.xs) }]}>
            <Text style={[styles.weekText, isKhatm && styles.khatmWeekText]}>Past 7 Days:</Text>
            <View style={[styles.daysContainer, { 
              justifyContent: isSmallScreen ? 'space-between' : 'space-around' 
            }]}>
              {readingDays.map((day, index) => renderDayCircle(day, index))}
            </View>
          </View>
          
          {newAchievement && (
            <View style={[styles.newAchievementContainer, isKhatm && styles.khatmAchievementContainer]}>
              <Animated.View style={[{ transform: [{ scale: badgeScaleAnim }] }]}>
                <LinearGradient
                  colors={isKhatm ? 
                    ['#D4AF37', '#F4C430'] : 
                    ['#2A2D74', '#3A3D84']}
                  style={styles.newAchievementBadge}
                >
                  <FontAwesome5 name="medal" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <View style={styles.achievementTextContainer}>
                <Text style={styles.newAchievementTitle}>Achievement Unlocked!</Text>
                <Text style={styles.newAchievementName}>{newAchievement}</Text>
              </View>
            </View>
          )}
          
          <View style={[styles.wisdomContainer, isKhatm && styles.khatmWisdomContainer]}>
            <LinearGradient
              colors={isKhatm ? 
                ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)'] : 
                ['rgba(114, 187, 225, 0.1)', 'rgba(114, 187, 225, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.wisdomGradient, isKhatm && styles.khatmWisdomGradient]}
            >
              <Text style={[styles.wisdomText, isKhatm && styles.khatmWisdomText]}>
                {wisdomQuote}
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, isKhatm && styles.khatmButton, { width: '95%' }]} 
            onPress={handleContinueReading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isKhatm ? 
                ['#D4AF37', '#F4C430', '#D4AF37'] : 
                [colors.primary.deep, colors.secondary.darkNavy]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue Reading</Text>
            </LinearGradient>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  notification: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignSelf: 'center',
    overflow: 'hidden',
    ...shadows.large,
  },
  khatmNotification: {
    backgroundColor: '#FFFDE7',
  },
  notificationBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 5,
    height: '100%',
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
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
    flex: 1,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: '700',
    color: colors.primary.deep,
    fontFamily: fonts.boldFamily,
    flex: 1,
    letterSpacing: 0.5,
    marginVertical: spacing.xs / 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  khatmTitle: {
    color: '#D4AF37',
  },
  closeButton: {
    padding: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  badgeText: {
    color: colors.primary.white,
    fontSize: fonts.size.xs,
    fontWeight: '700',
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
    fontFamily: fonts.primaryFamily,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  achievementBadge: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  achievementBadgeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.xs / 2,
  },
  achievementCount: {
    fontSize: fonts.size.xs,
    fontWeight: '700',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.5,
  },
  streakSection: {
    marginBottom: spacing.md,
  },
  khatmStreakSection: {
    ...shadows.small,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
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
  khatmDivider: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  streakCount: {
    fontSize: fonts.size.xxl + 4,
    fontWeight: '700',
    color: colors.primary.deep,
    marginBottom: spacing.xs / 2,
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  khatmStreakCount: {
    color: '#D4AF37',
  },
  streakLabel: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    fontFamily: fonts.primaryFamily,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  rewardContainer: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  rewardGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPoints: {
    fontSize: fonts.size.lg,
    fontWeight: '700',
    color: colors.primary.deep,
    marginLeft: spacing.xs,
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.2,
  },
  khatmRewardPoints: {
    color: '#D4AF37',
  },
  totalPoints: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    marginTop: spacing.xs / 2,
    fontFamily: fonts.primaryFamily,
    letterSpacing: 0.2,
  },
  levelContainer: {
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  levelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  levelText: {
    fontSize: fonts.size.sm,
    color: colors.primary.deep,
    fontWeight: '600',
    marginLeft: spacing.xs,
    fontFamily: fonts.secondaryFamily,
    letterSpacing: 0.3,
  },
  khatmLevelText: {
    color: '#D4AF37',
  },
  weekText: {
    fontSize: fonts.size.md,
    fontWeight: '600',
    color: colors.primary.deep,
    marginBottom: spacing.sm,
    fontFamily: fonts.secondaryFamily,
    letterSpacing: 0.3,
  },
  khatmWeekText: {
    color: '#D4AF37',
  },
  weeklyProgressContainer: {
    marginBottom: spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  dayCircleContainer: {
    alignItems: 'center',
    width: '13%', 
    minWidth: 38,
    maxWidth: 52,
    marginHorizontal: 2,
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readDay: {
    backgroundColor: colors.primary.deep,
    ...shadows.small,
  },
  khatmReadDay: {
    backgroundColor: '#D4AF37',
  },
  missedDay: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: colors.primary.sky,
    ...shadows.small,
  },
  todayLabel: {
    fontSize: 9,
    color: colors.text.muted,
    marginTop: 3,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: fonts.primaryFamily,
  },
  dayName: {
    fontSize: 10,
    fontFamily: fonts.primaryFamily,
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.secondaryFamily,
    letterSpacing: 0.2,
  },
  readDayText: {
    color: colors.primary.white,
  },
  missedDayText: {
    color: colors.text.muted,
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: colors.success,
    borderRadius: radius.round,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.white,
    ...shadows.small,
  },
  khatmCheckmark: {
    backgroundColor: '#00C853',
  },
  newAchievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 45, 116, 0.1)',
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  khatmAchievementContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  newAchievementBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  achievementTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  newAchievementTitle: {
    fontSize: fonts.size.xs,
    color: colors.text.muted,
    fontFamily: fonts.primaryFamily,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  newAchievementName: {
    fontSize: fonts.size.md,
    fontWeight: '700',
    color: colors.primary.deep,
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.3,
  },
  wisdomContainer: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  khatmWisdomContainer: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: radius.lg,
  },
  wisdomGradient: {
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.sky,
    borderRadius: radius.lg,
  },
  khatmWisdomGradient: {
    borderLeftColor: '#D4AF37',
  },
  wisdomText: {
    fontSize: fonts.size.sm,
    fontStyle: 'italic',
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-LightOblique' : 'sans-serif-light',
    paddingHorizontal: spacing.xs,
  },
  khatmWisdomText: {
    fontWeight: '500',
    color: '#805E00',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  button: {
    borderRadius: radius.xl,
    ...shadows.medium,
    width: '100%',
  },
  khatmButton: {
    ...shadows.large,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontWeight: '700',
    fontFamily: fonts.boldFamily,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confettiFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    pointerEvents: 'none',
  },
  confettiFallbackText: {
    fontSize: 50,
    letterSpacing: 10,
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
});

export default ReadingStreakNotification; 