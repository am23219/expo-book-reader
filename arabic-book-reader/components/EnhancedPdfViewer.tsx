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
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values for button press effects
  const prevButtonScale = React.useRef(new Animated.Value(1)).current;
  const nextButtonScale = React.useRef(new Animated.Value(1)).current;
  
  // Animation values for pinch to zoom
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(new Animated.Value(1)).current;

  // Min and max scale limits
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

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
      setIsNavigating(true);
      animateButton(nextButtonScale);
      onPageChange(currentPage + 1);
      
      // Reset navigation lock after animation completes
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1 && !isNavigating) {
      setIsNavigating(true);
      animateButton(prevButtonScale);
      onPageChange(currentPage - 1);
      
      // Reset navigation lock after animation completes
      setTimeout(() => {
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

  // Log for debugging
  useEffect(() => {
    console.log('Total pages:', totalPages);
    console.log('Current page:', currentPage);
    console.log('List index:', listIndex);
    console.log('First page source:', pdfPages[0]);
  }, [currentPage, totalPages]);

  // Effect to scroll to the correct page when currentPage changes
  React.useEffect(() => {
    if (flatListRef.current && listIndex >= 0 && listIndex < reversedPages.length) {
      flatListRef.current.scrollToIndex({
        index: listIndex,
        animated: true
      });
    }
  }, [currentPage, listIndex, reversedPages.length]);

  // Combine the base scale with the gesture scale
  const combinedScale = Animated.multiply(baseScale, scale);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Image Viewer */}
      <FlatList
        ref={flatListRef}
        data={reversedPages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // Temporarily remove initialScrollIndex for debugging
        // initialScrollIndex={listIndex}
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
          
          if (newPage !== currentPage) {
            onPageChange(newPage);
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
                <Animated.Image 
                  source={item} 
                  style={[
                    styles.image,
                    { transform: [{ scale: combinedScale }] }
                  ]} 
                  resizeMode="contain"
                  onError={(e) => {
                    console.error('Image loading error:', e.nativeEvent.error);
                    onError && onError();
                  }}
                />
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

          {/* Previous Page Button (right side) - moves to lower page number */}
          {currentPage > 1 && (
            <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  styles.navButtonRight
                ]}
                onPress={handlePrevPage}
                activeOpacity={0.7}
                accessibilityLabel="Previous page"
                accessibilityRole="button"
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={22} 
                  color={colors.primary.deep} 
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
              {currentPage} / {totalPages}
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
  image: { 
    width: "100%",
    height: "100%",
    resizeMode: "contain"
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
    backgroundColor: '#000000',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
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
