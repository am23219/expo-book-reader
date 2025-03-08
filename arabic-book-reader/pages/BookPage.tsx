import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Animated, Dimensions, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PageViewer from '../components/PageViewer';
import AudioPlayer from '../components/SimpleAudioPlayer';
import SectionNavigation from '../components/SectionNavigation';
import { Section, SECTIONS } from '../models/Section';
import { loadSections, saveSections, loadCurrentPage, saveCurrentPage } from '../utils/storage';
import EnhancedPdfViewer from '../components/EnhancedPdfViewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Confetti from '../components/Confetti';
import { Audio } from 'expo-av';
import SimpleAudioPlayer from '../components/SimpleAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShakeView from '../components/ShakeView';

export default function BookPage() {
  const [sections, setSections] = useState<Section[]>(SECTIONS);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSection, setCurrentSection] = useState<Section>(SECTIONS[0]);
  const [isSectionDrawerOpen, setIsSectionDrawerOpen] = useState(false);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [khatmCount, setKhatmCount] = useState(0);
  const [showKhatmModal, setShowKhatmModal] = useState(false);
  const [showManzilConfetti, setShowManzilConfetti] = useState(false);
  const [showKhatmConfetti, setShowKhatmConfetti] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [shakeKhatmModal, setShakeKhatmModal] = useState(false);
  const [manzilCompletionColors, setManzilCompletionColors] = useState<string[]>([
    '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'
  ]);
  const [khatmCompletionColors, setKhatmCompletionColors] = useState<string[]>([
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', 
    '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
  ]);
  
  const sectionDrawerAnim = useRef(new Animated.Value(-280)).current;
  const { height, width } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  
  // Estimate bottom insets based on device dimensions and platform
  const estimatedBottomInset = Platform.OS === 'ios' && height > 800 ? 34 : 0;
  
  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSections = await loadSections();
        const savedPage = await loadCurrentPage();
        const savedKhatmCount = await AsyncStorage.getItem('khatm_count');
        
        // Find the section that contains the current page BEFORE setting state
        const section = findSectionByPage(savedSections, savedPage);
        
        // Set all states at once to avoid UI inconsistency
        setSections(savedSections);
        setCurrentPage(savedPage);
        setCurrentSection(section); // Set the correct section
        setKhatmCount(savedKhatmCount ? parseInt(savedKhatmCount) : 0);
        
        console.log(`Initial load - Page: ${savedPage}, Section: ${section.title} (${section.startPage}-${section.endPage})`);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to defaults if there's an error
        setCurrentPage(1);
        setCurrentSection(SECTIONS[0]);
      }
    };
    
    loadData();
  }, []);
  
  // Find which section contains a specific page - improved logic
  const findSectionByPage = (sectionList: Section[], page: number): Section => {
    console.log(`Finding section for page ${page}`);
    
    // First check if this page is the startPage of any section
    // If it is, prioritize the section that's starting
    for (const section of sectionList) {
      if (page === section.startPage) {
        console.log(`Page ${page} is the start page of ${section.title}`);
        return section;
      }
    }
    
    // If not a start page, then check which section's range contains this page
    for (const section of sectionList) {
      // Check if page is within this section's range (inclusive of start, exclusive of end except for the last section)
      if (section.id === sectionList.length && page >= section.startPage && page <= section.endPage) {
        // Special case for the last section - include the end page
        console.log(`Page ${page} is within range of last section ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      } else if (page >= section.startPage && page < section.endPage) {
        console.log(`Page ${page} is within range of ${section.title} (${section.startPage}-${section.endPage})`);
        return section;
      }
    }
    
    // If we're past all sections, return the last section
    if (page > sectionList[sectionList.length - 1].endPage) {
      console.log(`Page ${page} is past all sections, returning last section`);
      return sectionList[sectionList.length - 1];
    }
    
    // Default to first section
    console.log(`Page ${page} defaulting to first section`);
    return sectionList[0];
  };
  
  // Handle page changes with improved section detection
  const handlePageChange = (page: number) => {
    console.log(`handlePageChange called with page: ${page}`);
    
    // Validate page number to prevent invalid values
    if (page < 1 || page > 150) {
      console.warn(`Invalid page number: ${page}, ignoring change`);
      return;
    }
    
    // Find the correct section for this page
    const section = findSectionByPage(sections, page);
    console.log(`Found section for page ${page}: ${section.title} (${section.startPage}-${section.endPage})`);
    
    // Update state and save to storage
    setCurrentPage(page);
    saveCurrentPage(page);
    
    // Always update the section if it's different
    if (section.id !== currentSection.id) {
      console.log(`Section changed from ${currentSection.title} to ${section.title}`);
      setCurrentSection(section);
      
      // Check if we've completed a section
      if (page === section.endPage && !section.isCompleted) {
        handleSectionCompletion(section);
      }
    }
  };
  
  // Add debug logging to help track issues
  useEffect(() => {
    console.log(`Current page: ${currentPage}`);
    console.log(`Current section: ${currentSection.title} (${currentSection.startPage}-${currentSection.endPage})`);
  }, [currentPage, currentSection]);
  
  // Handle section selection
  const handleSectionPress = (section: Section) => {
    setCurrentSection(section);
    setCurrentPage(section.startPage);
    toggleSectionDrawer(); // Close drawer after selection
  };
  
  // Clean up sound when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);
  
  // Enhanced section completion handler
  const handleSectionCompletion = (section: Section) => {
    console.log(`Section ${section.title} completed!`);
    
    // Update sections
    const updatedSections = sections.map(s => 
      s.id === section.id ? { ...s, isCompleted: true } : s
    );
    
    setSections(updatedSections);
    saveSections(updatedSections);
    
    // Celebrate manzil completion with haptics and confetti
    celebrateManzilCompletion();
    
    // Check if all sections are completed
    checkKhatmCompletion(updatedSections);
  };
  
  // Celebrate manzil completion
  const celebrateManzilCompletion = async () => {
    // Play haptic feedback - pattern for manzil completion
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);
    } else {
      // For Android, use impact feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);
    }
    
    // Show confetti
    setShowManzilConfetti(true);
    
    // Hide confetti after a few seconds
    setTimeout(() => {
      setShowManzilConfetti(false);
    }, 3000);
  };
  
  // Enhanced khatm completion check
  const checkKhatmCompletion = (updatedSections: Section[]) => {
    const allCompleted = updatedSections.every(section => section.isCompleted);
    
    if (allCompleted) {
      // Increment khatm count
      const newKhatmCount = khatmCount + 1;
      setKhatmCount(newKhatmCount);
      AsyncStorage.setItem('khatm_count', newKhatmCount.toString());
      
      // Reset all sections to not completed
      const resetSections = updatedSections.map(section => ({
        ...section,
        isCompleted: false
      }));
      
      setSections(resetSections);
      saveSections(resetSections);
      
      // Show congratulatory modal and confetti
      setShowKhatmModal(true);
      setShowKhatmConfetti(true);
      
      // Activate shake animation
      setShakeKhatmModal(true);
      
      // Reset shake after animation completes
      setTimeout(() => {
        setShakeKhatmModal(false);
      }, 2000);
      
      // Provide stronger haptic feedback for khatm achievement
      celebrateKhatmCompletion();
    }
  };
  
  // Celebrate khatm completion with enhanced haptics
  const celebrateKhatmCompletion = async () => {
    // Create a more complex haptic pattern for khatm completion
    if (Platform.OS === 'ios') {
      // iOS has more haptic options
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 300);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 600);
      
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 900);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 1200);
    } else {
      // Android fallback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 300);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 600);
      
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 900);
    }
  };
  
  // Toggle section completion status
  const handleToggleComplete = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    const wasCompleted = section?.isCompleted || false;
    
    const updatedSections = sections.map(section => 
      section.id === sectionId 
        ? { ...section, isCompleted: !section.isCompleted } 
        : section
    );
    
    setSections(updatedSections);
    saveSections(updatedSections);
    
    // If section was just completed (not uncompleted)
    if (!wasCompleted && section) {
      // Celebrate manzil completion
      celebrateManzilCompletion();
    }
    
    // Check if all sections are completed
    checkKhatmCompletion(updatedSections);
  };
  
  // Toggle section drawer
  const toggleSectionDrawer = () => {
    Animated.timing(sectionDrawerAnim, {
      toValue: isSectionDrawerOpen ? -280 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsSectionDrawerOpen(!isSectionDrawerOpen);
  };
  
  // Toggle audio modal
  const toggleAudioModal = () => {
    setIsAudioModalVisible(!isAudioModalVisible);
  };
  
  // Update current section whenever current page changes
  useEffect(() => {
    // Only run this effect after initial load
    if (currentPage > 0) {
      const section = findSectionByPage(sections, currentPage);
      if (section.id !== currentSection.id) {
        console.log(`Updating section for page ${currentPage} from ${currentSection.title} to ${section.title}`);
        setCurrentSection(section);
      }
    }
  }, [currentPage, sections]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header with improved compact design */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSectionDrawer}>
          <Ionicons name="menu" size={22} color="#0D8A4E" />
        </TouchableOpacity>
        
        <View style={styles.pageIndicator}>
          <View style={styles.titleProgressContainer}>
            <Text style={styles.pageIndicatorText}>
              {currentSection.title}
            </Text>
            <Text style={styles.progressText}>
              {currentPage - currentSection.startPage + 1}/{currentSection.endPage - currentSection.startPage + 1}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${Math.max(0, Math.min(100, ((currentPage - currentSection.startPage + 1) / 
                    (currentSection.endPage - currentSection.startPage + 1)) * 100))}%` 
                }
              ]} 
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={toggleAudioModal}>
          <Ionicons name="musical-notes" size={22} color="#0D8A4E" />
        </TouchableOpacity>
      </View>
      
      {/* PDF Viewer */}
      <View style={styles.content}>
        {useFallbackViewer ? (
          <PageViewer 
            currentPage={currentPage} 
            onPageChange={handlePageChange}
            currentSection={currentSection}
          />
        ) : (
          <EnhancedPdfViewer 
            currentPage={currentPage} 
            onPageChange={handlePageChange}
            onError={() => setUseFallbackViewer(true)}
            currentSection={currentSection}
          />
        )}
      </View>
      
      {/* Section Navigation Drawer */}
      <Animated.View 
        style={[
          styles.sectionDrawer, 
          { 
            transform: [{ translateX: sectionDrawerAnim }],
            paddingTop: insets.top
          }
        ]}
      >
        <SectionNavigation 
          sections={sections}
          currentSectionId={currentSection.id}
          onSectionPress={handleSectionPress}
          onToggleComplete={handleToggleComplete}
          onClose={toggleSectionDrawer}
          khatmCount={khatmCount}
        />
      </Animated.View>
      
      {/* Audio Modal */}
      {isAudioModalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1} 
            onPress={toggleAudioModal}
          />
          <View style={styles.audioModal}>
            <View style={styles.audioModalHeader}>
              <Text style={styles.audioModalTitle}>{currentSection.title} Audio</Text>
              <TouchableOpacity onPress={toggleAudioModal}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            <View style={styles.audioPlayerContent}>
              <SimpleAudioPlayer 
                currentSection={currentSection}
                sections={sections}
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Khatm Completion Modal with Shake Animation */}
      {showKhatmModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1} 
            onPress={() => {
              setShowKhatmModal(false);
              setShowKhatmConfetti(false);
            }}
          />
          <ShakeView shake={shakeKhatmModal} intensity={10} count={5} style={styles.modal}>
            <Text style={styles.modalTitle}>Khatm Completed!</Text>
            <Text style={styles.modalText}>
              Congratulations! You have completed a full reading of Barakaat Makiyyah.
            </Text>
            <Text style={styles.modalSubText}>
              May Allah accept your efforts and bless you.
            </Text>
            
            <View style={styles.khatmBadge}>
              <Text style={styles.khatmBadgeText}>{khatmCount}</Text>
              <Text style={styles.khatmBadgeLabel}>Completions</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowKhatmModal(false);
                setShowKhatmConfetti(false);
              }}
            >
              <Text style={styles.modalButtonText}>Continue Reading</Text>
            </TouchableOpacity>
          </ShakeView>
        </View>
      )}
      
      {/* Enhanced Confetti Effects */}
      {showManzilConfetti && 
        <Confetti 
          count={50} 
          duration={3000} 
          colors={manzilCompletionColors}
          size={{ min: 5, max: 12 }}
        />
      }
      
      {showKhatmConfetti && 
        <Confetti 
          count={150} 
          duration={6000} 
          colors={khatmCompletionColors}
          size={{ min: 8, max: 20 }}
        />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  menuButton: {
    padding: 6,
  },
  pageIndicator: {
    flex: 1,
    marginHorizontal: 8,
  },
  titleProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: '#343a40',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0D8A4E',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
  },
  pdfContainer: {
    flex: 1,
  },
  sectionDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#ffffff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    paddingTop: 50, // Adjust based on your safe area
  },
  audioModal: {
    position: 'absolute',
    top: '50%',
    left: '5%',
    right: '5%',
    transform: [{ translateY: -150 }],
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  audioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  audioModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
  },
  audioPlayerContent: {
    flex: 1,
    padding: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D8A4E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: '#343a40',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalSubText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  khatmBadge: {
    backgroundColor: '#f8f9fa',
    borderRadius: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#0D8A4E',
  },
  khatmBadgeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0D8A4E',
  },
  khatmBadgeLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  modalButton: {
    backgroundColor: '#0D8A4E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
