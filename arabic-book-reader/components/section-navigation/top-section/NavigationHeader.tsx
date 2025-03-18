import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../../../constants/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import StreakDaysIndicator from './StreakDaysIndicator';

interface NavigationHeaderProps {
  onClose: () => void;
  currentStreak?: number;
  onStreak?: boolean;
  onStreakPress?: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ 
  onClose,
  currentStreak = 0,
  onStreak = false,
  onStreakPress
}) => {
  return (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Progress</Text>
          {currentStreak > 0 && (
            <StreakDaysIndicator 
              currentStreak={currentStreak} 
              onStreak={onStreak}
              compact={true}
              onPress={onStreakPress}
            />
          )}
        </View>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color={colors.primary.white} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(114, 187, 225, 0.1)',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fonts.size.xxl,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
    textShadowColor: 'rgba(114, 187, 225, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(114, 187, 225, 0.1)',
    borderRadius: radius.round,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(114, 187, 225, 0.2)',
  },
});

export default NavigationHeader; 