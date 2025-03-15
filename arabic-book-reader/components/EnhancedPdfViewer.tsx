import React, { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  Animated, 
  PanResponder, 
  Platform,
  StatusBar,
  Easing
} from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Section } from '../models/Section';
import { Feather } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue, withSpring } from 'react-native-reanimated';

interface EnhancedPdfViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  onError: () => void;
  currentSection: Section;
}

// Extended interface for the PDF component to access internal properties
interface ExtendedPdf extends Pdf {
  _document?: any;
}

const PDF_SOURCE = require('../assets/pdf/Barakaat_Makiyyah.pdf');
const DEFAULT_PAGE_COUNT = 150;
// Define how many pages to preload before and after current page
const PRELOAD_PAGES_AHEAD = 3;
const PRELOAD_PAGES_BEHIND = 1;

// Define viewer state interface
interface PdfViewerState {
  numPages: number;
  isLoading: boolean;
  pdfSource: any;
  loadError: string | null;
  isAnimating: boolean;
  displayedPage: number;
  isControlsVisible: boolean;
  userInteracted: boolean;
  preloadedPages: Set<number>;
  isPreloading: boolean;
}

// Define action types
type ViewerAction = 
  | { type: 'SET_PDF_SOURCE'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE_COUNT'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ANIMATING'; payload: boolean }
  | { type: 'TOGGLE_CONTROLS'; payload?: boolean }
  | { type: 'SET_USER_INTERACTION'; payload: boolean }
  | { type: 'UPDATE_PRELOADED_PAGES'; payload: Set<number> }
  | { type: 'SET_PRELOADING'; payload: boolean }
  | { type: 'RESET_STATE'; payload?: { currentPage: number } };

// Reducer function
const viewerReducer = (state: PdfViewerState, action: ViewerAction): PdfViewerState => {
  switch (action.type) {
    case 'SET_PDF_SOURCE':
      return { ...state, pdfSource: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, loadError: action.payload, isLoading: false };
    case 'SET_PAGE_COUNT':
      return { ...state, numPages: action.payload };
    case 'SET_CURRENT_PAGE':
      return { ...state, displayedPage: action.payload };
    case 'SET_ANIMATING':
      return { ...state, isAnimating: action.payload };
    case 'TOGGLE_CONTROLS':
      return { 
        ...state, 
        isControlsVisible: action.payload !== undefined ? action.payload : !state.isControlsVisible 
      };
    case 'SET_USER_INTERACTION':
      return { ...state, userInteracted: action.payload };
    case 'UPDATE_PRELOADED_PAGES':
      return { ...state, preloadedPages: action.payload };
    case 'SET_PRELOADING':
      return { ...state, isPreloading: action.payload };
    case 'RESET_STATE':
      return { 
        ...state, 
        isLoading: true,
        pdfSource: null,
        loadError: null,
        preloadedPages: new Set([action.payload?.currentPage || 1]),
        isPreloading: false
      };
    default:
      return state;
  }
};

