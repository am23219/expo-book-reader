import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
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
  khatmCount
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Barakaat Makiyyah</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#4A6E8A" />
        </TouchableOpacity>
      </View>
      
      {khatmCount > 0 && (
        <View style={styles.khatmCountContainer}>
          <Text style={styles.khatmCountLabel}>Completions</Text>
          <Text style={styles.khatmCount}>{khatmCount}</Text>
        </View>
      )}
      
      <ScrollView style={styles.sectionsContainer}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionItem,
              currentSectionId === section.id && styles.currentSection
            ]}
            onPress={() => onSectionPress(section)}
          >
            <View style={styles.sectionInfo}>
              <Text style={[
                styles.sectionTitle,
                currentSectionId === section.id && styles.currentSectionText,
                section.isCompleted && styles.completedSectionText
              ]}>
                {section.title}
              </Text>
              <Text style={styles.pageRange}>
                Pages {section.startPage}-{section.endPage}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.checkButton,
                section.isCompleted && styles.checkedButton
              ]}
              onPress={() => onToggleComplete(section.id)}
            >
              <Ionicons
                name={section.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={section.isCompleted ? "#4CAF50" : "#aaa"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Track your progress through the book
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D3',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A6E8A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  closeButton: {
    padding: 4,
  },
  khatmCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F4F8',
  },
  khatmCountLabel: {
    fontSize: 16,
    color: '#4A6E8A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  khatmCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D8A4E',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  sectionsContainer: {
    flex: 1,
  },
  sectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D3',
  },
  currentSection: {
    backgroundColor: 'rgba(90, 158, 191, 0.1)',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6E8A',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  currentSectionText: {
    color: '#5A9EBF',
    fontWeight: '700',
  },
  completedSectionText: {
    color: '#4CAF50',
  },
  pageRange: {
    fontSize: 14,
    color: '#8A7E6A',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  checkButton: {
    padding: 8,
  },
  checkedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E2D3',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8A7E6A',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
});

export default SectionNavigation; 