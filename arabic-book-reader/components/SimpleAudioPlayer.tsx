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
      <View style={styles.modalOverlay}>
        <View style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 10) }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.expandButton} 
              onPress={toggleExpanded}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons 
                name={expanded ? "chevron-down" : "chevron-up"} 
                size={20} 
                color="#5A9EBF" 
              />
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {playFullBook ? 'Full Book Player' : `${currentSection.title}`}
            </Text>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color="#6c757d" />
            </TouchableOpacity>
          </View>
          
          {expanded && (
            <>
              <View style={styles.modeSelector}>
                <Text style={[
                  styles.modeSelectorText, 
                  !playFullBook && styles.modeSelectorTextActive
                ]}>
                  Manzil
                </Text>
                <Switch
                  value={playFullBook}
                  onValueChange={handleModeChange}
                  trackColor={{ false: '#d1d1d1', true: '#E8F5EE' }}
                  thumbColor={playFullBook ? '#5A9EBF' : '#f4f3f4'}
                  ios_backgroundColor="#d1d1d1"
                />
                <Text style={[
                  styles.modeSelectorText,
                  playFullBook && styles.modeSelectorTextActive
                ]}>
                  Full Book
                </Text>
              </View>
              
              <View style={styles.nowPlayingContainer}>
                <Ionicons name="musical-note" size={16} color="#5A9EBF" />
                <Text style={styles.nowPlayingText} numberOfLines={1}>
                  Now Playing: {getCurrentPlayingSection()}
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
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={[
            styles.controls,
            isSmallScreen && styles.controlsCompact
          ]}>
            <TouchableOpacity 
              onPress={handleRewind} 
              style={styles.button} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-back" size={isSmallScreen ? 22 : 24} color="#5A9EBF" />
            </TouchableOpacity>
            
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity 
                onPress={handlePlayPause} 
                style={[
                  styles.playButton,
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
                  <ActivityIndicator color="#ffffff" size={isSmallScreen ? 28 : 32} />
                ) : (
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={isSmallScreen ? 28 : 32} 
                    color="#ffffff" 
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <TouchableOpacity 
              onPress={handleForward} 
              style={styles.button} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-forward" size={isSmallScreen ? 22 : 24} color="#5A9EBF" />
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  expandButton: {
    padding: 4,
    marginRight: 8,
    width: 24,
  },
  closeButton: {
    padding: 4,
    width: 24,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343a40',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    letterSpacing: 0.3,
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  modeSelectorText: {
    fontSize: 16,
    color: '#6c757d',
    marginHorizontal: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  modeSelectorTextActive: {
    color: '#5A9EBF',
    fontWeight: '600',
  },
  nowPlayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90, 158, 191, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 20,
    maxWidth: '100%',
  },
  nowPlayingText: {
    fontSize: 16,
    color: '#5A9EBF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    flexShrink: 1,
  },
  progressBarContainer: {
    marginBottom: 20,
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5A9EBF',
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  controlsCompact: {
    marginVertical: 14,
  },
  button: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5A9EBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  playButtonCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    backgroundColor: '#a0c0d0',
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default SimpleAudioPlayer; 