import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section, SECTIONS } from '../models/Section';
import { colors, fonts, shadows, radius, spacing } from '../constants/theme';

export interface PageViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  currentSection: Section;
}

const PageViewer: React.FC<PageViewerProps> = ({ currentPage, onPageChange, currentSection }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = Dimensions.get('window');
  
  // Animation values for button press effects
  const prevButtonScale = React.useRef(new Animated.Value(1)).current;
  const nextButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // Get the maximum page from the last section's endPage in the SECTIONS model
  const MAX_PAGE = SECTIONS[SECTIONS.length - 1].endPage;
  
  const animateButton = (animatedValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const handlePrevPage = () => {
    if (currentPage < MAX_PAGE) {
      animateButton(prevButtonScale);
      onPageChange(currentPage + 1);
    }
  };

  const handleNextPage = () => {
    // Use the maximum page determined from the model
    if (currentPage > 1) {
      animateButton(nextButtonScale);
      onPageChange(currentPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.deep} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageContainer}>
            <View style={styles.pageHeaderContainer}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.pageNumber}>Page {currentPage}</Text>
              </View>
            </View>
            
            <View style={styles.pageContent}>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>
                  The enhanced PDF viewer could not load the book file.
                </Text>
                <Text style={styles.placeholderSubtext}>
                  You can continue to navigate between pages using the arrows below.
                </Text>
                
                <View style={styles.pageNavigation}>
                  <View style={styles.pageNavigationInner}>
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage <= 1 && styles.disabledButton]}
                      onPress={handleNextPage}
                      disabled={currentPage <= 1}
                      activeOpacity={0.7}
                      accessibilityLabel="Next page (go to previous page number)"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: currentPage <= 1 }}
                    >
                      <Ionicons name="arrow-back" size={24} color={currentPage <= 1 ? colors.text.muted : colors.primary.deep} />
                      <Text style={[styles.pageButtonText, currentPage <= 1 && styles.disabledText]}>Previous</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.pageIndicator}>
                      <Text style={styles.pageIndicatorText}>
                        {currentPage} / {MAX_PAGE}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage >= MAX_PAGE && styles.disabledButton]}
                      onPress={handlePrevPage}
                      disabled={currentPage >= MAX_PAGE}
                      activeOpacity={0.7}
                      accessibilityLabel="Previous page (go to next page number)"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: currentPage >= MAX_PAGE }}
                    >
                      <Text style={[styles.pageButtonText, currentPage >= MAX_PAGE && styles.disabledText]}>Next</Text>
                      <Ionicons name="arrow-forward" size={24} color={currentPage >= MAX_PAGE ? colors.text.muted : colors.primary.deep} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Left navigation button with animation */}
      <View style={styles.leftNavButtonContainer}>
        <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
          <TouchableOpacity 
            style={[styles.navButton, currentPage <= 1 && styles.disabledButton]} 
            onPress={handleNextPage}
            disabled={currentPage <= 1}
            activeOpacity={0.7}
            accessibilityLabel="Next page (go to previous page number)"
            accessibilityRole="button"
            accessibilityState={{ disabled: currentPage <= 1 }}
          >
            <Ionicons 
              name="chevron-back" 
              size={28} 
              color={currentPage <= 1 ? colors.text.muted : colors.primary.sky} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Right navigation button with animation */}
      <View style={styles.rightNavButtonContainer}>
        <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
          <TouchableOpacity 
            style={[styles.navButton, currentPage >= MAX_PAGE && styles.disabledButton]} 
            onPress={handlePrevPage}
            disabled={currentPage >= MAX_PAGE}
            activeOpacity={0.7}
            accessibilityLabel="Previous page (go to next page number)"
            accessibilityRole="button"
            accessibilityState={{ disabled: currentPage >= MAX_PAGE }}
          >
            <Ionicons 
              name="chevron-forward" 
              size={28} 
              color={currentPage >= MAX_PAGE ? colors.text.muted : colors.primary.sky} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Page number indicator at bottom */}
      <View style={styles.pageNumberIndicator}>
        <View style={styles.pageNumberIndicatorInner}>
          <Text style={styles.pageNumberIndicatorText}>
            {currentPage} / {MAX_PAGE}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: fonts.size.md,
    color: colors.primary.deep,
    fontFamily: fonts.secondaryFamily,
  },
  pageContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.primary.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  pageHeaderContainer: {
    backgroundColor: colors.primary.deep,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitleContainer: {
    alignItems: 'center',
  },
  pageContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fonts.size.xl,
    fontWeight: 'bold',
    color: colors.primary.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontFamily: fonts.boldFamily,
  },
  pageNumber: {
    fontSize: fonts.size.md,
    color: colors.primary.sky,
    marginBottom: spacing.sm,
    fontFamily: fonts.secondaryFamily,
  },
  placeholderContent: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  placeholderText: {
    fontSize: fonts.size.lg,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: fonts.secondaryFamily,
  },
  placeholderSubtext: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontFamily: fonts.primaryFamily,
  },
  pageNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  pageNavigationInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.accent,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary.sky,
    ...shadows.small,
    minWidth: 110, // Give more space for touch and text
    justifyContent: 'center',
  },
  pageButtonText: {
    color: colors.primary.deep,
    marginHorizontal: spacing.xs,
    fontWeight: '500',
    fontFamily: fonts.secondaryFamily,
  },
  pageIndicator: {
    padding: spacing.sm,
  },
  pageIndicatorText: {
    color: colors.primary.deep,
    fontSize: fonts.size.md,
    fontWeight: 'bold',
    fontFamily: fonts.secondaryFamily,
  },
  disabledButton: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border,
    opacity: 0.5,
  },
  disabledText: {
    color: colors.text.muted,
  },
  leftNavButtonContainer: {
    position: 'absolute',
    left: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
  },
  rightNavButtonContainer: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.white,
    borderRadius: radius.round,
    ...shadows.small,
  },
  pageNumberIndicator: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  pageNumberIndicatorInner: {
    backgroundColor: 'rgba(42, 45, 116, 0.8)', // Semi-transparent primary deep blue
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    ...shadows.small,
  },
  pageNumberIndicatorText: {
    color: colors.primary.white,
    fontSize: fonts.size.sm,
    fontFamily: fonts.secondaryFamily,
    fontWeight: 'bold',
  },
});

export default PageViewer;
