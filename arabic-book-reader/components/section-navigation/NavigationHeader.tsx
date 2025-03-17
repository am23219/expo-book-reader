import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface NavigationHeaderProps {
  onClose: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ onClose }) => {
  return (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.primary.white} />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    zIndex: 2,
  },
  title: {
    fontSize: fonts.size.xxl,
    fontWeight: 'bold',
    color: colors.primary.white,
    fontFamily: fonts.boldFamily,
  },
  closeButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.round,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
});

export default NavigationHeader; 