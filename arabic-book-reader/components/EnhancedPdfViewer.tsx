import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, Text, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Section } from '../models/Section';
import Pdf from 'react-native-pdf';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

interface EnhancedPdfViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  onError: () => void;
  currentSection: Section;
}

const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ 
  currentPage, 
  onPageChange, 
  onError,
  currentSection 
}) => {
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [pdfSource, setPdfSource] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTryingFallback, setIsTryingFallback] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  const pdfRef = useRef<any>(null);
  const pageTranslateX = useRef(new Animated.Value(0)).current;
  
  // Calculate progress percentage for progress bar
  const progressPercentage = numPages ? (currentPage / numPages) * 100 : 0;
  
  // Initialize PDF source
  useEffect(() => {
    loadPdfFromAssets();

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('PDF loading timeout - switching to fallback');
        setLoadError('Loading timed out. Please try again.');
        setIsLoading(false);
        onError(); // Call the onError callback to notify parent component
      }
    }, 10000); // 10 second timeout
    
    setLoadTimeout(timeout);
    
    return () => {
      // Clear timeout on component unmount
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, []);

  // Function to copy the PDF from assets to document directory
  const copyPdfToDocumentDirectory = async (): Promise<string | null> => {
    try {
      console.log('Copying PDF to document directory...');
      
      // First load the asset
      const asset = Asset.fromModule(require('../assets/pdf/Barakaat_Makiyyah.pdf'));
      await asset.downloadAsync();
      
      if (!asset.localUri) {
        console.log('Failed to load asset');
        return null;
      }
      
      // Define the destination path in document directory
      const destPath = `${FileSystem.documentDirectory}Barakaat_Makiyyah.pdf`;
      
      // Check if the file already exists
      const fileInfo = await FileSystem.getInfoAsync(destPath);
      if (fileInfo.exists) {
        console.log('PDF already exists in document directory');
        return destPath;
      }
      
      // Copy the file
      console.log(`Copying from ${asset.localUri} to ${destPath}`);
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: destPath
      });
      
      console.log('Successfully copied PDF to document directory');
      return destPath;
    } catch (error) {
      console.error('Error copying PDF to document directory:', error);
      return null;
    }
  };
  
  const loadPdfFromAssets = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      console.log('Attempting to load PDF...');
      
      // First try to copy the PDF to the document directory if not already there
      const docDirPath = await copyPdfToDocumentDirectory();
      if (docDirPath) {
        console.log('Using PDF from document directory:', docDirPath);
        setPdfSource({ uri: docDirPath });
        return;
      }
      
      // If the copy fails, try other methods
      
      // iOS specific paths - try these first on iOS
      if (Platform.OS === 'ios') {
        // Try multiple iOS paths
        try {
          console.log('Trying main bundle directory for iOS...');
          const asset = Asset.fromModule(require('../assets/pdf/Barakaat_Makiyyah.pdf'));
          await asset.downloadAsync();
          if (asset.localUri) {
            console.log('Asset downloaded successfully:', asset.localUri);
            setPdfSource({ uri: asset.localUri });
            return;
          }
        } catch (error) {
          console.log('Error loading from main bundle:', error);
        }
        
        // Try alternative iOS paths
        const possibleIOSPaths = [
          `${FileSystem.documentDirectory}Barakaat_Makiyyah.pdf`,
          `${FileSystem.documentDirectory}../Barakaat_Makiyyah.pdf`,
        ];
        
        for (const path of possibleIOSPaths) {
          try {
            console.log(`Checking iOS path: ${path}`);
            const fileInfo = await FileSystem.getInfoAsync(path);
            if (fileInfo.exists) {
              console.log(`Found PDF at: ${path}`);
              setPdfSource({ uri: path });
              return;
            }
          } catch (error) {
            console.log(`Error checking path ${path}:`, error);
          }
        }
        
        console.log('No PDF found in iOS paths, trying fallback');
      }
      
      // Android specific path
      if (Platform.OS === 'android') {
        try {
          console.log('Trying Android asset path...');
          setPdfSource({ uri: 'file:///android_asset/Barakaat_Makiyyah.pdf' });
          return;
        } catch (error) {
          console.log('Error with Android asset path:', error);
        }
      }
      
      // Try document directory as a general fallback
      try {
        console.log('Trying document directory as general fallback...');
        const destPath = `${FileSystem.documentDirectory}Barakaat_Makiyyah.pdf`;
        const fileInfo = await FileSystem.getInfoAsync(destPath);
        
        if (fileInfo.exists) {
          console.log('Found PDF at:', destPath);
          setPdfSource({ uri: destPath });
          return;
        }
      } catch (error) {
        console.log('Error checking document directory:', error);
      }
      
      // Try to list files in the document directory to help debug
      try {
        console.log('Listing files in document directory to debug:');
        if (FileSystem.documentDirectory) {
          const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
          console.log('Files in document directory:', files);
        } else {
          console.log('Document directory is null, cannot list files');
        }
      } catch (error) {
        console.log('Error listing files:', error);
      }
      
      // Final fallback - attempt to download from a public URL
      Alert.alert(
        "PDF Loading Error",
        "Could not load the book from local storage. Would you like to try loading a sample PDF from the web?",
        [
          {
            text: "Yes",
            onPress: () => {
              console.log('All local PDF loading attempts failed. Using web fallback.');
              setPdfSource({ 
                uri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              });
            }
          },
          {
            text: "No",
            onPress: () => {
              setLoadError('PDF loading failed. Please restart the app and try again.');
              setIsLoading(false);
              onError();
            },
            style: "cancel"
          }
        ]
      );
      
    } catch (error) {
      console.error('Critical PDF loading error:', error);
      setLoadError('Unable to load the book. Please restart the app and try again.');
      setIsLoading(false);
      onError(); // Call the onError callback to switch to fallback viewer
    }
  };
  
  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    console.log(`PDF loaded with ${numberOfPages} pages at ${filePath}`);
    setNumPages(numberOfPages);
    setIsLoading(false);
    setLoadError(null);
    // Clear the timeout since loading completed successfully
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
  };
  
  const handlePageChanged = (page: number) => {
    console.log(`PDF page changed to ${page}`);
    onPageChange(page);
  };
  
  const handleError = (error: object) => {
    console.error('Error loading PDF:', error);
    setLoadError('Failed to load the book. Please try the fallback viewer.');
    setIsLoading(false);
    // Call the onError callback to switch to fallback viewer
    onError();
  };
  
  const retryLoading = () => {
    loadPdfFromAssets();
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
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
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
      
      onPageChange(currentPage - 1);
      pdfRef.current?.setPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
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
      
      onPageChange(currentPage + 1);
      pdfRef.current?.setPage(currentPage + 1);
    }
  };
  
  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;
    if (Math.abs(translationX) < 50) {
      pageTranslateX.setValue(translationX);
    }
  };
  
  const onHandlerStateChange = (event: any) => {
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
  
  // Render error state with retry button
  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const { width, height } = Dimensions.get('window');
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header with section title and progress */}
      <View style={styles.titleBar}>
        <Text style={styles.bookTitle}>{currentSection.title}</Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        
        <Text style={styles.pageIndicator}>
          {currentPage}/{numPages || '--'}
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
              <Pdf
                ref={pdfRef}
                source={pdfSource}
                page={currentPage}
                scale={scale}
                minScale={0.5}
                maxScale={2.0}
                onLoadComplete={handleLoadComplete}
                onPageChanged={handlePageChanged}
                onError={handleError}
                onPressLink={(uri) => console.log(`Link pressed: ${uri}`)}
                style={styles.pdf}
                enablePaging={true}
                horizontal={true}
                renderActivityIndicator={(progress) => <ActivityIndicator size="large" color="#0099cc" />}
                enableRTL={true}
              />
            </Animated.View>
          </PanGestureHandler>
        )}
      
        {/* Navigation buttons - Updated to be on left and right sides */}
        <View style={styles.leftNavButtonContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.sideNavButton, currentPage <= 1 && styles.disabledButton]} 
            onPress={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <Feather name="chevron-right" size={28} color={currentPage <= 1 ? "#ccc" : "#0099cc"} />
          </TouchableOpacity>
        </View>

        <View style={styles.rightNavButtonContainer}>
          <TouchableOpacity 
            style={[styles.navButton, styles.sideNavButton, currentPage >= numPages && styles.disabledButton]} 
            onPress={goToNextPage}
            disabled={currentPage >= numPages}
          >
            <Feather name="chevron-left" size={28} color={currentPage >= numPages ? "#ccc" : "#0099cc"} />
          </TouchableOpacity>
        </View>

        {/* Bottom zoom controls */}
        <View style={styles.zoomButtonsContainer}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Feather name="zoom-in" size={22} color="#0099cc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Feather name="zoom-out" size={22} color="#0099cc" />
          </TouchableOpacity>
        </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0099cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    fontFamily: 'System',
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
  pdfContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  pdfWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height - 100,
    backgroundColor: 'white',
  },
  leftNavButtonContainer: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
    zIndex: 20,
  },
  rightNavButtonContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
    zIndex: 20,
  },
  sideNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  zoomButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  disabledButton: {
    opacity: 0.3,
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
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnhancedPdfViewer; 