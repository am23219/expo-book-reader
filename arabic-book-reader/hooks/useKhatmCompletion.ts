import { useState, useEffect } from 'react';
import { Section } from '../models/Section';
import * as Haptics from 'expo-haptics';
import { getOrdinalSuffix } from '../utils/dateUtils';

export interface KhatmCompletionData {
  khatmCount: number;
  notificationData: {
    title: string;
    isKhatm: boolean;
    message: string;
  };
  showNotification: boolean;
}

export interface KhatmCompletionActions {
  checkKhatmCompletion: (sections: Section[]) => Promise<Section[]>;
  completeKhatm: (sections: Section[]) => Promise<Section[]>;
  setShowNotification: (show: boolean) => void;
  setNotificationData: (data: { title: string; isKhatm: boolean; message: string }) => void;
}

/**
 * Custom hook for managing Khatm completion
 */
export const useKhatmCompletion = (
  currentStreak: number
): [KhatmCompletionData, KhatmCompletionActions] => {
  const [khatmCount, setKhatmCount] = useState(0);
  const [notificationData, setNotificationData] = useState({
    title: '',
    isKhatm: false,
    message: ''
  });
  const [showNotification, setShowNotification] = useState(false);

  // Check if all sections are completed
  const checkKhatmCompletion = async (sections: Section[]): Promise<Section[]> => {
    // Check if all sections are completed
    const allCompleted = sections.every(section => section.isCompleted);
    
    if (allCompleted) {
      console.log('Khatm completed!');
      
      // Increment khatm count
      const newKhatmCount = khatmCount + 1;
      setKhatmCount(newKhatmCount);
      
      // Reset all sections for next khatm - explicitly clear completionDate
      const resetSections = sections.map(section => ({
        ...section,
        isCompleted: false,
        completionDate: undefined
      }));
      
      // Stronger vibration pattern for khatm
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
      
      // Set notification data for khatm completion
      let message = '';
      if (currentStreak > 1) {
        message = `Congratulations on your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} completion! You're on a ${currentStreak}-day streak. May Allah bless your dedication.`;
      } else {
        message = `Congratulations on completing your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} read-through! May Allah accept your efforts.`;
      }
      
      setNotificationData({
        title: `Khatm #${newKhatmCount} Completed!`,
        isKhatm: true,
        message
      });
      
      // Show notification
      setShowNotification(true);
      
      return resetSections;
    }
    
    return sections;
  };

  // Handle complete khatm button press
  const completeKhatm = async (sections: Section[]): Promise<Section[]> => {
    try {
      // Get all sections and mark them as completed
      const completedSections = sections.map(section => ({
        ...section,
        isCompleted: true,
        completionDate: new Date()
      }));
      
      // Increment khatm count
      const newKhatmCount = khatmCount + 1;
      setKhatmCount(newKhatmCount);
      
      // Stronger vibration pattern for khatm
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
      
      // Set notification data for khatm completion
      let message = '';
      if (currentStreak > 1) {
        message = `Congratulations on your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} completion! You're on a ${currentStreak}-day streak. May Allah bless your dedication.`;
      } else {
        message = `Congratulations on completing your ${newKhatmCount}${getOrdinalSuffix(newKhatmCount)} read-through! May Allah accept your efforts.`;
      }
      
      setNotificationData({
        title: `Khatm #${newKhatmCount} Completed!`,
        isKhatm: true,
        message
      });
      
      // Show notification
      setShowNotification(true);
      
      // Reset sections after a delay
      const resetSections = completedSections.map(section => ({
        ...section,
        isCompleted: false,
        completionDate: undefined
      }));
      
      return resetSections;
    } catch (error) {
      console.error('Error completing khatm:', error);
      return sections;
    }
  };

  // Set notification data
  const updateNotificationData = (data: { title: string; isKhatm: boolean; message: string }) => {
    setNotificationData(data);
  };

  return [
    {
      khatmCount,
      notificationData,
      showNotification
    },
    {
      checkKhatmCompletion,
      completeKhatm,
      setShowNotification,
      setNotificationData: updateNotificationData
    }
  ];
}; 