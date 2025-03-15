import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch, 
  Platform, 
  Dimensions,
  Animated,
  LayoutAnimation,
  UIManager,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SimpleAudioPlayerProps {
  currentSection: Section;
  sections: Section[]; // All sections to enable full book playback
  onClose?: () => void; // Close handler
  visible: boolean; // Control visibility
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ 
  currentSection, 
  sections, 
  onClose,
  visible 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [playFullBook, setPlayFullBook] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    sections.findIndex(section => section.id === currentSection.id)
  );
  const [expanded, setExpanded] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenHeight < 700;
  
  // Calculate duration based on playback mode
  const sectionDuration = 180000; // Mock 3 minutes duration per section
  const fullBookDuration = sectionDuration * sections.length;
  const duration = playFullBook ? fullBookDuration : sectionDuration;
  
  // Add these state variables at the top with other state
  // const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add at the top with other refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset player when closed
  useEffect(() => {
    if (!visible) {
      setIsPlaying(false);
      setPosition(0);
    }
  }, [visible]);
  
  // Update current section index when currentSection prop changes
  useEffect(() => {
    setCurrentSectionIndex(sections.findIndex(section => section.id === currentSection.id));
  }, [currentSection, sections]);
  
  // Update progress animation
  useEffect(() => {
    // Only update the animation if playback is active or large position changes
    // Commenting out to fix linter error with getValue()
    /*
    if (isPlaying || Math.abs(progressAnim.getValue() - position/duration) > 0.05) {
      Animated.timing(progressAnim, {
        toValue: position / duration,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
    */
    
    // Simplified version without getValue
    Animated.timing(progressAnim, {
      toValue: position / duration,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [position, duration, isPlaying]);
  
  // Load and play the audio when the component mounts or when audio source changes
  useEffect(() => {
    // Audio functionality commented out for now
    /*
    async function loadAudio() {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        
        setIsLoading(true);
        // Determine audio source based on current section
        // const audioSource = playFullBook 
        //   ? require(`../assets/audio/full_book.mp3`) // Replace with your actual path
        //   : require(`../assets/audio/section_${currentSection.id}.mp3`); // Dynamic import
        
        // const { sound: newSound } = await Audio.Sound.createAsync(
        //   audioSource,
        //   { positionMillis: position },
        //   onPlaybackStatusUpdate
        // );
        
        // setSound(newSound);
        // setIsLoading(false);
      } catch (error) {
        console.error("Error loading audio:", error);
        setError("Failed to load audio");
        setIsLoading(false);
      }
    }
    
    loadAudio();
    
    // Cleanup
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
    */
    
    // Simplified version for now
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentSection.id, playFullBook]);
  
  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    // Audio functionality commented out for now
    /*
    if (!status.isLoaded) return;
    
    setPosition(status.positionMillis);
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
    }
    */
  };
  
  // Debug log to check component rendering
  // console.log('SimpleAudioPlayer rendering', { expanded, playFullBook, currentSection });
  
  const handlePlayPause = async () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Audio functionality commented out for now
    /*
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await sound.playAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    */
    
    // Simplified version with haptics only
    if (isPlaying) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsPlaying(!isPlaying);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // If starting playback and using the simulation approach
    if (!isPlaying) {
      intervalRef.current = setInterval(() => {
        setPosition(prev => {
          if (prev >= duration) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsPlaying(false);
            return 0;
          }
          return prev + 1000;
        });
      }, 1000);
    }
  };
  
  const handleRewind = () => {
    setPosition(Math.max(0, position - 10000)); // Rewind 10 seconds
  };
  
  const handleForward = () => {
    setPosition(Math.min(duration, position + 10000)); // Forward 10 seconds
  };
  
  // Format time in mm:ss or hh:mm:ss for longer durations
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate which section is currently playing in full book mode
  const getCurrentPlayingSection = () => {
    if (!playFullBook) return currentSection.title;
    
    const sectionIndex = Math.min(
      Math.floor(position / sectionDuration),
      sections.length - 1
    );
    return sections[sectionIndex].title;
  };
  
  // Toggle expanded/collapsed view
  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  
  // Handle mode change
  const handleModeChange = (value: boolean) => {
    // Reset position when changing modes
    setPosition(0);
    setPlayFullBook(value);
  };
  
  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 10) }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.expandCollapseButton} 
              onPress={toggleExpanded}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons 
                name={expanded ? "chevron-down" : "chevron-up"} 
                size={20} 
                color={colors.primary.white} 
              />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {playFullBook ? 'Full Book Player' : `${currentSection.title}`}
            </Text>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.secondary.indigo} />
            </TouchableOpacity>
          </View>
          
          {expanded && (
            <>
              <View style={styles.modeContainer}>
                <Text style={[
                  styles.modeText, 
                  !playFullBook && styles.modeTextActive
                ]}>
                  Manzil
                </Text>
                <Switch
                  value={playFullBook}
                  onValueChange={handleModeChange}
                  trackColor={{ false: colors.background.secondary, true: colors.primary.sky }}
                  thumbColor={playFullBook ? colors.primary.sky : colors.background.secondary}
                  ios_backgroundColor={colors.background.secondary}
                />
                <Text style={[
                  styles.modeText,
                  playFullBook && styles.modeTextActive
                ]}>
                  Full Book
                </Text>
              </View>
              
              <View style={styles.bookDetails}>
                <Text style={styles.bookSectionLabel}>
                  Now Playing:
                </Text>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {getCurrentPlayingSection()}
                </Text>
              </View>
            </>
          )}
          
          <View style={styles.progressBarContainer}>
            <View 
              style={styles.progressBar}
              accessibilityLabel={`Playback progress ${Math.round(position / duration * 100)}%`}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: Math.round(position / duration * 100)
              }}
            >
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  }) }
                ]} 
              />
            </View>
            
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={[
            styles.controlsContainer,
            isSmallScreen && styles.controlsCompact
          ]}>
            <TouchableOpacity 
              onPress={handleRewind} 
              style={styles.controlButton} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-back" size={isSmallScreen ? 22 : 24} color={colors.primary.sky} />
            </TouchableOpacity>
            
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                onPress={handlePlayPause} 
                style={[
                  styles.playPauseButton,
                  isSmallScreen && styles.playButtonCompact,
                  isLoading && styles.playButtonDisabled
                ]} 
                activeOpacity={0.7}
                disabled={isLoading}
                accessibilityLabel={isPlaying ? "Pause audio" : "Play audio"}
                accessibilityRole="button"
                accessibilityState={{ busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primary.white} size={isSmallScreen ? 28 : 32} />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={isSmallScreen ? 28 : 32} 
                    color={colors.primary.white} 
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity 
              onPress={handleForward} 
              style={styles.controlButton} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-forward" size={isSmallScreen ? 22 : 24} color={colors.primary.sky} />
            </TouchableOpacity>
          </View>
          
          {error && (
            <Text style={styles.errorText}>
              {error}
            </Text>
          )}
          
          <Text style={styles.note}>
            Audio functionality will be implemented later
          </Text>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: colors.primary.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primary.deep,
  },
  headerTitle: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.secondary.indigo,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  },
  expandCollapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.accent,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  expandCollapseText: {
    flex: 1,
    color: colors.primary.deep,
    fontSize: fonts.size.md,
    fontFamily: fonts.secondaryFamily,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    color: colors.primary.deep,
    marginBottom: spacing.sm,
    fontFamily: fonts.boldFamily,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.round,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.sky,
    borderRadius: radius.round,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timeText: {
    color: colors.text.muted,
    fontSize: fonts.size.sm,
    fontFamily: fonts.primaryFamily,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  controlButton: {
    padding: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.primary.deep,
    ...shadows.small,
  },
  playPauseButton: {
    padding: spacing.md,
    borderRadius: radius.round,
    backgroundColor: colors.primary.sky,
    ...shadows.small,
  },
  speedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  speedButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    margin: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.background.accent,
  },
  speedButtonActive: {
    backgroundColor: colors.primary.sky,
  },
  speedText: {
    color: colors.text.muted,
    fontSize: fonts.size.sm,
    fontFamily: fonts.primaryFamily,
  },
  speedTextActive: {
    color: colors.primary.deep,
    fontWeight: 'bold',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  modeText: {
    marginHorizontal: spacing.md,
    color: colors.text.primary,
    fontSize: fonts.size.sm,
    fontFamily: fonts.primaryFamily,
  },
  bookDetails: {
    backgroundColor: colors.background.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  bookSectionLabel: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    fontFamily: fonts.primaryFamily,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  note: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    opacity: 0.8,
    marginBottom: 8,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  playButtonCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.sky,
    borderRadius: radius.round,
  },
  controlsCompact: {
    marginVertical: spacing.sm,
  },
  modeTextActive: {
    color: colors.primary.sky,
    fontWeight: 'bold',
  },
});

export default SimpleAudioPlayer; 