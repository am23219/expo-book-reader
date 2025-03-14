import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';

const PDFReaderComponent = ({ pdfPath, title = "بركات مكية" }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [pdfSource, setPdfSource] = useState(null);
  const pdfRef = useRef(null);
  const pageTranslateX = useRef(new Animated.Value(0)).current;

  // Initialize PDF source
  React.useEffect(() => {
    // Try different ways to load the PDF
    const loadPDF = async () => {
      try {
        // Method 1: Try using require for bundled assets
        const source = { uri: 'bundle-assets://assets/pdf/Barakaat_Makiyyah.pdf' };
        setPdfSource(source);
      } catch (error) {
        console.error("Could not load PDF with method 1:", error);
        
        try {
          // Method 2: Try using asset://
          const source = { uri: 'asset:///assets/pdf/Barakaat_Makiyyah.pdf' };
          setPdfSource(source);
        } catch (error) {
          console.error("Could not load PDF with method 2:", error);
          
          try {
            // Method 3: Try using file path
            const fileExists = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'Barakaat_Makiyyah.pdf');
            if (fileExists.exists) {
              const source = { uri: FileSystem.documentDirectory + 'Barakaat_Makiyyah.pdf' };
              setPdfSource(source);
            } else {
              // Method 4: Final fallback - use a direct path
              setPdfSource({ uri: 'file:///android_asset/Barakaat_Makiyyah.pdf' });
            }
          } catch (finalError) {
            console.error("All PDF loading methods failed:", finalError);
          }
        }
      }
    };

    loadPDF();
  }, []);

  // Calculate progress percentage for progress bar
  const progressPercentage = numPages ? (pageNumber / numPages) * 100 : 0;

  const handleLoadComplete = (numberOfPages, filePath) => {
    console.log(`PDF loaded successfully with ${numberOfPages} pages`);
    setNumPages(numberOfPages);
    setIsLoading(false);
  };

  const handleError = (error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    // Try an alternative source if loading fails
    if (pdfSource && pdfSource.uri.includes('bundle-assets://')) {
      setPdfSource({ uri: 'file:///android_asset/Barakaat_Makiyyah.pdf' });
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      // Animate page turning right-to-left (for Arabic)
      Animated.sequence([
        Animated.timing(pageTranslateX, {
          toValue: 50,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pageTranslateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setPageNumber(pageNumber - 1);
      pdfRef.current?.setPage(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      // Animate page turning left-to-right (for Arabic)
      Animated.sequence([
        Animated.timing(pageTranslateX, {
          toValue: -50,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pageTranslateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      setPageNumber(pageNumber + 1);
      pdfRef.current?.setPage(pageNumber + 1);
    }
  };

  const zoomIn = () => {
    if (scale < 2.0) {
      setScale(scale + 0.1);
    }
  };

  const zoomOut = () => {
    if (scale > 0.5) {
      setScale(scale - 0.1);
    }
  };
  
  const onGestureEvent = (event) => {
    const { translationX } = event.nativeEvent;
    if (Math.abs(translationX) < 50) {
      pageTranslateX.setValue(translationX);
    }
  };
  
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      // Reset animation
      Animated.spring(pageTranslateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      
      // Threshold to determine if page should change
      if (translationX > 70) {
        goToPrevPage();
      } else if (translationX < -70) {
        goToNextPage();
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Title bar with book name and page progress */}
      <View style={styles.titleBar}>
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.bookTitle}>{title}</Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        
        <Text style={styles.pageIndicator}>
          {pageNumber}/{numPages || '--'}
        </Text>
        
        <TouchableOpacity style={styles.navButton}>
          <Feather name="music" size={20} color="#0099cc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.pdfContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0099cc" />
            <Text style={styles.loadingText}>تحميل الكتاب...</Text>
          </View>
        )}
        
        {pdfSource && (
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View 
              style={[
                styles.pdfWrapper,
                { transform: [{ translateX: pageTranslateX }] }
              ]}
            >
              <View style={styles.pageWithBorder}>
                <Pdf
                  ref={pdfRef}
                  source={pdfSource}
                  onLoadComplete={handleLoadComplete}
                  onError={handleError}
                  onPageChanged={(page) => setPageNumber(page)}
                  scale={scale}
                  spacing={0}
                  horizontal={false}
                  page={pageNumber}
                  enablePaging={true}
                  style={styles.pdf}
                  trustAllCerts={false}
                  renderActivityIndicator={() => <ActivityIndicator color="#0099cc" />}
                />
                
                {/* Enhanced Islamic Border Overlay - much closer to the image */}
                <View style={styles.islamicBorder}>
                  {/* Main border frame */}
                  <View style={styles.borderFrame} />
                  
                  {/* Islamic pattern trim around the edge */}
                  <View style={styles.patternTopContainer}>
                    {Array.from({ length: 15 }).map((_, i) => (
                      <View key={`top-pattern-${i}`} style={styles.patternTriangle} />
                    ))}
                  </View>
                  <View style={styles.patternRightContainer}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <View key={`right-pattern-${i}`} style={[styles.patternTriangle, styles.patternRight]} />
                    ))}
                  </View>
                  <View style={styles.patternBottomContainer}>
                    {Array.from({ length: 15 }).map((_, i) => (
                      <View key={`bottom-pattern-${i}`} style={[styles.patternTriangle, styles.patternBottom]} />
                    ))}
                  </View>
                  <View style={styles.patternLeftContainer}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <View key={`left-pattern-${i}`} style={[styles.patternTriangle, styles.patternLeft]} />
                    ))}
                  </View>
                  
                  {/* Ornamental corners */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  
                  {/* Page number badge */}
                  <View style={styles.pageNumberBadge}>
                    <Text style={styles.pageNumberText}>{pageNumber}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </PanGestureHandler>
        )}
        
        {/* Page turn buttons */}
        <TouchableOpacity 
          style={[styles.turnPageButton, styles.prevButton, pageNumber <= 1 ? styles.disabledButton : null]}
          onPress={goToPrevPage}
          disabled={pageNumber <= 1}
        >
          <Text style={styles.turnPageButtonText}>&lt;</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.turnPageButton, styles.nextButton, pageNumber >= numPages ? styles.disabledButton : null]}
          onPress={goToNextPage}
          disabled={pageNumber >= numPages}
        >
          <Text style={styles.turnPageButtonText}>&gt;</Text>
        </TouchableOpacity>
      </View>
      
      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Feather name="zoom-in" size={20} color="#0099cc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Feather name="zoom-out" size={20} color="#0099cc" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookTitle: {
    fontSize: 16,
    color: '#0099cc',
    fontWeight: '500',
    fontFamily: 'Amiri',
    marginHorizontal: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#eee',
    marginHorizontal: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0099cc',
  },
  pageIndicator: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
    marginHorizontal: 10,
  },
  navButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 22,
    color: '#0099cc',
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageWithBorder: {
    position: 'relative',
    marginVertical: 20,
    borderWidth: 15,
    borderColor: 'white',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  pdf: {
    flex: 1,
    width: width - 80,
    height: height - 200,
    backgroundColor: 'white',
  },
  islamicBorder: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  borderFrame: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 3,
    borderColor: '#0099cc',
    borderRadius: 1,
  },
  patternTopContainer: {
    position: 'absolute',
    top: 3,
    left: 30,
    right: 30,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patternRightContainer: {
    position: 'absolute',
    top: 30,
    right: 3,
    bottom: 30,
    width: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  patternBottomContainer: {
    position: 'absolute',
    bottom: 3,
    left: 30,
    right: 30,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patternLeftContainer: {
    position: 'absolute',
    top: 30,
    left: 3,
    bottom: 30,
    width: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  patternTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0099cc',
  },
  patternRight: {
    transform: [{ rotate: '90deg' }],
  },
  patternBottom: {
    transform: [{ rotate: '180deg' }],
  },
  patternLeft: {
    transform: [{ rotate: '270deg' }],
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#0099cc',
  },
  cornerTL: {
    top: 3,
    left: 3,
    borderTopWidth: 8,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 3,
    right: 3,
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 3,
    left: 3,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 3,
    right: 3,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  pageNumberBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#ffda44',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  pageNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  turnPageButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    width: 40,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10,
  },
  prevButton: {
    left: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  nextButton: {
    right: 0,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  turnPageButtonText: {
    fontSize: 24,
    color: '#0099cc',
  },
  disabledButton: {
    opacity: 0.3,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    zIndex: 20,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    fontFamily: 'Amiri',
  },
});

export default PDFReaderComponent; 