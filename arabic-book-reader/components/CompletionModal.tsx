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
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';
import LottieView from 'lottie-react-native';

interface CompletionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isKhatm?: boolean;
  streakCount?: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  onClose,
  title,
  message,
  isKhatm = false,
  streakCount = 0
}) => {
  const { width } = Dimensions.get('window');
  const modalWidth = Math.min(width * 0.9, 360);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.5)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Add debugging
  useEffect(() => {
    if (visible) {
      console.log(`CompletionModal is now visible - isKhatm: ${isKhatm}, title: ${title}`);
    }
  }, [visible, isKhatm, title]);
  
  // Start animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      iconRotateAnim.setValue(0);
      iconScaleAnim.setValue(0.5);
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(iconRotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.elastic(1.2))
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.elastic(1.2))
        })
      ]).start();
      
      // Start pulse animation for icon
      startIconPulse();
    }
  }, [visible]);
  
  // Pulse animation for the icon
  const startIconPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ]),
      { iterations: -1 }
    ).start();
  };
  
  // Button press animation
  const handleButtonPress = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start(() => {
      console.log("Closing modal");
      // Close modal
      onClose();
    });
  };
  
  // Get rotation interpolation
  const rotateInterpolation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Don't render anything if not visible
  if (!visible) {
    return null;
  }
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait']}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { width: modalWidth },
            { 
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient 
            colors={
              isKhatm 
                ? ['#B38728', '#D4AF37', '#FFD700'] 
                : ['#292C74', '#2A2D74', '#27276E']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  { 
                    transform: [
                      { rotate: rotateInterpolation },
                      { scale: iconScaleAnim }
                    ] 
                  }
                ]}
              >
                <Ionicons 
                  name={isKhatm ? "trophy" : "checkmark-circle"} 
                  size={48} 
                  color={isKhatm ? "#FFFFFF" : "#FFFFFF"} 
                />
              </Animated.View>
            </View>
            
            <Text style={styles.title}>{title}</Text>
          </LinearGradient>
          
          <View style={styles.contentContainer}>
            <Text style={styles.message}>{message}</Text>
            
            {streakCount > 0 && (
              <View style={styles.streakContainer}>
                <Ionicons name="flame" size={20} color={isKhatm ? "#D4AF37" : colors.primary.sky} />
                <Text style={[
                  styles.streakText,
                  isKhatm && styles.khatmStreakText
                ]}>
                  {streakCount} day streak!
                </Text>
              </View>
            )}
            
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleButtonPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isKhatm 
                      ? ['#B38728', '#D4AF37', '#FFD700'] 
                      : ['#292C74', '#2A2D74', '#72BBE1']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Continue Reading</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {isKhatm && (
            <View style={styles.confettiContainer}>
              <LottieView
                source={require('../assets/animations/confetti.json')}
                autoPlay
                loop={false}
                style={styles.confetti}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: Platform.OS === 'android' ? 8 : undefined,
  },
  modalContainer: {
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...shadows.large,
    elevation: Platform.OS === 'android' ? 24 : undefined,
    zIndex: 1001,
  },
  headerGradient: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: fonts.boldFamily,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
  },
  message: {
    fontSize: fonts.size.md,
    color: '#333',
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: fonts.primaryFamily,
    lineHeight: 22,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(114, 187, 225, 0.1)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  streakText: {
    fontSize: fonts.size.md,
    color: colors.primary.deep,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    fontFamily: fonts.boldFamily,
  },
  khatmStreakText: {
    color: '#B38728',
  },
  button: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 1002,
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
});

export default CompletionModal; 