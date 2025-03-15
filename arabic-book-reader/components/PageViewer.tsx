import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section, SECTIONS } from '../models/Section';

export interface PageViewerProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  currentSection: Section;
}

const PageViewer: React.FC<PageViewerProps> = ({ currentPage, onPageChange, currentSection }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width, height } = Dimensions.get('window');
  
  // Get the maximum page from the last section's endPage in the SECTIONS model
  const MAX_PAGE = SECTIONS[SECTIONS.length - 1].endPage;
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    // Use the maximum page determined from the model
    if (currentPage < MAX_PAGE) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageContainer}>
            <View style={styles.pageContent}>
              <Text style={styles.sectionTitle}>
                {currentSection.title}
              </Text>
              <Text style={styles.pageNumber}>Page {currentPage}</Text>
              
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>
                  The enhanced PDF viewer could not load the book file.
                </Text>
                <Text style={styles.placeholderSubtext}>
                  You can continue to navigate between pages using the arrows below.
                </Text>
                
                <View style={styles.pageNavigation}>
                  <View style={styles.pageNavigationInner}>
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage <= 1 && styles.disabledButton]}
                      onPress={handlePrevPage}
                      disabled={currentPage <= 1}
                    >
                      <Ionicons name="arrow-back" size={24} color={currentPage <= 1 ? "#ccc" : "#5A9EBF"} />
                      <Text style={[styles.pageButtonText, currentPage <= 1 && styles.disabledText]}>Previous</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.pageIndicator}>
                      <Text style={styles.pageIndicatorText}>
                        {currentPage} / {MAX_PAGE}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.pageButton, currentPage >= MAX_PAGE && styles.disabledButton]}
                      onPress={handleNextPage}
                      disabled={currentPage >= MAX_PAGE}
                    >
                      <Text style={[styles.pageButtonText, currentPage >= MAX_PAGE && styles.disabledText]}>Next</Text>
                      <Ionicons name="arrow-forward" size={24} color={currentPage >= MAX_PAGE ? "#ccc" : "#5A9EBF"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Left navigation button */}
      <View style={styles.leftNavButtonContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage <= 1 && styles.disabledButton]} 
          onPress={handlePrevPage}
          disabled={currentPage <= 1}
        >
          <Ionicons 
            name="chevron-back" 
            size={28} 
            color={currentPage <= 1 ? "#ccc" : "#5A9EBF"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Right navigation button */}
      <View style={styles.rightNavButtonContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentPage >= MAX_PAGE && styles.disabledButton]} 
          onPress={handleNextPage}
          disabled={currentPage >= MAX_PAGE}
        >
          <Ionicons 
            name="chevron-forward" 
            size={28} 
            color={currentPage >= MAX_PAGE ? "#ccc" : "#5A9EBF"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EB',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066cc',
  },
  pageContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageContent: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A9EBF',
    marginBottom: 10,
    textAlign: 'center',
  },
  pageNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  placeholderContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  placeholderText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  pageNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  pageNavigationInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5A9EBF',
  },
  pageButtonText: {
    color: '#5A9EBF',
    marginHorizontal: 5,
    fontWeight: '500',
  },
  pageIndicator: {
    padding: 10,
  },
  pageIndicatorText: {
    color: '#5A9EBF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  pageText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  leftNavButtonContainer: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  rightNavButtonContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#ccc',
  },
});

export default PageViewer;
