import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  onReminderPress?: () => void;
  
  // Progress props
  currentPage: number;
  startPage: number;
  endPage: number;
  
  // Keep these for overall book stats if needed elsewhere
  totalSections?: number;
  completedSections?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onMenuPress,
  onReminderPress,
  currentPage,
  startPage,
  endPage,
  totalSections = 0,
  completedSections = 0
}) => {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate progress within the current section/manzil
  const totalPagesInSection = endPage - startPage + 1;
  const pagesReadInSection = currentPage - startPage + 1;
  const sectionProgress = totalPagesInSection > 0 ? pagesReadInSection / totalPagesInSection : 0;
  
  // Extract manzil number from subtitle if provided, or determine it from page range
  const getManzilNumber = () => {
    if (subtitle) {
      const match = subtitle.match(/Manzil (\d+)/);
      return match ? match[1] : '';
    }
    // Estimate manzil number from startPage if no subtitle provided
    return Math.ceil(startPage / 22).toString();
  };

  // Animate progress bar when page changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: sectionProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sectionProgress]);
  
  return (
    <LinearGradient 
      colors={[colors.secondary.darkNavy, colors.primary.deep]} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={colors.primary.white} />
        </TouchableOpacity>
        
        <View style={styles.centerContent}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.pageInfoContainer}>
            <View style={styles.pageInfoRow}>
              <View style={styles.pagePill}>
                <Text style={styles.pageNumber}>{pagesReadInSection}</Text>
                <Text style={styles.totalPages}>/ {totalPagesInSection}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.manzilContainer}>
                <Ionicons name="bookmark" size={14} color={colors.primary.sky} style={styles.manzilIcon} />
                <Text style={styles.manzilText}>Manzil {getManzilNumber()}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Commenting out notification button for now */}
        <View style={styles.placeHolder} />
      </View>
      
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
        <View style={styles.progressPageInfo}>
          <Text style={styles.progressPageText}>{pagesReadInSection}/{totalPagesInSection}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    ...shadows.medium,
    zIndex: 10,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
    shadowColor: colors.effects.glow,
  },
  reminderButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  placeHolder: {
    width: 42,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    color: colors.primary.white,
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(114, 187, 225, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  pageInfoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.round,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.effects.glow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pagePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumber: {
    color: colors.primary.white,
    fontSize: fonts.size.md,
    fontFamily: fonts.boldFamily,
    fontWeight: 'bold',
  },
  totalPages: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fonts.size.xs,
    fontFamily: fonts.primaryFamily,
    marginLeft: 2,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.sm,
  },
  manzilContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manzilIcon: {
    marginRight: spacing.xs / 2,
  },
  manzilText: {
    color: colors.primary.white,
    fontSize: fonts.size.sm,
    fontFamily: fonts.primaryFamily,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.round,
    overflow: 'hidden',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xs,
    position: 'relative',
    shadowColor: colors.effects.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.sky,
    borderRadius: radius.round,
  },
  progressPageInfo: {
    position: 'absolute',
    right: -spacing.sm,
    top: -spacing.md - 2,
    backgroundColor: colors.primary.sky,
    borderRadius: radius.round,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    ...shadows.small,
    shadowColor: colors.effects.glow,
  },
  progressPageText: {
    color: colors.secondary.darkNavy,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: fonts.boldFamily,
  },
});

export default Header; 