import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Section } from '../models/Section';
import SimpleAudioPlayer from './SimpleAudioPlayer';
import { colors, radius, shadows } from '../constants/theme';

interface AudioModalProps {
  visible: boolean;
  onClose: () => void;
  currentSection: Section;
  sections: Section[];
}

/**
 * Modal component for audio playback
 */
const AudioModal: React.FC<AudioModalProps> = ({
  visible,
  onClose,
  currentSection,
  sections
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.audioModalContainer}>
        <SimpleAudioPlayer 
          onClose={onClose}
          currentSection={currentSection}
          sections={sections}
          visible={visible}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  audioModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.primary.white,
    borderRadius: radius.lg,
    ...shadows.large,
    overflow: 'hidden',
  },
});

export default AudioModal; 