import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Section } from '../models/Section';

/**
 * Custom hook to manage the storage and retrieval of completed sections
 * This is used by the reading calendar to show manzil completion data
 */
export const useCompletedSections = (): [
  Section[],
  (section: Section) => Promise<void>
] => {
  const [completedSections, setCompletedSections] = useState<Section[]>([]);

  // Load completed sections on mount
  useEffect(() => {
    loadCompletedSections();
  }, []);

  // Load previously saved completed sections
  const loadCompletedSections = async () => {
    try {
      const savedSections = await AsyncStorage.getItem('completed_sections');
      if (savedSections) {
        const sections = JSON.parse(savedSections).map((section: Section) => ({
          ...section,
          completionDate: section.completionDate ? new Date(section.completionDate) : undefined
        }));
        setCompletedSections(sections);
      }
    } catch (error) {
      console.error('Error loading completed sections:', error);
    }
  };

  // Add a new completed section or update an existing one
  const addCompletedSection = async (section: Section) => {
    try {
      // Make sure the section has a completion date
      const completedSection = {
        ...section,
        isCompleted: true,
        completionDate: section.completionDate || new Date()
      };

      // Check if this section is already in our list
      const existingIndex = completedSections.findIndex(s => s.id === section.id);
      let updatedSections: Section[];

      if (existingIndex >= 0) {
        // Update existing section
        updatedSections = [...completedSections];
        updatedSections[existingIndex] = completedSection;
      } else {
        // Add new section
        updatedSections = [...completedSections, completedSection];
      }

      // Update state and storage
      setCompletedSections(updatedSections);
      await AsyncStorage.setItem(
        'completed_sections',
        JSON.stringify(updatedSections.map(s => ({
          ...s,
          completionDate: s.completionDate ? s.completionDate.toISOString() : undefined
        })))
      );
    } catch (error) {
      console.error('Error saving completed section:', error);
    }
  };

  return [completedSections, addCompletedSection];
};

export default useCompletedSections; 