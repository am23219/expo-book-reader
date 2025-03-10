import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';

interface PageViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PageViewer: React.FC<PageViewerProps> = ({ currentPage, onPageChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = Dimensions.get('window');
  
  // PDF source - adjust the path to your actual PDF file
  const source = { uri: 'bundle-assets://pdf/Barakaat_Makiyyah.pdf', cache: true };
  
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
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
      
      <Pdf
        source={source}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`PDF loaded with ${numberOfPages} pages`);
          setLoading(false);
        }}
        onPageChanged={(page) => {
          onPageChange(page);
        }}
        onError={(error) => {
          console.log('PDF error:', error);
          setLoading(false);
          setError(error.toString());
        }}
        page={currentPage}
        style={styles.pdf}
        enablePaging={true}
      />
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
    fontSize: 16,
    color: '#0066cc',
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
  pdfWrapper: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.4,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default PageViewer;
