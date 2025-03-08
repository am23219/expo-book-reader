import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated, Dimensions, PanResponder } from 'react-native';

interface SimplePdfViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  currentSection: Section;
}

// This is a simplified viewer that works in Expo Go
// It simulates PDF pages with placeholder content
const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({ currentPage, onPageChange, currentSection }) => {
  const { width, height } = Dimensions.get('window');
  const scrollViewRef = useRef<ScrollView>(null);
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
  const [showPageTurnIndicator, setShowPageTurnIndicator] = useState(false);
  
  // Simulate 7 sections with placeholder pages
  const totalPages = 150;
  
  // Set up page turning animation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Detect horizontal swipe
        if (Math.abs(gestureState.dx) > 20) {
          pageFlipAnim.setValue(gestureState.dx);
          // Show the page turn indicator when swiping
          setShowPageTurnIndicator(true);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Hide the indicator when released
        setShowPageTurnIndicator(false);
        
        // Determine if we should change page based on swipe direction
        if (gestureState.dx > 100 && currentPage < totalPages) {
          // Swiped right (go to previous page in RTL)
          handlePageChange(currentPage + 1);
        } else if (gestureState.dx < -100 && currentPage > 1) {
          // Swiped left (go to next page in RTL)
          handlePageChange(currentPage - 1);
        } else {
          // If not changing page, reset animation
          Animated.spring(pageFlipAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  const handlePageChange = (newPage: number) => {
    console.log(`SimplePdfViewer handlePageChange called with newPage: ${newPage}`);
    
    if (newPage >= 1 && newPage <= totalPages) {
      // Don't change if it's the same page
      if (newPage === currentPage) {
        console.log(`Page already at ${newPage}, ignoring change`);
        return;
      }
      
      // Animate page turn
      Animated.timing(pageFlipAnim, {
        toValue: newPage > currentPage ? 100 : -100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onPageChange(newPage);
        // Reset animation after the page change is complete
        setTimeout(() => {
          pageFlipAnim.setValue(0);
        }, 50);
      });
    } else {
      console.warn(`Invalid page number: ${newPage}, must be between 1 and ${totalPages}`);
    }
  };
  
  // Update scroll position when page changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ 
        x: (totalPages - currentPage) * width, // RTL: start from the end
        animated: false 
      });
    }
  }, [currentPage, width]);
  
  // Calculate page flip animation styles
  const pageAnimStyle = {
    transform: [
      { perspective: 1200 },
      { 
        rotateY: pageFlipAnim.interpolate({
          inputRange: [-100, 0, 100],
          outputRange: ['25deg', '0deg', '-25deg']
        })
      }
    ],
    // Add a gradient shadow to simulate page folding
    shadowOpacity: pageFlipAnim.interpolate({
      inputRange: [-100, -50, 0, 50, 100],
      outputRange: [0.6, 0.3, 0.1, 0.3, 0.6]
    }),
    shadowRadius: pageFlipAnim.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: [8, 2, 8]
    }),
    // Create a folding effect with backfaceVisibility
    backfaceVisibility: 'hidden',
  };
  
  // Improve the page fold effect
  const pageFoldStyle = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: '#000',
    opacity: pageFlipAnim.interpolate({
      inputRange: [-100, -50, 0, 50, 100],
      outputRange: [0.05, 0.03, 0, 0.03, 0.05] // More subtle shadow
    }),
    left: pageFlipAnim.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: [0, width/2, width]
    }),
  };
  
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.backgroundPattern} />
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: (totalPages - currentPage) * width, y: 0 }} // RTL: start from the end
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const newPage = totalPages - Math.floor(offsetX / width); // RTL: calculate from end
          if (newPage !== currentPage) {
            handlePageChange(newPage);
          }
        }}
        style={{ width, height: height * 0.8 }}
      >
        {Array.from({ length: totalPages }).reverse().map((_, index) => {
          const pageNumber = totalPages - index;
          return (
            <Animated.View 
              key={index} 
              style={[
                styles.page, 
                { width, height: height * 0.8 },
                currentPage === pageNumber ? pageAnimStyle : {}
              ]}
            >
              {currentPage === pageNumber && <Animated.View style={pageFoldStyle} />}
              <Text style={styles.pageNumber}>Page {pageNumber}</Text>
              
              <View style={styles.contentContainer}>
                <Text style={[styles.pageContent, styles.arabicText]}>
                  هذا هو محتوى نص عربي للصفحة {pageNumber}{'\n\n'}
                  بركات مكية{'\n'}
                  منزل {Math.ceil(pageNumber / 22)}
                </Text>
                
                {/* Add a decorative element at the bottom of the page */}
                <View style={styles.pageDecoration}>
                  <View style={styles.decorativeLine} />
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
      {showPageTurnIndicator && (
        <View style={styles.pageIndicatorContainer}>
          <Text style={styles.pageIndicatorText}>
            {pageFlipAnim._value < 0 ? 'Next Page' : 'Previous Page'}
          </Text>
        </View>
      )}
      
      {/* Add a Manzil indicator */}
      <View style={styles.manzilIndicator}>
        <Text style={styles.manzilText}>
          {currentSection.title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Subtle background color
  },
  page: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 4, // Slightly rounded corners for a more polished look
  },
  pageNumber: {
    position: 'absolute',
    top: 20,
    left: 20, // RTL: page number on left side
    fontSize: 14, // Slightly smaller
    color: '#6c757d',
    fontWeight: '500', // Medium weight for better readability
    opacity: 0.8, // Subtle appearance
  },
  pageContent: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
    color: '#343a40',
  },
  arabicText: {
    fontFamily: 'System',
    fontSize: 24, // Slightly larger for better readability
    textAlign: 'right', // RTL text alignment
    writingDirection: 'rtl', // RTL writing direction
    lineHeight: 36, // Better line spacing for Arabic text
  },
  pageIndicatorContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  pageDecoration: {
    alignItems: 'center',
    marginTop: 20,
  },
  decorativeLine: {
    width: 100,
    height: 2,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: '#f8f9fa',
  },
  manzilIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manzilText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
});

export default SimplePdfViewer; 