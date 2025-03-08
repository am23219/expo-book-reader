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
  
  // Add a reference to the PDF component
  const pdfRef = useRef<Pdf>(null);
  
  // Track if we're handling an internal page change
  const [isInternalPageChange, setIsInternalPageChange] = useState(false);
  
  // Handle navigation to previous page (in RTL, this means going to a higher page number)
  const goToPreviousPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Handle navigation to next page (in RTL, this means going to a lower page number)
  const goToNextPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // Update PDF page when currentPage prop changes
  useEffect(() => {
    if (pdfRef.current && !loading) {
      setIsInternalPageChange(true);
      pdfRef.current.setPage(currentPage);
    }
  }, [currentPage, loading]);

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
      
      {/* PDF component with ref */}
      <Pdf
        ref={pdfRef}
        source={source}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`PDF loaded with ${numberOfPages} pages`);
          setLoading(false);
          setTotalPages(numberOfPages);
          
          // Set initial page after load
          if (pdfRef.current && currentPage > 1) {
            setTimeout(() => {
              pdfRef.current?.setPage(currentPage);
            }, 100);
          }
        }}
        onPageChanged={(page) => {
          console.log(`PDF page changed to: ${page}, isInternalChange: ${isInternalPageChange}`);
          
          // Only call onPageChange if this wasn't triggered by our own setPage call
          if (!isInternalPageChange) {
            // Add a small delay to ensure state updates properly
            setTimeout(() => {
              onPageChange(page);
            }, 50);
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
        renderActivityIndicator={() => null}
        enableAntialiasing={true}
        trustAllCerts={false}
        enableRTL={true}
        showsHorizontalScrollIndicator={true}
      />
      
      {/* Page navigation buttons - more subtle */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage >= totalPages ? styles.navButtonDisabled : styles.navButtonLeft]}
          onPress={goToPreviousPage}
          disabled={currentPage >= totalPages}
        >
          <Ionicons name="chevron-back" size={22} color={currentPage >= totalPages ? "transparent" : "#0D8A4E"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentPage <= 1 ? styles.navButtonDisabled : styles.navButtonRight]}
          onPress={goToNextPage}
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
    backgroundColor: '#f8f9fa',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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