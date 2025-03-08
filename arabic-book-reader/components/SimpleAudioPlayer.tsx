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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SimpleAudioPlayerProps {
  currentSection: Section;
  sections: Section[]; // All sections to enable full book playback
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ currentSection, sections }) => {
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
  
  // Update current section index when currentSection prop changes
  useEffect(() => {
    setCurrentSectionIndex(sections.findIndex(section => section.id === currentSection.id));
  }, [currentSection, sections]);
  
  // Update progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: position / duration,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [position, duration]);
  
  const handlePlayPause = () => {
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
    
    setIsPlaying(!isPlaying);
    
    // If starting playback, simulate progress
    if (!isPlaying) {
      const interval = setInterval(() => {
        setPosition(prev => {
          if (prev >= duration) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1000;
        });
      }, 1000);
      
      // Store interval ID for cleanup
      return () => clearInterval(interval);
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
  
  return (
    <SafeAreaView style={styles.safeArea}>
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
              color="#0D8A4E" 
            />
          </TouchableOpacity>
          
          <Text style={styles.title}>
            {playFullBook ? 'Full Book Audio' : `${currentSection.title} Audio`}
          </Text>
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
                thumbColor={playFullBook ? '#0D8A4E' : '#f4f3f4'}
                ios_backgroundColor="#d1d1d1"
              />
              <Text style={[
                styles.modeSelectorText,
                playFullBook && styles.modeSelectorTextActive
              ]}>
                Full Book
              </Text>
            </View>
            
          </>
        )}
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
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
            <Ionicons name="play-back" size={isSmallScreen ? 22 : 24} color="#0D8A4E" />
          </TouchableOpacity>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity 
              onPress={handlePlayPause} 
              style={[
                styles.playButton,
                isSmallScreen && styles.playButtonCompact
              ]} 
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={isSmallScreen ? 28 : 32} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            onPress={handleForward} 
            style={styles.button} 
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-forward" size={isSmallScreen ? 22 : 24} color="#0D8A4E" />
          </TouchableOpacity>
        </View>
        
        {expanded && (
          <Text style={styles.note}>
            Note: This is a simulated player for Expo Go.{'\n'}
            Real audio playback requires a development build.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  expandButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#343a40',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    letterSpacing: 0.3,
    marginRight: 24, // Balance with expandButton
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  modeSelectorText: {
    fontSize: 14,
    color: '#6c757d',
    marginHorizontal: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  modeSelectorTextActive: {
    color: '#0D8A4E',
    fontWeight: '600',
  },
  nowPlayingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 138, 78, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 14,
    maxWidth: '100%',
  },
  nowPlayingText: {
    fontSize: 14,
    color: '#0D8A4E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    flexShrink: 1,
  },
  progressBarContainer: {
    marginBottom: 16,
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D8A4E',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  controlsCompact: {
    marginVertical: 10,
  },
  button: {
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D8A4E',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  playButtonCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginHorizontal: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#6c757d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    opacity: 0.8,
    marginBottom: 8,
  },
});

export default SimpleAudioPlayer; 