// Extract utility functions outside the component
// Helper function to ensure PDF is accessible in Android
const ensurePdfInDocumentDirectory = async (): Promise<string | null> => {
  try {
    const fileName = 'Barakaat_Makiyyah.pdf';
    const destPath = `${FileSystem.documentDirectory}${fileName}`;
    
    const fileInfo = await FileSystem.getInfoAsync(destPath);
    
    if (fileInfo.exists) {
      return destPath;
    }
    
    if (Platform.OS === 'android') {
      const asset = Asset.fromModule(PDF_SOURCE);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        const sourceUri = asset.localUri.startsWith('file://') 
          ? asset.localUri.substring(7) 
          : asset.localUri;
          
        await FileSystem.copyAsync({
          from: sourceUri,
          to: destPath
        });
        
        const newFileInfo = await FileSystem.getInfoAsync(destPath);
        if (newFileInfo.exists) {
          return destPath;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in ensurePdfInDocumentDirectory:', error);
    return null;
  }
};

// Utility function for animations
const createTimingAnimation = (
  animValue: Animated.Value, 
  toValue: number, 
  duration: number, 
  easing = Easing.bezier(0.25, 0.1, 0.25, 1)
): Animated.CompositeAnimation => {
  return Animated.timing(animValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

// Create a reusable error component
const PdfErrorView = ({ errorMessage, onRetry }: { errorMessage: string, onRetry: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Unable to Load Book</Text>
    <Text style={styles.errorText}>{errorMessage}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Feather name="refresh-cw" size={20} color="white" style={styles.retryIcon} />
      <Text style={styles.retryButtonText}>Retry Loading</Text>
    </TouchableOpacity>
  </View>
);

// Create a reusable loading component
const PdfLoadingView = () => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#0099cc" />
    <Text style={styles.loadingText}>تحميل الكتاب...</Text>
  </View>
);

const EnhancedPdfViewer: React.FC<EnhancedPdfViewerProps> = ({ 
  currentPage, 
  onPageChange, 
  onError,
  currentSection 
}) => {
  // References for animations and PDF component
  const pdfRef = useRef<Pdf>(null);
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
  const pageTurnOpacity = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  
  // Initialize state with reducer
  const [viewerState, dispatch] = useReducer(viewerReducer, {
    numPages: DEFAULT_PAGE_COUNT,
    isLoading: true,
    pdfSource: null,
    loadError: null,
    isAnimating: false,
    displayedPage: currentPage,
    isControlsVisible: true,
    userInteracted: false,
    preloadedPages: new Set([currentPage]),
    isPreloading: false
  });
  
  // Destructure state for easier access
  const {
    numPages,
    isLoading,
    pdfSource,
    loadError,
    isAnimating,
    displayedPage,
    isControlsVisible,
    userInteracted,
    preloadedPages,
    isPreloading
  } = viewerState;
  
  // Reference to PDF container for preloading
  const preloadPdfRefs = useRef<{[key: number]: Pdf | null}>({});
  // Track the main PDF document reference
  const pdfDocumentRef = useRef<any>(null);
  
  // Get safe area insets for proper UI positioning
  const insets = useSafeAreaInsets();
  
  // Calculate progress percentage for progress bar
  const progressPercentage = (currentPage / numPages) * 100;
  
  // Initialize PDF source
  useEffect(() => {
    initializePdfSource();
    
    // Hide controls after 3 seconds of inactivity
    const controlsTimer = setTimeout(() => {
      if (userInteracted) return;
      fadeOutControls();
    }, 3000);
    
    return () => clearTimeout(controlsTimer);
  }, []);

  // Synchronize displayed page with current page from props
  useEffect(() => {
    if (!isAnimating) {
      dispatch({ type: 'SET_CURRENT_PAGE', payload: currentPage });
    }
    
    // Trigger preloading whenever the current page changes, but only if not animating
    // This prevents too many concurrent preload operations
    if (!isAnimating && !isPreloading) {
      preloadAdjacentPages(currentPage);
    }
  }, [currentPage, isAnimating, isPreloading, dispatch]);
  
  // Preload adjacent pages to ensure smooth navigation
  const preloadAdjacentPages = useCallback((pageNum: number) => {
    if (!pdfSource || isLoading || isPreloading) return;
    
    // Set preloading lock to prevent concurrent operations
    dispatch({ type: 'SET_PRELOADING', payload: true });
    
    const pagesToPreload: number[] = [];
    
    // Limit to 1 page at a time to reduce pressure on the PDF renderer
    // Priority: next page first, then previous page
    
    // Next page (higher priority for reading flow)
    if (pageNum < numPages && !preloadedPages.has(pageNum + 1)) {
      pagesToPreload.push(pageNum + 1);
    }
    // Previous page
    else if (pageNum > 1 && !preloadedPages.has(pageNum - 1)) {
      pagesToPreload.push(pageNum - 1);
    }
    // If both surrounding pages are loaded, try to load further ahead
    else if (pageNum + 2 <= numPages && !preloadedPages.has(pageNum + 2)) {
      pagesToPreload.push(pageNum + 2);
    }
    
    // Update the preloaded pages set with a delay to allow the current animation to complete
    if (pagesToPreload.length > 0) {
      setTimeout(() => {
        const newPreloadedPages = new Set(preloadedPages);
        pagesToPreload.forEach(page => newPreloadedPages.add(page));
        dispatch({ type: 'UPDATE_PRELOADED_PAGES', payload: newPreloadedPages });
        
        // Release preloading lock after a delay to ensure rendering has time to complete
        setTimeout(() => {
          dispatch({ type: 'SET_PRELOADING', payload: false });
        }, 200);
      }, 100);
    } else {
      // No pages to preload, release lock immediately
      dispatch({ type: 'SET_PRELOADING', payload: false });
    }
  }, [numPages, pdfSource, isLoading, preloadedPages, dispatch]);
  
  // Clean up preloaded pages when they're no longer needed
  useEffect(() => {
    // Limit the number of preloaded pages to avoid memory issues
    if (preloadedPages.size > 5) {
      const currentPageSet = new Set([
        currentPage, 
        Math.min(currentPage + 1, numPages), 
        Math.max(currentPage - 1, 1)
      ]);
      
      // Keep only the pages that are currently relevant
      const newPreloadedPages = new Set<number>();
      preloadedPages.forEach(page => {
        if (currentPageSet.has(page) || Math.abs(page - currentPage) <= 2) {
          newPreloadedPages.add(page);
        } else {
          // Clear reference to help garbage collection
          preloadPdfRefs.current[page] = null;
        }
      });
      
      dispatch({ type: 'UPDATE_PRELOADED_PAGES', payload: newPreloadedPages });
    }
  }, [currentPage, preloadedPages, numPages, dispatch]);
  
  // Extract preloaded pages rendering into a separate memoized function
  const renderPreloadedPages = useCallback(() => {
    if (!pdfSource || isAnimating) return null;
    
    // Only preload the next page to minimize rendering overhead
    const pagesToShow = Array.from(preloadedPages).filter(
      page => page !== displayedPage && (page === displayedPage + 1 || page === displayedPage - 1)
    );
    
    if (pagesToShow.length === 0) return null;
    
    // Only render one preloaded page at a time to avoid overloading the renderer
    const pageToPreload = pagesToShow[0];
    
    return (
      <View key={`preload-pdf-${pageToPreload}`} style={styles.preloadContainer}>
        <Pdf
          ref={ref => (preloadPdfRefs.current[pageToPreload] = ref)}
          source={pdfSource}
          page={pageToPreload}
          scale={1.0}
          horizontal={true}
          enableRTL={true}
          singlePage={true}
          style={styles.preloadPdf}
          enablePaging={false}
          spacing={0}
          onLoadComplete={() => {
            console.log(`Preloaded page ${pageToPreload}`);
          }}
          onError={(error) => {
            console.log(`Error preloading page ${pageToPreload}:`, error);
            // Remove from preloaded pages if there was an error
            const newPreloadedPages = new Set(preloadedPages);
            newPreloadedPages.delete(pageToPreload);
            dispatch({ type: 'UPDATE_PRELOADED_PAGES', payload: newPreloadedPages });
          }}
        />
      </View>
    );
  }, [pdfSource, isAnimating, preloadedPages, displayedPage, dispatch]);
  
  // Hide controls after period of inactivity
  useEffect(() => {
    if (userInteracted) {
      // Reset the timer when user interacts
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_USER_INTERACTION', payload: false });
        fadeOutControls();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [userInteracted, dispatch]);
  
  // Use refactored animation utilities for fadeInControls
  const fadeInControls = useCallback(() => {
    createTimingAnimation(controlsOpacity, 1, 200).start(() => {
      dispatch({ type: 'TOGGLE_CONTROLS', payload: true });
    });
  }, [controlsOpacity, dispatch]);
  
  // Use refactored animation utilities for fadeOutControls
  const fadeOutControls = useCallback(() => {
    createTimingAnimation(controlsOpacity, 0, 200).start(() => {
      dispatch({ type: 'TOGGLE_CONTROLS', payload: false });
    });
  }, [controlsOpacity, dispatch]);

  // Use refactored animation utilities for resetPageAnimation
  const resetPageAnimation = useCallback(() => {
    Animated.parallel([
      createTimingAnimation(pageFlipAnim, 0, 180),
      createTimingAnimation(pageTurnOpacity, 0, 100)
    ]).start();
  }, [pageFlipAnim, pageTurnOpacity]);

  // Handle user interaction - memoize with useCallback
  const handleInteraction = useCallback(() => {
    dispatch({ type: 'SET_USER_INTERACTION', payload: true });
    if (!isControlsVisible) {
      fadeInControls();
    }
  }, [isControlsVisible, fadeInControls, dispatch]);

  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      // Immediately claim the touch when it starts
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      
      // Try to become the responder when the user moves their finger
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Horizontal movement detection - reduced threshold for better responsiveness
        return Math.abs(gestureState.dx) > 1 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Aggressive horizontal capture to override the PDF's native gestures
        return Math.abs(gestureState.dx) > 3; // Reduced from 5 for better responsiveness
      },
      
      // User has granted permission to start the gesture
      onPanResponderGrant: () => {
        handleInteraction();
        
        // Ensure animation values start at zero
        pageFlipAnim.setValue(0);
        pageTurnOpacity.setValue(0);
      },
      
      // User is actively moving their finger
      onPanResponderMove: (_, gestureState) => {
        // Only allow panning if not currently animating
        if (!isAnimating) {
          // For RTL reading: 
          // - Swipe left (negative dx) = next page (move forward)
          // - Swipe right (positive dx) = previous page (move backward)
          
          const absX = Math.abs(gestureState.dx);
          
          // Linear movement with very slight damping for more natural feel
          // Use a lower division factor to decrease resistance
          const damping = 1.5; // Reduced from implicit tanh calculation
          const resistance = Math.min(absX / damping, 50); // Cap at 50 for stability
          const newValue = gestureState.dx > 0 ? resistance : -resistance;
          
          pageFlipAnim.setValue(newValue);
          
          // Calculate opacity for the page turn shadow effect (softer shadow)
          const opacityValue = Math.min(Math.abs(newValue) / 55, 0.25);
          pageTurnOpacity.setValue(opacityValue);
        }
      },
      
      // User lifted their finger
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating) return;
        
        // Even lower threshold for swipe detection to make page turns smoother
        const THRESHOLD = 3; // Reduced for better responsiveness
        const velocity = Math.abs(gestureState.vx);
        
        // More sensitive velocity detection for natural-feeling page turns
        if (gestureState.dx > THRESHOLD || (gestureState.dx > 0 && velocity > 0.12)) {
          // Swipe right - go to previous page
          if (currentPage > 1) {
            animatePageTurn('prev');
          } else {
            // Bounce back animation for first page
            resetPageAnimation();
          }
        } else if (gestureState.dx < -THRESHOLD || (gestureState.dx < 0 && velocity > 0.15)) {
          // Swipe left - go to next page
          if (currentPage < numPages) {
            animatePageTurn('next');
          } else {
            // Bounce back animation for last page
            resetPageAnimation();
          }
        } else {
          // Reset animation if threshold not reached
          resetPageAnimation();
        }
      },
      
      // Don't let other elements claim the touch
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Fix the animatePageTurn function with proper structure and dependencies
  const animatePageTurn = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating) return;
    
    const canGoNext = direction === 'next' && currentPage < numPages;
    const canGoPrev = direction === 'prev' && currentPage > 1;
    
    if (!canGoNext && !canGoPrev) {
      // Cannot turn page in this direction, bounce back animation
      resetPageAnimation();
      return;
    }
    
    // Set animating state to prevent multiple animations
    dispatch({ type: 'SET_ANIMATING', payload: true });
    
    // Calculate target page
    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    
    console.log(`ANIMATE: Setting page to ${targetPage}`);
    
    // Check if the page is already preloaded
    const isPagePreloaded = preloadedPages.has(targetPage);
    console.log(`Page ${targetPage} preloaded status: ${isPagePreloaded}`);
    
    // Animation configurations for better organization
    const animConfig = {
      // For RTL reading:
      // Next page (swipe left): negative animation value
      // Previous page (swipe right): positive animation value
      firstPhase: {
        value: direction === 'next' ? -50 : 50,
        duration: 120,
        shadowOpacity: 0.25
      },
      secondPhase: {
        value: direction === 'next' ? 35 : -35, // Starting position for incoming page
        duration: 180,
        shadowDuration: 90
      },
      delay: isPagePreloaded ? 10 : 20
    };
    
    // First phase: animate current page out
    Animated.parallel([
      createTimingAnimation(
        pageFlipAnim, 
        animConfig.firstPhase.value, 
        animConfig.firstPhase.duration, 
        Easing.bezier(0.42, 0, 0.58, 1)
      ),
      createTimingAnimation(
        pageTurnOpacity, 
        animConfig.firstPhase.shadowOpacity, 
        animConfig.firstPhase.duration * 0.67
      ),
    ]).start(() => {
      // Update displayed page immediately for a smoother transition
      dispatch({ type: 'SET_CURRENT_PAGE', payload: targetPage });
      
      try {
        // Force the PDF component to update to the new page
        if (pdfRef.current) {
          pdfRef.current.setPage(targetPage);
        }
        
        // Reset animation position for incoming page
        setTimeout(() => {
          // Set starting position for the incoming page
          pageFlipAnim.setValue(animConfig.secondPhase.value);
          
          // Second phase: bring in the new page
          Animated.parallel([
            createTimingAnimation(
              pageFlipAnim, 
              0, 
              animConfig.secondPhase.duration
            ),
            createTimingAnimation(
              pageTurnOpacity, 
              0, 
              animConfig.secondPhase.shadowDuration
            ),
          ]).start(() => {
            // Update the actual page state and end animation sequence
            onPageChange(targetPage);
            dispatch({ type: 'SET_ANIMATING', payload: false });
            
            // Wait to ensure the current animation is fully complete before preloading
            setTimeout(() => {
              if (!isPreloading) {
                preloadAdjacentPages(targetPage);
              }
            }, 100);
          });
        }, animConfig.delay);
      } catch (error) {
        console.error('Error during page transition:', error);
        // Recover from error by ending animation state
        dispatch({ type: 'SET_ANIMATING', payload: false });
        onPageChange(targetPage);
      }
    });
  }, [
    currentPage, 
    numPages, 
    isAnimating, 
    onPageChange, 
    preloadedPages, 
    preloadAdjacentPages, 
    isPreloading, 
    dispatch, 
    pageFlipAnim, 
    pageTurnOpacity, 
    resetPageAnimation
  ]);

  // Initialize PDF source with platform-specific handling - memoize with useCallback
  const initializePdfSource = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear any existing preloaded pages and references when loading a new document
      dispatch({ type: 'UPDATE_PRELOADED_PAGES', payload: new Set([currentPage]) });
      preloadPdfRefs.current = {};
      pdfDocumentRef.current = null;
      
      if (Platform.OS === 'android') {
        const documentPath = await ensurePdfInDocumentDirectory();
        if (documentPath) {
          const uri = documentPath.startsWith('file://') 
            ? documentPath 
            : `file://${documentPath}`;
          
          console.log(`Setting PDF source: ${uri}`);
          dispatch({ type: 'SET_PDF_SOURCE', payload: { uri } });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      }

      // For iOS and other platforms
      const asset = Asset.fromModule(PDF_SOURCE);
      await asset.downloadAsync();
      
      if (asset.localUri) {
        const uri = asset.localUri.startsWith('file://') 
          ? asset.localUri 
          : `file://${asset.localUri}`;
        dispatch({ type: 'SET_PDF_SOURCE', payload: { uri } });
      } else {
        dispatch({ type: 'SET_PDF_SOURCE', payload: PDF_SOURCE });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error initializing PDF source:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Unable to load the book. Please restart the app.' });
      onError();
    }
  }, [currentPage, dispatch, onError]);
  
  // Handle PDF load completion - memoize with useCallback
  const handleLoadComplete = useCallback((numberOfPages: number) => {
    console.log(`PDF loaded with ${numberOfPages} pages`);
    
    if (numberOfPages > 0) {
      dispatch({ type: 'SET_PAGE_COUNT', payload: numberOfPages });
      
      // Validate current page is within range
      if (currentPage > numberOfPages) {
        onPageChange(1);
      }
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [currentPage, dispatch, onPageChange]);
  
  // Render PDF view for the current page
  const renderPdfView = () => {
    if (!pdfSource) return null;
    
    return (
      <View style={{ flex: 1 }}>
        <Pdf
          ref={pdfRef}
          key={`pdf-page-${displayedPage}`}
          source={pdfSource}
          page={displayedPage}
          scale={1.0}
          minScale={0.5}
          maxScale={2.0}
          onLoadComplete={(numberOfPages, filePath, { width, height }, tableContents) => {
            handleLoadComplete(numberOfPages);
            // Store a reference to the PDF document to prevent it being garbage collected
            if (pdfRef.current) {
              const extendedPdf = pdfRef.current as unknown as ExtendedPdf;
              if (extendedPdf._document) {
                pdfDocumentRef.current = extendedPdf._document;
              }
            }
          }}
          onError={handleError}
          style={styles.pdf}
          horizontal={true}
          enablePaging={false} // Disable native paging to use our custom animations
          enableRTL={true}
          singlePage={true}
          trustAllCerts={false}
          enableAntialiasing={true}
          spacing={0} // Remove spacing between pages
          renderActivityIndicator={(progress: number) => (
            <View style={{opacity: 0}} />
          )} // Hide default loading indicator
          onPageChanged={(page) => {
            if (isAnimating) {
              console.log(`IGNORED: PDF component reported page change to ${page} (animation in progress)`);
              return;
            }
            
            // Calculate the actual page number - the PDF component starts from 1
            // but may have a different ordering based on RTL settings
            let newPage;
            if (Platform.OS === 'ios') {
              // iOS uses 0-indexed pages and requires different calculation
              newPage = numPages - page;
            } else {
              // Android behavior
              newPage = numPages - page + 1;
            }
            
            // Ensure page is within valid range
            newPage = Math.max(1, Math.min(newPage, numPages));
            
            if (newPage !== displayedPage) {
              console.log(`ACCEPTED: PDF component reported page change to ${newPage}`);
              dispatch({ type: 'SET_CURRENT_PAGE', payload: newPage });
              onPageChange(newPage);
              
              // Delay preloading to avoid rendering issues
              setTimeout(() => {
                if (!isPreloading) {
                  preloadAdjacentPages(newPage);
                }
              }, 100);
            } else {
              console.log(`IGNORED: PDF component reported duplicate page change to ${newPage}`);
            }
          }}
          onPageSingleTap={() => {
            handleInteraction();
            if (!isControlsVisible) {
              fadeInControls();
            } else {
              fadeOutControls();
            }
          }}
        />
        {/* Transparent overlay to ensure our pan responder gets priority */}
        <View 
          style={StyleSheet.absoluteFillObject} 
          pointerEvents="box-none"
        />
      </View>
    );
  };
  
  // Handle PDF loading errors - memoize with useCallback
  const handleError = useCallback((error: any) => {
    const errorMessage = error instanceof Error ? error.message : 
                         typeof error === 'string' ? error : 
                         'Failed to load the book. Please restart the app.';
    
    console.error('PDF loading error:', errorMessage);
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    onError();
  }, [dispatch, onError]);
  
  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up all PDF resources when component unmounts
      console.log('Cleaning up PDF resources');
      preloadPdfRefs.current = {};
      pdfDocumentRef.current = null;
      
      // Force garbage collection by clearing references
      if (pdfRef.current) {
        // @ts-ignore - Access internal methods for cleanup
        if (typeof pdfRef.current.unloadDocument === 'function') {
          try {
            // @ts-ignore
            pdfRef.current.unloadDocument();
          } catch (e) {
            console.error('Error unloading PDF document:', e);
          }
        }
      }
    };
  }, []);
  
  // Render main component with better loading/error states
  if (loadError) {
    return <PdfErrorView errorMessage={loadError} onRetry={initializePdfSource} />;
  }
  
  return (
    <View 
      style={styles.container} 
      onTouchStart={handleInteraction}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Top navigation bar */}
      <Animated.View style={[styles.titleBar, { opacity: controlsOpacity }]}>
        <Text style={styles.bookTitle}>{currentSection.title}</Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} 
          />
        </View>
        
        <Text style={styles.pageIndicator}>
          {currentPage}/{numPages}
        </Text>
      </Animated.View>
      
      {/* Main PDF container */}
      <View style={styles.pdfContainer}>
        {isLoading && <PdfLoadingView />}
        
        {/* Hidden container for preloaded pages */}
        <View style={styles.preloadContainer}>
          {renderPreloadedPages()}
        </View>
        
        <View style={styles.pdfViewport} pointerEvents="box-none">
          {pdfSource && (
            <Animated.View 
              style={[
                styles.pdfWrapper,
                { 
                  transform: [{ translateX: pageFlipAnim }] 
                }
              ]}
              {...panResponder.panHandlers}
            >
              {renderPdfView()}
              
              {/* Page turn shadow effect - fixed to use transform instead of position properties */}
              <Animated.View 
                style={[
                  styles.pageTurnShadow,
                  {
                    opacity: pageTurnOpacity,
                    transform: [
                      {
                        translateX: pageFlipAnim.interpolate({
                          inputRange: [-40, 0, 40],
                          outputRange: [-15, 0, 15],  // Reduced for subtler effect
                          extrapolate: 'clamp'  // Prevent overshooting
                        })
                      }
                    ],
                    borderTopLeftRadius: pageFlipAnim.interpolate({
                      inputRange: [-40, 0, 40],
                      outputRange: [10, 0, 0],  // Increased for smoother curve
                      extrapolate: 'clamp'  // Prevent overshooting
                    }),
                    borderBottomLeftRadius: pageFlipAnim.interpolate({
                      inputRange: [-40, 0, 40],
                      outputRange: [10, 0, 0],  // Increased for smoother curve
                      extrapolate: 'clamp'  // Prevent overshooting
                    }),
                    borderTopRightRadius: pageFlipAnim.interpolate({
                      inputRange: [-40, 0, 40], 
                      outputRange: [0, 0, 10],  // Increased for smoother curve
                      extrapolate: 'clamp'  // Prevent overshooting
                    }),
                    borderBottomRightRadius: pageFlipAnim.interpolate({
                      inputRange: [-40, 0, 40],
                      outputRange: [0, 0, 10],  // Increased for smoother curve
                      extrapolate: 'clamp'  // Prevent overshooting
                    }),
                  }
                ]}
              />
            </Animated.View>
          )}
        </View>
        
        {/* Side navigation buttons */}
        <Animated.View 
          style={[
            styles.navigationButtons, 
            { opacity: controlsOpacity }
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.prevPageButton, 
              currentPage <= 1 && styles.disabledButton
            ]} 
            onPress={() => {
              if (currentPage > 1 && !isAnimating) {
                handleInteraction();
                animatePageTurn('prev');
              }
            }}
            disabled={currentPage <= 1 || isAnimating}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={28} color={currentPage <= 1 ? "#ccc" : "#0099cc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.nextPageButton, 
              currentPage >= numPages && styles.disabledButton
            ]} 
            onPress={() => {
              if (currentPage < numPages && !isAnimating) {
                handleInteraction();
                animatePageTurn('next');
              }
            }}
            disabled={currentPage >= numPages || isAnimating}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={28} color={currentPage >= numPages ? "#ccc" : "#0099cc"} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Bottom controls panel */}
        <Animated.View style={[styles.bottomControls, { 
          paddingBottom: Math.max(insets.bottom, 10),
          opacity: controlsOpacity,
        }]}>
          <TouchableOpacity 
            style={styles.bottomNavButton}
            onPress={() => {
              // Implementation for audio feature
              handleInteraction();
            }}
          >
            <Feather name="headphones" size={20} color="#0099cc" />
          </TouchableOpacity>
          
          <View style={styles.pageJumpContainer}>
            <TouchableOpacity 
              style={styles.pageJumpButton}
              onPress={() => {
                handleInteraction();
                if (currentPage > 5 && !isAnimating) {
                  onPageChange(currentPage - 5);
                }
              }}
              disabled={currentPage <= 5 || isAnimating}
            >
              <Feather name="rewind" size={20} color={currentPage <= 5 ? "#ccc" : "#0099cc"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.pageJumpButton}
              onPress={() => {
                handleInteraction();
                if (currentPage < numPages - 5 && !isAnimating) {
                  onPageChange(currentPage + 5);
                }
              }}
              disabled={currentPage >= numPages - 5 || isAnimating}
            >
              <Feather name="fast-forward" size={20} color={currentPage >= numPages - 5 ? "#ccc" : "#0099cc"} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  errorTitle: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#0099cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryIcon: {
    marginRight: 8,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  bookTitle: {
    fontSize: 16,
    color: '#0099cc',
    fontWeight: '600',
    maxWidth: '35%',
    marginHorizontal: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#eee',
    marginHorizontal: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0099cc',
    borderRadius: 4,
  },
  pageIndicator: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    marginHorizontal: 8,
    minWidth: 50,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdfViewport: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
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
  pageTurnShadow: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 20,
    transform: [{ translateX: 0 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  navigationButtons: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 10,
  },
  navButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  prevPageButton: {
    marginLeft: 8,
  },
  nextPageButton: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.3,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  bottomNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pageJumpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageJumpButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    color: '#555',
    fontSize: 16,
    fontWeight: '500',
  },
  preloadContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  preloadPdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default EnhancedPdfViewer; 