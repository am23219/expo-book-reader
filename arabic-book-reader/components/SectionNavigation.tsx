import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Section } from '../models/Section';

interface SectionNavigationProps {
  sections: Section[];
  currentSectionId: number;
  onSectionPress: (section: Section) => void;
  onToggleComplete: (sectionId: number) => void;
  onClose: () => void;
  khatmCount: number;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  currentSectionId,
  onSectionPress,
  onToggleComplete,
  onClose,
  khatmCount,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manzils</Text>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#5A9EBF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.khatmCountContainer}>
        <Text style={styles.khatmCountLabel}>Khatm Completions:</Text>
        <Text style={styles.khatmCount}>{khatmCount}</Text>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => (
          <View key={section.id} style={styles.sectionItem}>
            <TouchableOpacity
              style={[
                styles.sectionButton,
                currentSectionId === section.id && styles.activeSectionButton,
                section.isCompleted && styles.completedSectionButton,
              ]}
              onPress={() => onSectionPress(section)}
            >
              <Text 
                style={[
                  styles.sectionText,
                  currentSectionId === section.id && styles.activeSectionText,
                  section.isCompleted && styles.completedSectionText,
                ]}
              >
                {section.title}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => onToggleComplete(section.id)}
            >
              <Ionicons 
                name={section.isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={section.isCompleted ? "#5A9EBF" : "#6c757d"} 
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EB',
    width: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F5F1E0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A6E8A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeSectionButton: {
    backgroundColor: '#E6F2FF',
    borderLeftWidth: 4,
    borderLeftColor: '#5A9EBF',
  },
  completedSectionButton: {
    backgroundColor: '#F0F8FF',
  },
  sectionText: {
    fontSize: 16,
    color: '#495057',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  activeSectionText: {
    color: '#5A9EBF',
    fontWeight: '600',
  },
  completedSectionText: {
    color: '#5A9EBF',
  },
  completeButton: {
    padding: 10,
    marginLeft: 10,
  },
  khatmCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F0F8FF',
  },
  khatmCountLabel: {
    fontSize: 16,
    color: '#4A6E8A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  khatmCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A9EBF',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  modal: {
    width: '80%',
    backgroundColor: '#F9F5EB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A9EBF',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#343a40',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#5A9EBF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SectionNavigation; 