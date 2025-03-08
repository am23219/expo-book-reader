import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';

interface AudioPlayerProps {
  currentSection: Section;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentSection }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Load audio when section changes
  useEffect(() => {
    loadAudio();
    
    // Cleanup function to unload audio when component unmounts or section changes
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentSection]);
  
  // Update position every second when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(async () => {
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, sound]);
  
  const loadAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Reset state
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      
      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Adjust the path to your actual audio files
        { uri: `asset:/audio/${currentSection.audioFile}` },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
    }
  };
  
  const handlePlayPause = async () => {
    if (!sound) return;
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };
  
  const handleRewind = async () => {
    if (!sound) return;
    
    const newPosition = Math.max(0, position - 10000); // Rewind 10 seconds
    await sound.setPositionAsync(newPosition);
  };
  
  const handleForward = async () => {
    if (!sound) return;
    
    const newPosition = Math.min(duration, position + 10000); // Forward 10 seconds
    await sound.setPositionAsync(newPosition);
  };
  
  // Format time in mm:ss
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {currentSection.title} Audio
      </Text>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleRewind} style={styles.button}>
          <Ionicons name="play-back" size={24} color="#0066cc" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="#ffffff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleForward} style={styles.button}>
          <Ionicons name="play-forward" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 12,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    padding: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#6c757d',
  },
});

export default AudioPlayer; 