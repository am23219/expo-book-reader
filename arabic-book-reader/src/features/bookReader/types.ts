/**
 * Types for the book reader feature
 */
import { Book } from '../../types';

export interface BookReaderProps {
  book: Book;
  onClose?: () => void;
}

export interface PageViewerProps {
  uri: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface AudioPlayerProps {
  audioUri?: string;
  isVisible: boolean;
  onClose: () => void;
}

export interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export interface SectionNavigationProps {
  sections: BookSection[];
  currentSection: number;
  onSectionChange: (sectionIndex: number) => void;
}

export interface BookSection {
  id: string;
  title: string;
  pageNumber: number;
} 