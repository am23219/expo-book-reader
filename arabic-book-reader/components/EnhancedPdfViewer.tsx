import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Image, 
  FlatList, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Text
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pdfPages } from "../constants/pdfPages";
import { colors, fonts, spacing, radius, shadows } from "../constants/theme";
import { Section } from "../models/Section";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");

// Number of pages to preload before and after the current page
const PRELOAD_COUNT = 2;

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
  const [totalPages] = useState(pdfPages.length);
  const [showControls, setShowControls] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [pagesToPreload, setPagesToPreload] = useState<number[]>([]);
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPageRef = useRef<number>(currentPage);
  
  // Animation values for button press effects
  const prevButtonScale = React.useRef(new Animated.Value(1)).current;
  const nextButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // Animation values for pinch to zoom
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(new Animated.Value(1)).current;

  // Min and max scale limits
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  // Update pages to preload when current page changes
  useEffect(() => {
    const pagesToPreloadArray = [];
    
    // Add previous pages (up to PRELOAD_COUNT)
    for (let i = Math.max(1, currentPage - PRELOAD_COUNT); i < currentPage; i++) {
      pagesToPreloadArray.push(i);
    }
    
    // Add next pages (up to PRELOAD_COUNT)
    for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + PRELOAD_COUNT); i++) {
      pagesToPreloadArray.push(i);
    }
    
    setPagesToPreload(pagesToPreloadArray);
  }, [currentPage, totalPages]);

  // Animate button presses
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

  // For Arabic books with right-to-left reading:
  // - Next (left button): moves to higher page number
  // - Previous (right button): moves to lower page number
  const handleNextPage = () => {
    if (currentPage < totalPages && !isNavigating) {
      // Set navigation lock first to prevent multiple rapid clicks
      setIsNavigating(true);
      
      // Animate button and change page
      animateButton(nextButtonScale);
      onPageChange(currentPage + 1);
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      // Reset navigation lock after animation completes
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1 && !isNavigating) {
      // Set navigation lock first to prevent multiple rapid clicks
      setIsNavigating(true);
      
      // Animate button and change page
      animateButton(prevButtonScale);
      onPageChange(currentPage - 1);
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      // Reset navigation lock after animation completes
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }
  };

  // Handle pinch gesture
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const [lastScale, setLastScale] = useState(1);
  
  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Calculate the new base scale with limits
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, lastScale * event.nativeEvent.scale));
      setLastScale(newScale);
      baseScale.setValue(newScale);
      scale.setValue(1);
      
      // Show zoom indicator
      setShowZoomIndicator(true);
      
      // Clear any existing timeout
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      
      // Hide zoom indicator after 1.5 seconds
      zoomIndicatorTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1500);
    }
  };

  // Function to toggle controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  // Reset zoom when page changes
  useEffect(() => {
    setLastScale(1);
    baseScale.setValue(1);
    scale.setValue(1);
  }, [currentPage]);

  // FlatList reference to control scrolling programmatically
  const flatListRef = React.useRef<FlatList>(null);

  // Calculate the index for the FlatList - we reverse the data array for RTL reading
  const reversedPages = [...pdfPages].reverse();
  const listIndex = totalPages - currentPage;

  // Effect to scroll to the correct page when currentPage changes
  React.useEffect(() => {
    if (flatListRef.current && listIndex >= 0 && listIndex < reversedPages.length) {
      // Determine if this is a large page jump (e.g., navigating to a new manzil)
      const isLargeJump = Math.abs(currentPage - lastPageRef.current) > 3;
      
      // Set navigating flag to prevent multiple updates
      setIsNavigating(true);
      
      // Use a tiny timeout to ensure UI state is settled before scrolling
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: listIndex,
            animated: !isLargeJump // Only animate for small page changes
          });
        }
        
        // Update the last page reference
        lastPageRef.current = currentPage;
      }, 10);
      
      // Release the navigation lock after animation completes
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, isLargeJump ? 100 : 300);
    }
  }, [currentPage, listIndex, reversedPages.length]);

  // Combine the base scale with the gesture scale
  const combinedScale = Animated.multiply(baseScale, scale);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Calculate the adjusted page for display
  const getAdjustedPageNumber = () => {
    // If at a section boundary (start page of this section), show as page 1
    if (currentPage === currentSection.startPage) {
      return 1;
    }
    // Otherwise show as the relative page within this section
    return currentPage - currentSection.startPage + 1;
  };

  const displayPageNumber = getAdjustedPageNumber();
  const totalPagesInSection = currentSection.endPage - currentSection.startPage + 1;

  // Render preload images (hidden)
  const renderPreloadImages = () => {
    return pagesToPreload.map(pageNum => {
      const imageSource = pdfPages[pageNum - 1];
      if (!imageSource) return null;
      
      return (
        <Image
          key={`preload-${pageNum}`}
          source={imageSource}
          style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Hidden preload images */}
      {renderPreloadImages()}
      
      {/* Image Viewer */}
      <FlatList
        ref={flatListRef}
        data={reversedPages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item, index) => index.toString()}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          // Convert the index back to our page number (accounting for the reversed array)
          const newPage = totalPages - index;
          
          // Only update if page actually changed
          if (newPage !== currentPage && newPage > 0 && newPage <= totalPages) {
            // Set navigation lock
            setIsNavigating(true);
            onPageChange(newPage);
            
            // Reset navigation lock after animation completes
            if (navigationTimeoutRef.current) {
              clearTimeout(navigationTimeoutRef.current);
            }
            navigationTimeoutRef.current = setTimeout(() => {
              setIsNavigating(false);
            }, 300);
          } else {
            // Even if page didn't change, release navigation lock
            setIsNavigating(false);
          }
        }}
        renderItem={({ item }) => (
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <Animated.View style={styles.pageContainer}>
              <TouchableOpacity 
                style={styles.pageTouchable} 
                onPress={toggleControls}
                activeOpacity={1}
              >
                <Animated.View style={[
                  styles.imageContainer,
                  { transform: [{ scale: combinedScale }] }
                ]}>
                  <Image 
                    source={item} 
                    style={styles.image}
                    resizeMode="contain"
                    onError={() => {
                      console.error('Image loading error');
                      onError && onError();
                    }}
                  />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </PinchGestureHandler>
        )}
      />

      {/* Zoom Indicator */}
      {showZoomIndicator && (
        <View style={styles.zoomIndicatorContainer}>
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomIndicatorText}>
              {Math.round(lastScale * 100)}%
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons - only shown when controls are visible */}
      {showControls && (
        <View style={styles.navigationContainer} pointerEvents="box-none">
          {/* Next Page Button (left side) - moves to higher page number */}
          <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
            <TouchableOpacity 
              style={[
                styles.navButton, 
                currentPage >= totalPages ? styles.navButtonDisabled : styles.navButtonLeft
              ]}
              onPress={handleNextPage}
              disabled={currentPage >= totalPages || isNavigating}
              activeOpacity={0.7}
              accessibilityLabel="Next page"
              accessibilityRole="button"
              accessibilityState={{ disabled: currentPage >= totalPages || isNavigating }}
            >
              <Ionicons 
                name="chevron-back" 
                size={22} 
                color={currentPage >= totalPages ? "transparent" : "#505391"} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Previous Page Button (right side) - moves to lower page number */}
          {currentPage > 1 && (
            <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  styles.navButtonRight
                ]}
                onPress={handlePrevPage}
                disabled={isNavigating}
                activeOpacity={0.7}
                accessibilityLabel="Previous page"
                accessibilityRole="button"
                accessibilityState={{ disabled: isNavigating }}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={22} 
                  color="#505391" 
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      {/* Page Indicator - only shown when controls are visible */}
      {showControls && (
        <View style={styles.pageIndicator}>
          <View style={styles.pageIndicatorInner}>
            <Text style={styles.pageIndicatorText}>
              {displayPageNumber} / {totalPagesInSection}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background.primary 
  },
  pageContainer: { 
    width,
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: colors.background.primary
  },
  pageTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { 
    width: "100%",
    height: "100%",
  },
  navigationContainer: { 
    position: "absolute", 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  navButton: { 
    width: 50, 
    height: 60, 
    justifyContent: "center", 
    alignItems: "center",
  },
  navButtonLeft: { 
    borderTopRightRadius: radius.lg, 
    borderBottomRightRadius: radius.lg, 
    backgroundColor: '#ffffff',
    paddingLeft: spacing.xs,
    ...shadows.small
  },
  navButtonRight: { 
    borderTopLeftRadius: radius.lg, 
    borderBottomLeftRadius: radius.lg, 
    backgroundColor: '#ffffff',
    paddingRight: spacing.xs,
    ...shadows.small
  },
  navButtonDisabled: { 
    backgroundColor: "transparent"
  },
  pageIndicator: { 
    position: "absolute", 
    bottom: spacing.lg, 
    left: 0, 
    right: 0, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  pageIndicatorInner: {
    backgroundColor: '#505391',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  pageIndicatorText: { 
    fontSize: fonts.size.sm, 
    fontWeight: "bold", 
    color: colors.primary.white 
  },
  zoomIndicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  zoomIndicator: {
    backgroundColor: '#000000',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  zoomIndicatorText: {
    fontSize: fonts.size.md,
    fontWeight: "bold",
    color: colors.primary.white,
  },
});

export default EnhancedPdfViewer;
