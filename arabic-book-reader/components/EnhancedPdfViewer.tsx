import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import Pdf from 'react-native-pdf';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

interface EnhancedPdfViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  onError?: () => void;
  currentSection: Section;
}

const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ 
  currentPage, 
  onPageChange,
  onError,
  currentSection
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const { width, height } = Dimensions.get('window');
  
  // Animation values for button press effects
  const prevButtonScale = React.useRef(new Animated.Value(1)).current;
  const nextButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // PDF source - adjust the path to your actual PDF file
  const source = require('../assets/pdf/Barakaat_Makiyyah.pdf');
  
  // Reference to the PDF component
  const pdfRef = useRef<Pdf>(null);
  
  // Flag to avoid calling onPageChange when we programmatically change the page
  const [isInternalPageChange, setIsInternalPageChange] = useState(false);
  // Flag to know that the PDF is initialized to the desired page
  const [isInitialized, setIsInitialized] = useState(false);

  // For subsequent updates (after initial load), change page if currentPage prop changes
  useEffect(() => {
    if (pdfRef.current && isInitialized) {
      setIsInternalPageChange(true);
      pdfRef.current.setPage(currentPage);
    }
  }, [currentPage, isInitialized]);
  
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
    if (currentPage > 1) {
      animateButton(prevButtonScale);
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      animateButton(nextButtonScale);
      onPageChange(currentPage + 1);
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
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading PDF: {error}</Text>
          <Text style={styles.errorHint}>
            Make sure the PDF file exists in assets/pdf/ and you're running a development build.
          </Text>
        </View>
      )}
      
      {/* Hide PDF until it's properly initialized */}
      <View style={{ flex: 1, opacity: isInitialized ? 1 : 0 }}>
        <Pdf
          ref={pdfRef}
          source={source}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`PDF loaded with ${numberOfPages} pages`);
            setLoading(false);
            setTotalPages(numberOfPages);
            
            // Determine which page to show:
            // if currentPage > 1 then open that page, otherwise default to 1
            const initialPage = currentPage && currentPage > 1 ? currentPage : 1;
            if (pdfRef.current) {
              setIsInternalPageChange(true);
              pdfRef.current.setPage(initialPage);
            }
            // Mark as initialized after setting the initial page
            setTimeout(() => {
              setIsInitialized(true);
            }, 300);
          }}
          onPageChanged={(page) => {
            console.log(`PDF page changed to: ${page}, isInternalChange: ${isInternalPageChange}`);
            if (!isInternalPageChange && isInitialized) {
              onPageChange(page);
            } else {
              // Reset the flag after handling the internal change
              setIsInternalPageChange(false);
            }
          }}
          onError={(error) => {
            console.log('PDF error:', error);
            setLoading(false);
            setError(error.toString());
            if (onError) onError();
          }}
          style={styles.pdf}
          enablePaging={true}
          horizontal={true}
          fitPolicy={2}
          spacing={0}
          renderActivityIndicator={(progress) => <ActivityIndicator size="large" color={colors.primary.deep} />}
          enableAntialiasing={true}
          trustAllCerts={false}
          enableRTL={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        {/* Left nav button with animation */}
        <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
          <TouchableOpacity 
            style={[styles.navButton, currentPage >= totalPages ? styles.navButtonDisabled : styles.navButtonLeft]}
            onPress={() => {
              if (currentPage < totalPages) {
                handleNextPage();
              }
            }}
            disabled={currentPage >= totalPages}
            activeOpacity={0.7}
            accessibilityLabel="Next page"
            accessibilityRole="button"
            accessibilityState={{ disabled: currentPage >= totalPages }}
          >
            <Ionicons 
              name="chevron-back" 
              size={22} 
              color={currentPage >= totalPages ? "transparent" : colors.primary.deep} 
            />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Right nav button with animation */}
        <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
          <TouchableOpacity 
            style={[styles.navButton, currentPage <= 1 ? styles.navButtonDisabled : styles.navButtonRight]}
            onPress={() => {
              if (currentPage > 1) {
                handlePrevPage();
              }
            }}
            disabled={currentPage <= 1}
            activeOpacity={0.7}
            accessibilityLabel="Previous page"
            accessibilityRole="button"
            accessibilityState={{ disabled: currentPage <= 1 }}
          >
            <Ionicons 
              name="chevron-forward" 
              size={22} 
              color={currentPage <= 1 ? "transparent" : colors.primary.deep} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Page number indicator */}
      <View style={styles.pageIndicator}>
        <View style={styles.pageIndicatorInner}>
          <Text style={styles.pageIndicatorText}>
            {currentPage} / {totalPages}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `rgba(255, 255, 255, 0.8)`,
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fonts.size.md,
    color: colors.primary.deep,
    fontFamily: fonts.secondaryFamily,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fonts.size.md,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontFamily: fonts.secondaryFamily,
  },
  errorHint: {
    fontSize: fonts.size.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: fonts.primaryFamily,
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  navButton: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  navButtonLeft: {
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: `rgba(255, 255, 255, 0.9)`,
    paddingLeft: spacing.xs,
  },
  navButtonRight: {
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: `rgba(255, 255, 255, 0.9)`,
    paddingRight: spacing.xs,
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicatorInner: {
    backgroundColor: 'rgba(42, 45, 116, 0.8)',
    borderRadius: radius.round,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  pageIndicatorText: {
    color: colors.primary.white,
    fontSize: fonts.size.sm,
    fontWeight: 'bold',
    fontFamily: fonts.secondaryFamily,
  },
});

export default EnhancedPdfViewer;
