import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
          <Ionicons name="close" size={24} color="#0D8A4E" />
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
                color={section.isCompleted ? "#0D8A4E" : "#6c757d"} 
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  activeSectionButton: {
    backgroundColor: '#e6f2ff',
  },
  completedSectionButton: {
    backgroundColor: '#f0fff4',
  },
  sectionText: {
    fontSize: 16,
    color: '#495057',
  },
  activeSectionText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  completedSectionText: {
    color: '#28a745',
  },
  completeButton: {
    padding: 8,
    marginLeft: 8,
  },
  khatmCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  khatmCountLabel: {
    fontSize: 14,
    color: '#495057',
  },
  khatmCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
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
    backgroundColor: '#ffffff',
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
    color: '#28a745',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#343a40',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#0066cc',
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