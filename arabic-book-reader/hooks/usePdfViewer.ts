import { useState } from 'react';
import { Section } from '../models/Section';

export interface PdfViewerState {
  useFallbackViewer: boolean;
  isAudioModalVisible: boolean;
}

export interface PdfViewerActions {
  setUseFallbackViewer: (useFallback: boolean) => void;
  toggleAudioModal: () => void;
}

/**
 * Custom hook for managing the PDF viewer
 */
export const usePdfViewer = (): [PdfViewerState, PdfViewerActions] => {
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);

  // Toggle audio modal
  const toggleAudioModal = () => {
    setIsAudioModalVisible(!isAudioModalVisible);
  };

  return [
    {
      useFallbackViewer,
      isAudioModalVisible
    },
    {
      setUseFallbackViewer,
      toggleAudioModal
    }
  ];
}; 