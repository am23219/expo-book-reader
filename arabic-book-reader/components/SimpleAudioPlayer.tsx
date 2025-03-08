import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';

interface SimpleAudioPlayerProps {
  currentSection: Section;
  sections: Section[]; // Add all sections to enable full book playback
}

// This is a simplified audio player that works in Expo Go
// It simulates audio playback with mock controls
const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({ currentSection, sections }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [playFullBook, setPlayFullBook] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    sections.findIndex(section => section.id === currentSection.id)
  );
  
  // Calculate duration based on playback mode
  const sectionDuration = 180000; // Mock 3 minutes duration per section
  const fullBookDuration = sectionDuration * sections.length;
  const duration = playFullBook ? fullBookDuration : sectionDuration;
  
  // Update current section index when currentSection prop changes
  useEffect(() => {
    setCurrentSectionIndex(sections.findIndex(section => section.id === currentSection.id));
  }, [currentSection, sections]);
  
  const handlePlayPause = () => {
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
  
  // Calculate progress bar width
  const getProgressWidth = () => {
    return `${(position / duration) * 100}%`;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {playFullBook ? 'Full Book Audio' : `${currentSection.title} Audio`}
        </Text>
        
        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorText}>Manzil</Text>
          <Switch
            value={playFullBook}
            onValueChange={setPlayFullBook}
            trackColor={{ false: '#d1d1d1', true: '#E8F5EE' }}
            thumbColor={playFullBook ? '#0D8A4E' : '#f4f3f4'}
            ios_backgroundColor="#d1d1d1"
          />
          <Text style={styles.modeSelectorText}>Full Book</Text>
        </View>
      </View>
      
      {playFullBook && (
        <View style={styles.nowPlayingContainer}>
          <Ionicons name="musical-note" size={16} color="#0D8A4E" />
          <Text style={styles.nowPlayingText}>
            Now playing: {getCurrentPlayingSection()}
          </Text>
        </View>
      )}
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: getProgressWidth() }]} />
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleRewind} style={styles.button} activeOpacity={0.7}>
          <Ionicons name="play-back" size={24} color="#0D8A4E" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton} activeOpacity={0.7}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="#ffffff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleForward} style={styles.button} activeOpacity={0.7}>
          <Ionicons name="play-forward" size={24} color="#0D8A4E" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.note}>
        Note: This is a simulated player for Expo Go.{'\n'}
        Real audio playback requires a development build.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
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
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    letterSpacing: 0.3,
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modeSelectorText: {
    fontSize: 14,
    color: '#495057',
    marginHorizontal: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
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
  },
  nowPlayingText: {
    fontSize: 14,
    color: '#0D8A4E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D8A4E',
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Platform.OS === 'ios' ? 
      (Dimensions.get('window').height < 700 ? 10 : 16) : 16,
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
    marginTop: 12,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    opacity: 0.8,
  },
});

export default SimpleAudioPlayer; 