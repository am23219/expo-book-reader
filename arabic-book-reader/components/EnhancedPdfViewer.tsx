import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import Pdf from 'react-native-pdf';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';

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

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D8A4E" />
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
          renderActivityIndicator={(progress) => <ActivityIndicator size="large" color="#0D8A4E" />}
          enableAntialiasing={true}
          trustAllCerts={false}
          enableRTL={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage >= totalPages ? styles.navButtonDisabled : styles.navButtonLeft]}
          onPress={() => {
            if (currentPage < totalPages) {
              onPageChange(currentPage + 1);
            }
          }}
          disabled={currentPage >= totalPages}
        >
          <Ionicons name="chevron-back" size={22} color={currentPage >= totalPages ? "transparent" : "#0D8A4E"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentPage <= 1 ? styles.navButtonDisabled : styles.navButtonRight]}
          onPress={() => {
            if (currentPage > 1) {
              onPageChange(currentPage - 1);
            }
          }}
          disabled={currentPage <= 1}
        >
          <Ionicons name="chevron-forward" size={22} color={currentPage <= 1 ? "transparent" : "#0D8A4E"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5EB',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#F9F5EB',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 245, 235, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#0D8A4E',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
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
    width: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingLeft: 3,
  },
  navButtonRight: {
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingRight: 3,
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
  },
});

export default EnhancedPdfViewer;
